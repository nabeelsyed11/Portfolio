/**
 * ==============================================================================
 * PORTFOLIO LIST RENDERER  (window.PortfolioRender)
 * ==============================================================================
 * Single source of truth for the site's data-driven collections:
 *   - Skills          (#skills-list-container)
 *   - Projects        (#projects-list-container)
 *   - About highlights(#about-highlights-container)
 *   - About socials   (#about-social-pills)
 *   - Contact socials (.contact-social-row)
 *
 * Rebuilding each list from window.portfolioData (instead of hand-patching
 * indexed DOM) is what makes ADD / REMOVE safe: deleting a middle item can
 * never corrupt the `data-edit-key="…list.N.…"` indices, because every render
 * re-numbers the whole list from the array.
 *
 * Runs synchronously at the bottom of <body>, BEFORE script.js / editor.js, so
 * the correct number of cards exists before those scripts hydrate & bind.
 *
 * The admin-only Add / Delete controls are emitted here (hidden unless
 * `body.editor-active`); editor.js only wires their click handlers.
 * ==============================================================================
 */
(function () {
  'use strict';

  // --- Load any saved data FIRST so item counts match what the admin saved ---
  try {
    const saved = localStorage.getItem('custom_portfolio_data');
    if (saved) window.portfolioData = JSON.parse(saved);
  } catch (e) {
    console.error('[render] could not parse saved portfolio data:', e);
  }

  const D = () => window.portfolioData || {};

  /** Escape text for safe injection into innerHTML (attributes & text). */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Inline SVG icon library (mirrors the original static markup) ---------
  const SOCIAL_PATHS = {
    linkedin: '<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z"/>',
    github: '<path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>',
    instagram: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
    whatsapp: '<path d="M12.04 2.003a9.9 9.9 0 0 0-8.47 14.98L2 22l5.16-1.35a9.9 9.9 0 1 0 4.88-18.65zm0 1.8a8.1 8.1 0 0 1 6.88 12.38l-.2.32.86 3.13-3.2-.84-.31.18a8.1 8.1 0 1 1-4.03-15.1zm4.66 10.24c-.06-.1-.23-.16-.48-.29-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.55-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.16 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18z"/>',
    email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>',
    link: '<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>'
  };

  /** A social icon <svg> (16px, fills with currentColor). */
  function socialSvg(type, cls) {
    const path = SOCIAL_PATHS[type] || SOCIAL_PATHS.link;
    const c = cls ? ` class="${cls}"` : '';
    return `<svg${c} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">${path}</svg>`;
  }

  /** The small project "type" icon shown in a card's meta row. */
  function projectTypeSvg(type) {
    switch (type) {
      case 'analytics':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
      case 'mobile':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>';
      case 'ecommerce':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>';
      default:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
    }
  }

  /** Placeholder image for freshly-added projects. */
  const PLACEHOLDER_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='220'%3E%3Crect width='400' height='220' fill='%232c4936'/%3E%3Ctext x='50%25' y='50%25' fill='%23b3c7a6' font-family='sans-serif' font-size='17' text-anchor='middle' dominant-baseline='middle'%3EClick to add a photo%3C/text%3E%3C/svg%3E";

  // --- Small reusable control fragments (hidden unless editor-active) --------
  function delControl(type, index) {
    return `<span class="list-del-btn" role="button" tabindex="-1" title="Delete this item"
      data-del-type="${type}" data-del-index="${index}" aria-label="Delete item">&times;</span>`;
  }
  function addTile(type, label) {
    return `<button type="button" class="list-add-tile" data-add-type="${type}">
      <span class="add-plus">+</span><span>${esc(label)}</span></button>`;
  }
  function addPill(type, label) {
    return `<button type="button" class="social-add-pill" data-add-type="${type}">+ ${esc(label)}</button>`;
  }

  // --------------------------------------------------------------------------
  // GITHUB HELPERS  (used by the Open Source section — parse, cache, format)
  // --------------------------------------------------------------------------

  /** "https://github.com/owner/repo(.git)(/)" → {owner,name,path} | null. */
  function parseRepo(url) {
    if (!url) return null;
    const m = String(url).trim().match(/github\.com[/:]([^/\s]+)\/([^/#?\s]+)/i);
    if (!m) return null;
    const owner = m[1];
    const name = m[2].replace(/\.git$/i, '');
    if (!owner || !name) return null;
    return { owner: owner, name: name, path: owner + '/' + name };
  }

  // GitHub's own language → dot-color map (common subset; grey fallback).
  const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c',
    Python: '#3572A5', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', Ruby: '#701516', Shell: '#89e051',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883',
    'Jupyter Notebook': '#DA5B0B', SCSS: '#c6538c', Astro: '#ff5a03'
  };
  function langColor(lang) { return LANG_COLORS[lang] || '#8b98a5'; }

  /** Compact "updated N ago" from an ISO timestamp ('' if unparseable). */
  function timeAgo(iso) {
    const then = Date.parse(iso);
    if (isNaN(then)) return '';
    const days = Math.floor(Math.max(0, (Date.now() - then) / 86400000));
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    const months = Math.floor(days / 30);
    if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
    const years = Math.floor(days / 365);
    return years + (years === 1 ? ' year ago' : ' years ago');
  }

  // Live GitHub stats live OUTSIDE portfolioData (keeps Export clean) in their
  // own localStorage cache, keyed by "owner/name", with a 6-hour TTL. This is
  // read synchronously during render (instant, no flicker) and refreshed in the
  // background by hydrateOpenSource().
  const GH_CACHE_KEY = 'gh_repo_cache';
  const GH_TTL = 6 * 60 * 60 * 1000;
  function readGhCache() {
    try { return JSON.parse(localStorage.getItem(GH_CACHE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeGhCache(map) {
    try { localStorage.setItem(GH_CACHE_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function ghEntry(path) { return (path && readGhCache()[path]) || null; }

  /** The meta row (language • stars • updated) from a cached record. */
  function repoMetaHtml(rec) {
    if (!rec) return '';
    const parts = [];
    if (rec.language) {
      parts.push('<span class="repo-lang"><span class="lang-dot" style="background:' +
        langColor(rec.language) + '"></span><span class="lang-name">' + esc(rec.language) +
        '</span></span>');
    }
    if (typeof rec.stars === 'number') {
      parts.push('<span class="repo-stars">★ <span>' + esc(rec.stars) + '</span></span>');
    }
    if (rec.pushed_at) {
      const ago = timeAgo(rec.pushed_at);
      if (ago) parts.push('<span class="repo-updated">Updated ' + esc(ago) + '</span>');
    }
    return parts.join('');
  }

  // --------------------------------------------------------------------------
  // RENDERERS  (each rebuilds one container's innerHTML from the data array)
  // --------------------------------------------------------------------------

  function renderSkills() {
    const c = document.getElementById('skills-list-container');
    if (!c) return;
    const list = (D().skills && D().skills.list) || [];
    c.innerHTML = list.map((s, i) => `
      <div class="skill-card" data-move-id="move_skill_${i}">
        ${delControl('skills', i)}
        <div class="tilt-inner">
          <div class="skill-header">
            <span class="skill-indicator"></span>
            <h3 class="skill-name" data-edit-key="skills.list.${i}.name">${esc(s.name)}</h3>
          </div>
          <p class="skill-desc" data-edit-key="skills.list.${i}.description">${esc(s.description)}</p>
        </div>
      </div>`).join('') + addTile('skills', 'Add Skill');
  }

  function renderProjects() {
    const c = document.getElementById('projects-list-container');
    if (!c) return;
    const list = (D().projects && D().projects.list) || [];
    c.innerHTML = list.map((p, i) => {
      const id = p.id || `project_${i}`;
      const img = p.image || PLACEHOLDER_IMG;
      return `
      <article class="project-card" data-project="${esc(id)}" data-move-id="move_project_${esc(id)}">
        ${delControl('projects', i)}
        <div class="tilt-inner">
          <div class="project-img-frame">
            <img src="${esc(img)}" alt="${esc(p.title || 'Project image')}" class="project-img" data-img-key="projects.list.${i}.image" loading="lazy">
            <div class="img-edit-overlay"><span>📷 Change Photo</span></div>
          </div>
          <div class="project-body">
            <div class="project-meta-row">
              <span class="role-pill" data-edit-key="projects.list.${i}.role">${esc(p.role)}</span>
              <div class="project-type-icon" aria-label="${esc(p.iconType || 'project')} icon">${projectTypeSvg(p.iconType)}</div>
            </div>
            <h3 class="project-title" data-edit-key="projects.list.${i}.title">${esc(p.title)}</h3>
            <p class="project-desc" data-edit-key="projects.list.${i}.summary">${esc(p.summary)}</p>
          </div>
        </div>
      </article>`;
    }).join('') + addTile('projects', 'Add Project');
  }

  function renderHighlights() {
    const c = document.getElementById('about-highlights-container');
    if (!c) return;
    const list = (D().about && D().about.highlights) || [];
    c.innerHTML = list.map((h, i) => `
      <div class="about-card" data-move-id="move_highlight_${i}">
        ${delControl('highlights', i)}
        <div class="tilt-inner">
          <div class="card-num" data-edit-key="about.highlights.${i}.number">${esc(h.number)}</div>
          <p class="card-text" data-edit-key="about.highlights.${i}.text">${esc(h.text)}</p>
        </div>
      </div>`).join('') + addTile('highlights', 'Add Highlight');
  }

  function renderAboutSocials() {
    const c = document.getElementById('about-social-pills');
    if (!c) return;
    const list = (D().about && D().about.socialLinks) || [];
    c.innerHTML = list.map((l, i) => {
      const isMail = /^mailto:/i.test(l.url || '');
      const rel = isMail ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `
      <a href="${esc(l.url || '#')}"${rel} class="social-pill" aria-label="${esc(l.name)}">
        ${socialSvg(l.iconType, 'social-icon')}
        <span data-edit-key="about.socialLinks.${i}.name">${esc(l.name)}</span>
        ${delControl('aboutSocials', i)}
      </a>`;
    }).join('') + addPill('aboutSocials', 'Add Link');
  }

  function renderContactSocials() {
    const c = document.querySelector('.contact-social-row');
    if (!c) return;
    const list = (D().contact && D().contact.socialLinks) || [];
    c.innerHTML = list.map((l, i) => {
      const isMail = /^mailto:/i.test(l.url || '');
      const rel = isMail ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `
      <a href="${esc(l.url || '#')}"${rel} class="circle-social-btn" aria-label="${esc(l.name || l.iconType)}">
        ${socialSvg(l.iconType)}
        ${delControl('contactSocials', i)}
      </a>`;
    }).join('') + addPill('contactSocials', 'Add Link');
  }

  function renderOpenSource() {
    const c = document.getElementById('opensource-list-container');
    if (!c) return;
    const list = (D().openSource && D().openSource.list) || [];
    c.innerHTML = list.map((r, i) => {
      const id = r.id || `repo_${i}`;
      const parsed = parseRepo(r.url);
      const path = parsed ? parsed.path : '';
      const rec = path ? ghEntry(path) : null;
      // A manual description (typed in Edit Mode) always wins, so the admin can
      // describe repos GitHub has no description for — or override GitHub's text.
      // Leave it blank to auto-use GitHub's live description.
      const manualDesc = (r.description && r.description.trim()) ? r.description.trim() : '';
      const name = (rec && rec.name) || (parsed && parsed.name) || 'repository';
      // Display precedence: manual → live GitHub → placeholder.
      const desc = manualDesc || (rec && rec.description) || 'No description provided yet.';
      const url = r.url || '#';
      return `
      <article class="repo-card" data-move-id="move_repo_${esc(id)}" data-repo="${esc(path)}">
        ${delControl('openSource', i)}
        <div class="tilt-inner">
          <div class="repo-top">
            <span class="repo-icon">${socialSvg('github')}</span>
            <h3 class="repo-name">${esc(name)}</h3>
          </div>
          <p class="repo-desc"${manualDesc ? ' data-manual="1"' : ''}>${esc(desc)}</p>
          <div class="repo-meta">${repoMetaHtml(rec)}</div>
          <span class="repo-edit-label">Repository URL</span>
          <span class="repo-url-edit" data-edit-key="openSource.list.${i}.url" title="Repository URL (editable in Edit Mode)">${esc(url)}</span>
          <span class="repo-edit-label">Description (optional — overrides GitHub)</span>
          <span class="repo-desc-edit" data-edit-key="openSource.list.${i}.description" data-placeholder="Add a description… (blank = use GitHub's)">${esc(r.description || '')}</span>
          <a class="repo-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
        </div>
      </article>`;
    }).join('') + addTile('openSource', 'Add Repo');

    // Refresh live stats in the background (cache-first; only fetches stale/missing).
    setTimeout(hydrateOpenSource, 0);
  }

  /** Patch a single already-rendered card from a cached/fetched record. */
  function patchRepoCard(card, rec) {
    try {
      if (!card || !rec) return;
      const nameEl = card.querySelector('.repo-name');
      if (nameEl && rec.name) nameEl.textContent = rec.name;
      const descEl = card.querySelector('.repo-desc');
      // A manual description (data-manual) is authoritative — never overwrite it
      // with GitHub's. Otherwise fill in GitHub's live description when it has one.
      if (descEl && rec.description && !descEl.hasAttribute('data-manual')) {
        descEl.textContent = rec.description;
      }
      const metaEl = card.querySelector('.repo-meta');
      if (metaEl) metaEl.innerHTML = repoMetaHtml(rec);
    } catch (e) { /* never let hydration break the page */ }
  }

  /**
   * Fill each repo card's live stats from the GitHub REST API.
   * Cache-first with a 6h TTL that throttles retries even on failure (so a
   * rate-limited / offline visitor won't hammer the API). Fully defensive:
   * any error just leaves the fallback text in place — never throws or logs.
   */
  function hydrateOpenSource() {
    try {
      const cards = document.querySelectorAll('#opensource-list-container .repo-card[data-repo]');
      if (!cards.length) return;
      const now = Date.now();
      cards.forEach(function (card) {
        const path = card.getAttribute('data-repo');
        if (!path) return; // unparseable URL → leave placeholder
        const cache = readGhCache();
        const entry = cache[path];
        if (entry && entry.fetchedAt && (now - entry.fetchedAt) < GH_TTL) {
          patchRepoCard(card, entry); // recent (success or failure) → don't refetch
          return;
        }
        fetch('https://api.github.com/repos/' + path, {
          headers: { 'Accept': 'application/vnd.github+json' }
        })
          .then(function (res) {
            if (!res.ok) throw new Error('github ' + res.status);
            return res.json();
          })
          .then(function (data) {
            const rec = {
              name: data.name || '',
              description: data.description || '',
              language: data.language || '',
              stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
              pushed_at: data.pushed_at || '',
              fetchedAt: Date.now()
            };
            const c2 = readGhCache(); c2[path] = rec; writeGhCache(c2);
            patchRepoCard(card, rec);
          })
          .catch(function () {
            // Stamp the attempt so we back off for the full TTL; keep old data.
            const c2 = readGhCache();
            const prev = c2[path] || {};
            prev.fetchedAt = Date.now();
            c2[path] = prev; writeGhCache(c2);
          });
      });
    } catch (e) { /* no-op */ }
  }

  function renderAllLists() {
    renderSkills();
    renderProjects();
    renderHighlights();
    renderAboutSocials();
    renderContactSocials();
    renderOpenSource();
  }

  // Map a "section" keyword to the renderer(s) it needs.
  const SECTION_RENDERERS = {
    skills: [renderSkills],
    projects: [renderProjects],
    highlights: [renderHighlights],
    aboutSocials: [renderAboutSocials],
    contactSocials: [renderContactSocials],
    openSource: [renderOpenSource],
    all: [renderAllLists]
  };

  /**
   * The single re-bind funnel used after any add / remove / card edit:
   *   re-render → re-measure 3D → re-hook editor (if editing) → persist.
   */
  function refresh(section) {
    const fns = SECTION_RENDERERS[section] || SECTION_RENDERERS.all;
    fns.forEach(fn => fn());

    if (window.PortfolioMotion && typeof window.PortfolioMotion.hookNode === 'function') {
      window.PortfolioMotion.hookNode();
    }
    const ed = window.portfolioEditor;
    if (ed && ed.isEditing && typeof ed.rehookAfterRender === 'function') {
      ed.rehookAfterRender();
    }
    try {
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
    } catch (e) {
      console.error('[render] failed to persist portfolio data:', e);
    }
  }

  window.PortfolioRender = {
    renderAllLists,
    renderSkills,
    renderProjects,
    renderHighlights,
    renderAboutSocials,
    renderContactSocials,
    renderOpenSource,
    refresh,
    PLACEHOLDER_IMG
  };

  // Build lists immediately (runs before script.js hydration & editor bind).
  renderAllLists();
})();
