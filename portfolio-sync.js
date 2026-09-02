/**
 * ==============================================================================
 * PORTFOLIO CLOUD SYNC  (window.PortfolioSync)
 * ==============================================================================
 * Publishes admin edits to a single shared Firestore document (portfolio/main)
 * so a change saved on ONE device appears on EVERY device. Without this, Edit
 * Mode only writes to the current browser's localStorage, so edits never leave
 * the machine they were made on.
 *
 *   READ  (every visitor, public):  a live listener applies the published copy.
 *   WRITE (admin Save):             uploads the current data — but only when the
 *                                   admin is signed in with Google. Firestore
 *                                   security rules allow public reads and lock
 *                                   writes to the owner's account, so the SHA-256
 *                                   passcode alone cannot publish (it creates no
 *                                   Firebase identity). Passcode sessions still
 *                                   save locally.
 *
 * Everything here is wrapped so that if Firestore is missing, blocked, offline,
 * or its rules deny access, the site behaves exactly as it did before (local
 * localStorage only) with zero console errors.
 *
 * Loaded after firebase-config.js (which initialises the Firebase app) and runs
 * its listener on DOMContentLoaded, by which point render.js has defined
 * window.PortfolioRender and window.portfolioData.
 * ==============================================================================
 */
(function () {
  'use strict';

  var COLLECTION = 'portfolio';
  var DOC_ID = 'main';
  // Firestore caps a document at ~1 MiB. Uploaded photos are stored inline as
  // base64 data-URLs inside portfolioData, so a data set with photos can exceed
  // that. Stay comfortably under the cap; strip big photos past this size.
  var MAX_DOC_CHARS = 900000;

  var db = null;
  var docRef = null;
  var started = false;
  // How long to wait for a publish to be confirmed by the server before giving
  // up. Firestore queues writes while offline and the set() promise stays
  // PENDING until it reconnects — without this, the caller's "publishing…"
  // state would hang forever when offline or before the API is enabled.
  var PUBLISH_TIMEOUT_MS = 8000;
  // Signature of the data currently shown, so an incoming snapshot that matches
  // (including the echo of our own write) causes no re-render / no flicker.
  var lastAppliedSig = null;

  /** Lazily grab Firestore; returns null if the SDK isn't present. */
  function getDb() {
    if (db) return db;
    try {
      if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') return null;
      db = firebase.firestore();
      docRef = db.collection(COLLECTION).doc(DOC_ID);
      return db;
    } catch (e) {
      return null;
    }
  }

  function sigOf(obj) {
    try { return JSON.stringify(obj); } catch (e) { return null; }
  }

  /** Read a dotted path out of an object (mirrors script.js's getNested). */
  function getNested(obj, path) {
    return path.split('.').reduce(function (acc, part) { return acc && acc[part]; }, obj);
  }

  /**
   * Re-apply the static [data-edit-key] text and [data-img-key] images from the
   * current window.portfolioData. Mirrors script.js's one-time hydration so a
   * cloud update refreshes headers, section tags, descriptions and photos — not
   * just the list sections (which PortfolioRender handles).
   */
  function hydrateStatic() {
    var data = window.portfolioData || {};
    try {
      document.querySelectorAll('[data-edit-key]').forEach(function (el) {
        var val = getNested(data, el.getAttribute('data-edit-key'));
        if (val === undefined || val === null) return;
        if (el.getAttribute('data-is-html') === 'true') el.innerHTML = val;
        else el.textContent = val;
      });
      document.querySelectorAll('img[data-img-key]').forEach(function (img) {
        var src = getNested(data, img.getAttribute('data-img-key'));
        if (src) img.src = src; // falsy (e.g. a stripped photo) keeps the shipped default
      });
    } catch (e) { /* never let a hydration hiccup break the page */ }
  }

  /** Apply a full portfolioData object from the cloud, in place (no reload). */
  function applyData(data) {
    if (!data) return;
    var sig = sigOf(data);
    if (sig && sig === lastAppliedSig) return; // unchanged → nothing to do

    // Never overwrite an admin who is mid-edit; their local state wins until Save.
    var ed = window.portfolioEditor;
    if (ed && ed.isEditing) return;

    // Keep the cached copy "current" so portfolio-data.js's version gate never
    // discards it — the cloud doc is the source of truth once it exists.
    try {
      if (window.PORTFOLIO_DATA_VERSION) data.dataVersion = window.PORTFOLIO_DATA_VERSION;
    } catch (e) {}

    window.portfolioData = data;
    lastAppliedSig = sig;

    hydrateStatic();
    try {
      if (window.PortfolioRender && typeof window.PortfolioRender.refresh === 'function') {
        // Rebuilds every list, re-hooks the 3D tilt/fly-in, and persists to
        // localStorage (so the next first-paint already shows published content).
        window.PortfolioRender.refresh('all');
      } else {
        localStorage.setItem('custom_portfolio_data', JSON.stringify(data));
      }
    } catch (e) { /* no-op */ }
  }

  /**
   * Deep-clone `data`, replacing large base64 image data-URLs with '' so the
   * document fits under the Firestore size limit. Consumers fall back to their
   * shipped default image when a value is empty (render.js:194, script.js skips
   * falsy src), so stripping never produces a broken image — only photos that
   * were uploaded inline won't cross devices. Returns { data, stripped }.
   */
  function toCloudSafe(data) {
    var stripped = false;
    var clone;
    try { clone = JSON.parse(JSON.stringify(data)); }
    catch (e) { return { data: data, stripped: false }; }
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      Object.keys(node).forEach(function (k) {
        var v = node[k];
        if (typeof v === 'string') {
          if (/^data:/i.test(v)) { node[k] = ''; stripped = true; }
        } else if (v && typeof v === 'object') {
          walk(v);
        }
      });
    })(clone);
    return { data: clone, stripped: stripped };
  }

  /**
   * Start listening for published content. Safe to call once; further calls are
   * ignored. Called automatically on load.
   */
  function load() {
    if (started) return;
    if (!getDb()) return; // Firestore SDK absent → stay local-only, silently
    started = true;

    // Seed the signature from what's already on screen (localStorage/defaults)
    // so a first snapshot that matches doesn't trigger a needless re-render.
    lastAppliedSig = sigOf(window.portfolioData);

    try {
      docRef.onSnapshot(
        function (snap) {
          try {
            if (!snap || !snap.exists) return;
            var payload = snap.data();
            if (payload && payload.data) applyData(payload.data);
          } catch (e) { /* ignore a malformed snapshot */ }
        },
        function () { /* permission denied / offline → keep local behaviour */ }
      );
    } catch (e) { /* no-op */ }
  }

  /**
   * Publish the current data to all devices. The caller (editor Save) has
   * already written localStorage, so the local copy is never at risk.
   * Resolves { published:true, stripped } on success. Rejects with an Error
   * whose message is a code the caller maps to a message:
   *   'sync-unavailable'   Firestore SDK not loaded
   *   'not-authenticated'  no Google admin session (passcode-only can't publish)
   *   'too-large'          still over the size cap even after stripping photos
   *   (anything else)      network / rules / Firestore error
   */
  function save(data) {
    return new Promise(function (resolve, reject) {
      try {
        if (!getDb()) return reject(new Error('sync-unavailable'));

        var user = null;
        try { user = firebase.auth && firebase.auth().currentUser; } catch (e) {}
        if (!user) return reject(new Error('not-authenticated'));

        var payloadData = data;
        var stripped = false;
        var raw = sigOf(data);
        if (raw && raw.length > MAX_DOC_CHARS) {
          var safe = toCloudSafe(data);
          payloadData = safe.data;
          stripped = safe.stripped;
        }
        var finalSig = sigOf(payloadData);
        if (finalSig && finalSig.length > MAX_DOC_CHARS) return reject(new Error('too-large'));

        var settled = false;
        // Firestore holds the set() promise open while offline (it queues the
        // write locally). Race it against a timeout so the admin always gets a
        // definitive result. If the write later lands when connectivity returns,
        // it's harmless — the doc just ends up with this data anyway.
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          reject(new Error('publish-timeout'));
        }, PUBLISH_TIMEOUT_MS);

        docRef.set({
          data: payloadData,
          dataVersion: (window.PORTFOLIO_DATA_VERSION || (data && data.dataVersion) || 1),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          // Mark this exact data as applied so the echoed snapshot is a no-op.
          lastAppliedSig = sigOf(window.portfolioData);
          resolve({ published: true, stripped: stripped });
        }).catch(function (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  window.PortfolioSync = { load: load, save: save };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
