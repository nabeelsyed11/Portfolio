/**
 * ==============================================================================
 * PORTFOLIO 3D STAGING  (window.PortfolioMotion)
 * ==============================================================================
 * Native CSS-3D depth for the *real, editable* HTML content (the WebGL canvas
 * in scene3d.js is decorative background only). One shared rAF loop + one
 * passive scroll listener drive:
 *
 *   1. Panel fly-in  — each `.panel-3d` (wrapping a section's `.container`)
 *      pushes back in Z and tilts as it leaves the viewport centre, and sits
 *      flat & crisp when centred (so text stays sharp / readable).
 *   2. Pointer tilt  — cards & photos rotate toward the cursor. Tilt is applied
 *      via CSS custom properties (--rx / --ry), NEVER `transform`, so it can
 *      never collide with the editor's inline drag `transform`.
 *   3. onScroll(cb)  — scene3d.js subscribes here to share this one ticker
 *      (scroll, nav-link clicks and keyboard all move scrollY, so the flythrough
 *      camera needs no special-casing).
 *
 * Everything flattens under: prefers-reduced-motion, `body.editor-active`
 * (stable editing plane), and `.panel-3d:focus-within` (typing in a form).
 * ==============================================================================
 */
(function () {
  'use strict';

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = window.matchMedia('(pointer: fine)');
  const liteMQ = window.matchMedia('(max-width: 760px)');

  let panels = [];        // [{ el, section }]
  let offsets = [];       // [{ el, top, h }]  cached geometry (no layout reads in loop)
  const scrollSubs = [];  // scene3d etc.
  let rafPending = false;
  let editing = false;
  let currentTiltHost = null;

  const TILT_SEL = '.project-card, .skill-card, .about-card, .arch-card-wrapper';

  const motionOff = () => reduceMQ.matches || editing;

  // ---- Geometry --------------------------------------------------------------
  function collect() {
    panels = Array.from(document.querySelectorAll('.panel-3d')).map(el => ({
      el,
      section: el.closest('section') || el
    }));
  }

  function measure() {
    offsets = panels.map(p => ({
      el: p.el,
      top: p.section.offsetTop,
      h: p.section.offsetHeight || 1
    }));
  }

  function flattenPanels() {
    for (const o of offsets) {
      o.el.style.transform = '';
      o.el.style.opacity = '';
    }
  }

  // ---- Main frame ------------------------------------------------------------
  function frame() {
    rafPending = false;

    const vh = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const docH = (document.documentElement.scrollHeight - vh) || 1;
    const progress = Math.min(1, Math.max(0, scrollY / docH));

    // Feed shared subscribers (background scene) every frame.
    for (let i = 0; i < scrollSubs.length; i++) {
      try { scrollSubs[i](progress, scrollY); } catch (e) { /* isolate */ }
    }

    if (motionOff()) { flattenPanels(); return; }

    const viewportCenter = scrollY + vh / 2;
    for (const o of offsets) {
      const center = o.top + o.h / 2;
      let d = (center - viewportCenter) / vh;          // 0 when centred
      if (d > 1.3) d = 1.3; else if (d < -1.3) d = -1.3;
      const ad = Math.abs(d);
      const tz = -(ad * 460);                          // recede with distance
      const rot = d * 7;                               // tilt away from centre
      const opacity = 1 - Math.min(0.5, ad * 0.46);
      o.el.style.transform = `translateZ(${tz.toFixed(1)}px) rotateX(${(-rot).toFixed(2)}deg)`;
      o.el.style.opacity = opacity.toFixed(3);
    }
  }

  function requestFrame() {
    if (!rafPending) { rafPending = true; requestAnimationFrame(frame); }
  }

  // ---- Pointer tilt ----------------------------------------------------------
  function resetTilt(host) {
    if (!host) return;
    host.style.setProperty('--rx', '0deg');
    host.style.setProperty('--ry', '0deg');
    host.classList.remove('is-tilting');
  }

  function onPointerMove(e) {
    if (motionOff() || !fineMQ.matches) return;
    const host = e.target.closest ? e.target.closest(TILT_SEL) : null;
    if (host !== currentTiltHost) {
      resetTilt(currentTiltHost);
      currentTiltHost = host;
    }
    if (!host) return;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const MAX = 8;
    host.style.setProperty('--ry', (px * MAX).toFixed(2) + 'deg');
    host.style.setProperty('--rx', (-py * MAX).toFixed(2) + 'deg');
    host.classList.add('is-tilting');
  }

  function clearAllTilt() {
    resetTilt(currentTiltHost);
    currentTiltHost = null;
  }

  // ---- Public API ------------------------------------------------------------
  const api = {
    /** Subscribe to normalized scroll progress (0..1) + raw scrollY, per frame. */
    onScroll(cb) { if (typeof cb === 'function') scrollSubs.push(cb); },

    /** Re-collect + re-measure after the DOM changes (add/remove a card, etc). */
    hookNode() { collect(); measure(); requestFrame(); },

    /** Force a re-measure (e.g. fonts/images finished loading). */
    refreshOffsets() { measure(); requestFrame(); },

    /** Flatten/resume — called by the editor edit-mode toggle. */
    setEditing(on) {
      editing = !!on;
      if (editing) clearAllTilt();
      requestFrame();
    },

    isMotionEnabled() { return !motionOff(); }
  };
  window.PortfolioMotion = api;

  // ---- Wiring ----------------------------------------------------------------
  function init() {
    collect();
    measure();

    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', () => { measure(); requestFrame(); }, { passive: true });
    window.addEventListener('load', () => { measure(); requestFrame(); });
    document.addEventListener('pointermove', onPointerMove, { passive: true });

    // Re-measure once more after late layout shifts (webfonts, lazy images).
    setTimeout(() => { measure(); requestFrame(); }, 400);

    // Flatten while typing in a panel (focus-within) is handled purely in CSS;
    // we just react to the editor's global edit-mode signal here.
    document.addEventListener('portfolio:editmodechange', (e) => {
      api.setEditing(!!(e.detail && e.detail.editing));
    });

    requestFrame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
