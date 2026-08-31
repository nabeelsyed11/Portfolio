/**
 * ==============================================================================
 * PORTFOLIO LIVE VISUAL EDITOR (CMS ENGINE 6.0 - AUTHENTICATED & SECURE)
 * ==============================================================================
 * Gated by Firebase & Admin Authentication:
 * - Hidden from regular visitors by default.
 * - Unlocked via Firebase Google Sign-In, Email/Password, or Admin Passcode.
 * - Secret keyboard shortcut: Ctrl + Shift + E (or #admin in URL / Footer link).
 * - Full on-screen editing, photo replacement, case study modal, and drag & move.
 * ==============================================================================
 */

class PortfolioEditor {
  constructor() {
    this.isEditing = false;
    this.isAdmin = false;
    this.activeImgTarget = null;
    this.activeTextTarget = null;
    this.activeProjectIndex = null;
    this.isDragging = false;
    this.currentDragEl = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.elStartX = 0;
    this.elStartY = 0;
    this.elementPositions = {};

    this.initStorage();
    this.createEditorUI();
    this.bindEvents();
    this.autoHydrateDOM();
    this.enableContentEditable(false);
    this.setupDraggableContainers();
    this.setupProjectEditButtons();
    this.applySavedPositions();
    this.checkInitialAdminSession();
  }

  // 1. Initialize local storage or fallback to default portfolioData
  initStorage() {
    const saved = localStorage.getItem('custom_portfolio_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        window.portfolioData = Object.assign({}, window.portfolioData, parsed);
      } catch (e) {
        console.error('Failed to parse saved portfolio data:', e);
      }
    }

    const savedPositions = localStorage.getItem('portfolio_element_positions');
    if (savedPositions) {
      try {
        this.elementPositions = JSON.parse(savedPositions);
      } catch (e) {
        console.error('Failed to parse saved positions:', e);
      }
    }
  }

  // Check if admin modal requested via URL hash
  checkInitialAdminSession() {
    localStorage.removeItem('portfolio_admin_session');
    if (window.location.hash === '#admin') {
      this.openAdminModal();
    }
  }

  // 2. Set Admin Access state
  setAdminAccess(isAuthenticated) {
    this.isAdmin = isAuthenticated;
    const body = document.body;
    const toolbar = document.getElementById('editor-toolbar');

    if (isAuthenticated) {
      body.classList.add('admin-authenticated');
    } else {
      body.classList.remove('admin-authenticated');
      body.classList.remove('editor-active');
      if (toolbar) toolbar.classList.remove('open');
      this.enableContentEditable(false);
      this.isEditing = false;
      document.dispatchEvent(new CustomEvent('portfolio:editmodechange', { detail: { editing: false } }));
    }
  }

  // 3. Hydrate DOM from portfolioData
  autoHydrateDOM() {
    const data = window.portfolioData;
    if (!data) return;

    const getNested = (obj, path) => {
      if (!path) return undefined;
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    document.querySelectorAll('[data-edit-key]').forEach(el => {
      const key = el.getAttribute('data-edit-key');
      const val = getNested(data, key);
      if (val !== undefined && val !== null) {
        if (el.getAttribute('data-is-html') === 'true') {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    document.querySelectorAll('img[data-img-key]').forEach(img => {
      const key = img.getAttribute('data-img-key');
      const src = getNested(data, key);
      if (src) {
        img.src = src;
      }
    });
  }

  // 4. Setup Draggable Move Handles on container boxes
  setupDraggableContainers() {
    const containerSelectors = [
      '.hero-content',
      '.hero-visual',
      '.about-visual',
      '.about-content',
      '.about-card',
      '.skills-content',
      '.skills-visual',
      '.skill-card',
      '.project-card',
      '.repo-card',
      '.contact-left',
      '.contact-card'
    ];

    let idx = 0;
    containerSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.getAttribute('data-move-id')) {
          el.setAttribute('data-move-id', `container_${el.className.split(' ')[0]}_${idx++}`);
        }

        if (!el.querySelector(':scope > .move-drag-handle')) {
          const handle = document.createElement('div');
          handle.className = 'move-drag-handle';
          handle.setAttribute('title', 'Drag to move this section/card');
          handle.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="5 9 2 12 5 15"></polyline>
              <polyline points="9 5 12 2 15 5"></polyline>
              <polyline points="15 19 12 22 9 19"></polyline>
              <polyline points="19 9 22 12 19 15"></polyline>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
            <span>Move</span>
          `;
          el.appendChild(handle);
        }
      });
    });
  }

  // 5. Setup "Edit Full Case Study" Badges on Project Cards
  setupProjectEditButtons() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
      if (!card.querySelector('.card-full-edit-btn')) {
        const btn = document.createElement('button');
        btn.className = 'card-full-edit-btn';
        btn.setAttribute('type', 'button');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Edit Case Study</span>
        `;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openProjectEditModal(index);
        });
        card.appendChild(btn);
      }
    });
  }

  // 6. Apply saved positions from localStorage
  applySavedPositions() {
    Object.keys(this.elementPositions).forEach(id => {
      const el = document.querySelector(`[data-move-id="${id}"]`);
      if (el) {
        const pos = this.elementPositions[id];
        el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        el.style.position = 'relative';
      }
    });
  }

  // 6b. Re-bind interaction hooks after render.js rebuilds a list section.
  //     Called by PortfolioRender.refresh() while edit mode is active. Every
  //     step below is idempotent, so re-running it over fresh DOM is safe.
  rehookAfterRender() {
    this.enableContentEditable(this.isEditing);
    this.setupDraggableContainers();
    this.setupProjectEditButtons();
    this.applySavedPositions();
  }

  // 6c. Map a list "type" → the portfolioData array that backs it.
  getListArray(type) {
    const d = window.portfolioData || {};
    switch (type) {
      case 'skills':         return (d.skills && d.skills.list) || null;
      case 'projects':       return (d.projects && d.projects.list) || null;
      case 'highlights':     return (d.about && d.about.highlights) || null;
      case 'aboutSocials':   return (d.about && d.about.socialLinks) || null;
      case 'contactSocials': return (d.contact && d.contact.socialLinks) || null;
      case 'openSource':     return (d.openSource && d.openSource.list) || null;
      default:               return null;
    }
  }

  // 6d. ADD a new item to a list, then re-render that section from the array.
  addListItem(type) {
    if (!window.PortfolioRender) { this.showToast('⚠️ Renderer not ready.'); return; }
    this.syncDOMToData(); // capture any un-blurred inline edits before re-render
    const d = window.portfolioData;
    const placeholder = window.PortfolioRender.PLACEHOLDER_IMG || '';

    switch (type) {
      case 'skills':
        d.skills = d.skills || {}; d.skills.list = d.skills.list || [];
        d.skills.list.push({ name: 'New Skill', description: 'Describe this skill…' });
        break;
      case 'projects':
        d.projects = d.projects || {}; d.projects.list = d.projects.list || [];
        d.projects.list.push({
          id: 'project_' + this.uid(), title: 'New Project', role: 'ROLE',
          iconType: 'analytics', image: placeholder,
          summary: 'Short summary of this project…',
          duration: '', technologies: '', details: ''
        });
        break;
      case 'highlights':
        d.about = d.about || {}; d.about.highlights = d.about.highlights || [];
        d.about.highlights.push({
          number: String(d.about.highlights.length + 1).padStart(2, '0'),
          text: 'New highlight…'
        });
        break;
      case 'aboutSocials':
        d.about = d.about || {}; d.about.socialLinks = d.about.socialLinks || [];
        d.about.socialLinks.push({ name: 'New Link', url: '#', iconType: 'link' });
        break;
      case 'contactSocials':
        d.contact = d.contact || {}; d.contact.socialLinks = d.contact.socialLinks || [];
        d.contact.socialLinks.push({ name: 'New Link', url: '#', iconType: 'link' });
        break;
      case 'openSource':
        d.openSource = d.openSource || {}; d.openSource.list = d.openSource.list || [];
        d.openSource.list.push({
          id: 'repo_' + this.uid(),
          url: 'https://github.com/' + ((d.openSource && d.openSource.username) || 'nabeelsyed11') + '/',
          description: ''
        });
        break;
      default: return;
    }

    window.PortfolioRender.refresh(type);
    this.showToast('➕ Item added — edit it, then Save Changes.');
  }

  // 6e. DELETE a list item by index, prune its saved drag position, re-render.
  deleteListItem(type, index) {
    if (!window.PortfolioRender) { this.showToast('⚠️ Renderer not ready.'); return; }
    if (isNaN(index)) return;
    const arr = this.getListArray(type);
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) return;

    this.syncDOMToData(); // capture any un-blurred inline edits before re-render
    const removed = arr.splice(index, 1)[0];
    this.pruneListPositions(type, removed);

    window.PortfolioRender.refresh(type);
    this.showToast('🗑️ Item deleted.');
  }

  // 6f. Drop drag-offsets orphaned by a delete. Skill/highlight positions are
  //     index-keyed, so a delete shifts every following item — clear the whole
  //     family. Project positions are id-keyed, so only the removed id goes.
  pruneListPositions(type, removed) {
    const P = this.elementPositions;
    if (type === 'projects') {
      if (removed && removed.id) delete P['move_project_' + removed.id];
    } else if (type === 'skills') {
      Object.keys(P).forEach(k => { if (k.indexOf('move_skill_') === 0) delete P[k]; });
    } else if (type === 'highlights') {
      Object.keys(P).forEach(k => { if (k.indexOf('move_highlight_') === 0) delete P[k]; });
    } else if (type === 'openSource') {
      if (removed && removed.id) delete P['move_repo_' + removed.id];
    }
    try { localStorage.setItem('portfolio_element_positions', JSON.stringify(P)); } catch (e) {}
  }

  // Short unique id for new projects (monotonic within a session, no collisions
  // when several are added inside the same millisecond).
  uid() {
    this._uidSeq = (this._uidSeq || 0) + 1;
    return Date.now().toString(36) + '_' + this._uidSeq.toString(36);
  }

  // 7. Create Editor UI & Toolbar
  createEditorUI() {
    // Floating Action Toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.className = 'editor-toolbar-panel';
    toolbar.innerHTML = `
      <div class="toolbar-brand">
        <span class="live-dot"></span>
        <span class="toolbar-title">Editor Active</span>
      </div>
      <div class="toolbar-actions">
        <button id="editor-save-btn" class="editor-btn editor-btn-primary" title="Save changes in browser storage">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Changes</span>
        </button>

        <button id="editor-reset-layout-btn" class="editor-btn editor-btn-secondary" title="Reset all moved positions back to default">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Reset Layout</span>
        </button>

        <button id="editor-export-btn" class="editor-btn editor-btn-secondary" title="Download updated portfolio-data.js file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Export Config</span>
        </button>

        <button id="editor-reset-btn" class="editor-btn editor-btn-danger" title="Revert to original default content">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>Reset All</span>
        </button>

        <button id="editor-lock-btn" class="editor-btn editor-btn-danger" title="Lock admin editor and logout">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Lock</span>
        </button>

        <button id="editor-exit-btn" class="editor-btn editor-btn-close" title="Exit Edit Mode">
          ✕ Exit
        </button>
      </div>
    `;
    document.body.appendChild(toolbar);

    // Image Replacer Modal
    const imgModal = document.createElement('div');
    imgModal.id = 'editor-img-modal';
    imgModal.className = 'editor-modal-backdrop';
    imgModal.innerHTML = `
      <div class="editor-modal-card">
        <div class="editor-modal-header">
          <h3>📷 Change Image</h3>
          <button id="img-modal-close" class="editor-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="editor-modal-body">
          <div class="img-preview-box">
            <img id="img-modal-preview" src="" alt="Image preview">
          </div>
          <div class="editor-form-group">
            <label>Option 1: Upload from your Computer</label>
            <input type="file" id="img-modal-file" class="editor-file-input" accept="image/*">
            <small style="color: #66756c;">Select any JPG, PNG, or WebP photo from your device.</small>
          </div>
          <div class="editor-form-group">
            <label>Option 2: Or Paste an Image URL / Path</label>
            <input type="text" id="img-modal-url" class="editor-input" placeholder="e.g. assets/images/your-photo.jpg or https://...">
          </div>
        </div>
        <div class="editor-modal-footer">
          <button id="img-modal-cancel" class="editor-btn editor-btn-secondary">Cancel</button>
          <button id="img-modal-apply" class="editor-btn editor-btn-primary">Apply Image</button>
        </div>
      </div>
    `;
    document.body.appendChild(imgModal);

    // Dedicated Heading & Text Editor Modal
    const textModal = document.createElement('div');
    textModal.id = 'editor-text-modal';
    textModal.className = 'editor-modal-backdrop';
    textModal.innerHTML = `
      <div class="editor-modal-card">
        <div class="editor-modal-header">
          <h3 id="text-modal-title">✏️ Edit Heading / Text</h3>
          <button id="text-modal-close" class="editor-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="editor-modal-body">
          <div class="editor-form-group">
            <label id="text-modal-field-label">Content:</label>
            <textarea id="text-modal-input" class="editor-textarea" rows="4" placeholder="Enter your text here..."></textarea>
            <small style="color: var(--text-muted); display: block; margin-top: 0.4rem;">
              You can type text freely. Press Enter for line breaks.
            </small>
          </div>
        </div>
        <div class="editor-modal-footer">
          <button id="text-modal-cancel" class="editor-btn editor-btn-secondary">Cancel</button>
          <button id="text-modal-apply" class="editor-btn editor-btn-primary">Apply Text</button>
        </div>
      </div>
    `;
    document.body.appendChild(textModal);

    // Full Case Study Card Editor Modal
    const projectModal = document.createElement('div');
    projectModal.id = 'editor-project-card-modal';
    projectModal.className = 'editor-modal-backdrop';
    projectModal.innerHTML = `
      <div class="editor-modal-card editor-modal-card-lg">
        <div class="editor-modal-header">
          <h3>🗂️ Edit Case Study & Achievement</h3>
          <button id="project-card-modal-close" class="editor-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="editor-modal-body modal-scrollable-body">
          <div class="editor-form-row">
            <div class="editor-form-group flex-2">
              <label>Project Title</label>
              <input type="text" id="p-edit-title" class="editor-input" placeholder="e.g. Enterprise Analytics Dashboard">
            </div>
            <div class="editor-form-group flex-1">
              <label>Role Badge</label>
              <input type="text" id="p-edit-role" class="editor-input" placeholder="e.g. LEAD DEVELOPER">
            </div>
          </div>

          <div class="editor-form-group">
            <label>Project Image</label>
            <div class="p-img-edit-row">
              <div class="p-img-preview-thumb">
                <img id="p-edit-img-preview" src="" alt="Project thumbnail">
              </div>
              <div class="p-img-inputs">
                <input type="file" id="p-edit-file" class="editor-file-input" accept="image/*">
                <input type="text" id="p-edit-img-url" class="editor-input" placeholder="or paste Image URL / Path">
              </div>
            </div>
          </div>

          <div class="editor-form-group">
            <label>Card Summary Description</label>
            <textarea id="p-edit-summary" class="editor-textarea" rows="2" placeholder="Brief summary on the card..."></textarea>
          </div>

          <div class="editor-form-row">
            <div class="editor-form-group flex-1">
              <label>Duration</label>
              <input type="text" id="p-edit-duration" class="editor-input" placeholder="e.g. 6 Months">
            </div>
            <div class="editor-form-group flex-2">
              <label>Tech Stack / Technologies</label>
              <input type="text" id="p-edit-tech" class="editor-input" placeholder="e.g. React, TypeScript, Node.js">
            </div>
          </div>

          <div class="editor-form-group">
            <label>Detailed Case Study Narrative (shown in view popup)</label>
            <textarea id="p-edit-details" class="editor-textarea" rows="4" placeholder="Full details of challenges, solution, and impact..."></textarea>
          </div>
        </div>
        <div class="editor-modal-footer">
          <button id="p-edit-cancel" class="editor-btn editor-btn-secondary">Cancel</button>
          <button id="p-edit-apply" class="editor-btn editor-btn-primary">Apply & Save Card</button>
        </div>
      </div>
    `;
    document.body.appendChild(projectModal);
  }

  // 8. Open Full Case Study Editor Modal
  openProjectEditModal(index) {
    if (!this.isAdmin || !this.isEditing) {
      this.openAdminModal();
      return;
    }

    this.activeProjectIndex = index;
    const projectList = (window.portfolioData && window.portfolioData.projects && window.portfolioData.projects.list) || [];
    const project = projectList[index] || {};

    const modal = document.getElementById('editor-project-card-modal');
    document.getElementById('p-edit-title').value = project.title || '';
    document.getElementById('p-edit-role').value = project.role || '';
    document.getElementById('p-edit-img-url').value = project.image || '';
    document.getElementById('p-edit-img-preview').src = project.image || '';
    document.getElementById('p-edit-summary').value = project.summary || '';
    document.getElementById('p-edit-duration').value = project.duration || '';
    document.getElementById('p-edit-tech').value = project.technologies || '';
    document.getElementById('p-edit-details').value = project.details || project.summary || '';

    modal.classList.add('open');
  }

  // 9. Open Admin Authentication Modal
  openAdminModal() {
    const authModal = document.getElementById('admin-auth-modal');
    if (authModal) {
      authModal.classList.add('open');
      const errEl = document.getElementById('admin-auth-error');
      if (errEl) errEl.style.display = 'none';
      const input = document.getElementById('admin-passcode-input');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 150);
      }
    }
  }

  closeAdminModal() {
    const authModal = document.getElementById('admin-auth-modal');
    if (authModal) {
      authModal.classList.remove('open');
    }
  }

  // 10. Bind Events
  bindEvents() {
    const toggleBtn = document.getElementById('editor-toggle-btn');
    const saveBtn = document.getElementById('editor-save-btn');
    const exportBtn = document.getElementById('editor-export-btn');
    const resetBtn = document.getElementById('editor-reset-btn');
    const resetLayoutBtn = document.getElementById('editor-reset-layout-btn');
    const exitBtn = document.getElementById('editor-exit-btn');
    const lockBtn = document.getElementById('editor-lock-btn');
    
    // Admin Auth Elements
    const openAdminBtn = document.getElementById('open-admin-login-btn');
    const adminClose = document.getElementById('admin-auth-close');
    const btnGoogle = document.getElementById('btn-google-login');
    const adminForm = document.getElementById('admin-login-form');
    const adminPasscode = document.getElementById('admin-passcode-input');
    const adminErr = document.getElementById('admin-auth-error');

    // Image Modal
    const imgModal = document.getElementById('editor-img-modal');
    const imgClose = document.getElementById('img-modal-close');
    const imgCancel = document.getElementById('img-modal-cancel');
    const imgApply = document.getElementById('img-modal-apply');
    const imgFileInput = document.getElementById('img-modal-file');
    const imgUrlInput = document.getElementById('img-modal-url');
    const imgPreview = document.getElementById('img-modal-preview');

    // Text Modal
    const textModal = document.getElementById('editor-text-modal');
    const textClose = document.getElementById('text-modal-close');
    const textCancel = document.getElementById('text-modal-cancel');
    const textApply = document.getElementById('text-modal-apply');
    const textInput = document.getElementById('text-modal-input');

    // Project Card Modal
    const pModal = document.getElementById('editor-project-card-modal');
    const pClose = document.getElementById('project-card-modal-close');
    const pCancel = document.getElementById('p-edit-cancel');
    const pApply = document.getElementById('p-edit-apply');
    const pFile = document.getElementById('p-edit-file');
    const pImgUrl = document.getElementById('p-edit-img-url');
    const pImgPreview = document.getElementById('p-edit-img-preview');

    // Admin Auth Triggers
    if (openAdminBtn) {
      openAdminBtn.addEventListener('click', () => this.openAdminModal());
    }
    if (adminClose) {
      adminClose.addEventListener('click', () => this.closeAdminModal());
    }

    // Keyboard Shortcut Ctrl+Shift+E
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        if (this.isAdmin) {
          this.toggleEditMode();
        } else {
          this.openAdminModal();
        }
      }
    });

    // Admin Password Sign-In
    if (adminForm) {
      adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          adminErr.style.display = 'none';
          const passcode = adminPasscode.value.trim();
          if (window.firebaseAuthManager) {
            await window.firebaseAuthManager.signInWithPasscode(passcode);
          } else {
            const utf8 = new TextEncoder().encode(passcode);
            const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            if (inputHash === 'e43969ccdf2440baf3d904077d4088ef99c167cb967a5104226f0b5cc8c06273') {
              this.setAdminAccess(true);
            } else {
              throw new Error('Incorrect Admin Password. Access denied.');
            }
          }
          this.closeAdminModal();
          this.setAdminAccess(true);
          this.toggleEditMode(true);
          this.showToast('👑 Password Accepted: Visual Editor Unlocked!');
        } catch (err) {
          adminErr.textContent = err.message || 'Incorrect password.';
          adminErr.style.display = 'block';
        }
      });
    }

    // Lock / Logout Admin
    if (lockBtn) {
      lockBtn.addEventListener('click', async () => {
        await window.firebaseAuthManager.signOut();
        this.setAdminAccess(false);
        this.showToast('🔒 Admin session locked. Editor hidden from visitors.');
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleEditMode());
    }
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.toggleEditMode(false));
    }

    saveBtn.addEventListener('click', () => {
      this.syncDOMToData();
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      localStorage.setItem('portfolio_element_positions', JSON.stringify(this.elementPositions));
      this.showToast('✅ All text edits, photos, and moved layout positions saved!');
    });

    resetLayoutBtn.addEventListener('click', () => {
      this.elementPositions = {};
      localStorage.removeItem('portfolio_element_positions');
      document.querySelectorAll('[data-move-id]').forEach(el => {
        el.style.transform = '';
      });
      this.showToast('🔄 Layout positions reset to default alignment!');
    });

    exportBtn.addEventListener('click', () => {
      this.syncDOMToData();
      this.exportConfigFile();
    });

    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all content, photos, and layout positions back to original defaults?')) {
        localStorage.removeItem('custom_portfolio_data');
        localStorage.removeItem('portfolio_element_positions');
        window.location.reload();
      }
    });

    // Close Modals
    const closeImgModal = () => {
      imgModal.classList.remove('open');
      this.activeImgTarget = null;
    };
    imgClose.addEventListener('click', closeImgModal);
    imgCancel.addEventListener('click', closeImgModal);

    const closeTextModal = () => {
      textModal.classList.remove('open');
      this.activeTextTarget = null;
    };
    textClose.addEventListener('click', closeTextModal);
    textCancel.addEventListener('click', closeTextModal);

    const closePModal = () => {
      pModal.classList.remove('open');
      this.activeProjectIndex = null;
    };
    pClose.addEventListener('click', closePModal);
    pCancel.addEventListener('click', closePModal);

    // Image Modal Upload
    imgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imgPreview.src = event.target.result;
          imgUrlInput.value = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    imgUrlInput.addEventListener('input', () => {
      imgPreview.src = imgUrlInput.value;
    });

    imgApply.addEventListener('click', () => {
      if (this.activeImgTarget && imgUrlInput.value.trim()) {
        const newSrc = imgUrlInput.value.trim();
        this.activeImgTarget.src = newSrc;
        const key = this.activeImgTarget.getAttribute('data-img-key');
        if (key) {
          this.setNestedValue(window.portfolioData, key, newSrc);
          localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
        }
        this.showToast('✅ Photo updated successfully!');
        closeImgModal();
      }
    });

    // Project Modal Image Upload
    pFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          pImgPreview.src = event.target.result;
          pImgUrl.value = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    pImgUrl.addEventListener('input', () => {
      pImgPreview.src = pImgUrl.value;
    });

    // Apply Full Project Card Edits
    pApply.addEventListener('click', () => {
      if (this.activeProjectIndex !== null) {
        const idx = this.activeProjectIndex;
        if (!window.portfolioData.projects) window.portfolioData.projects = { list: [] };
        if (!window.portfolioData.projects.list) window.portfolioData.projects.list = [];
        if (!window.portfolioData.projects.list[idx]) window.portfolioData.projects.list[idx] = {};

        const p = window.portfolioData.projects.list[idx];
        p.title = document.getElementById('p-edit-title').value.trim();
        p.role = document.getElementById('p-edit-role').value.trim();
        p.image = pImgUrl.value.trim();
        p.summary = document.getElementById('p-edit-summary').value.trim();
        p.duration = document.getElementById('p-edit-duration').value.trim();
        p.technologies = document.getElementById('p-edit-tech').value.trim();
        p.details = document.getElementById('p-edit-details').value.trim();

        // Re-render the projects list from data (single source of truth) so the
        // on-screen card — and every data-edit-key index — stays in sync.
        if (window.PortfolioRender) {
          window.PortfolioRender.refresh('projects');
        } else {
          localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
        }
        this.showToast('✅ Case Study Card updated successfully!');
        closePModal();
      }
    });

    // Apply Text Modal
    textApply.addEventListener('click', () => {
      if (this.activeTextTarget) {
        let val = textInput.value;
        const key = this.activeTextTarget.getAttribute('data-edit-key');
        const isHTML = this.activeTextTarget.getAttribute('data-is-html') === 'true';

        if (isHTML) {
          val = val.replace(/\n/g, '<br>');
          this.activeTextTarget.innerHTML = val;
        } else {
          this.activeTextTarget.textContent = val;
        }

        if (key) {
          this.setNestedValue(window.portfolioData, key, val);
          localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
        }

        this.showToast('✅ Heading / Text updated!');
        closeTextModal();
      }
    });

    // --- DRAG & MOVE INTERACTION ENGINE ---
    document.addEventListener('mousedown', (e) => {
      if (!this.isAdmin || !this.isEditing) return;

      const handle = e.target.closest('.move-drag-handle');
      if (handle) {
        e.preventDefault();
        e.stopPropagation();

        const parentEl = handle.closest('[data-move-id]');
        if (!parentEl) return;

        this.isDragging = true;
        this.currentDragEl = parentEl;
        this.currentDragEl.classList.add('is-dragging');

        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        const moveId = parentEl.getAttribute('data-move-id');
        const currentPos = this.elementPositions[moveId] || { x: 0, y: 0 };
        this.elStartX = currentPos.x;
        this.elStartY = currentPos.y;

        document.body.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isAdmin || !this.isEditing || !this.isDragging || !this.currentDragEl) return;

      e.preventDefault();
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      const newX = Math.round(this.elStartX + dx);
      const newY = Math.round(this.elStartY + dy);

      this.currentDragEl.style.position = 'relative';
      this.currentDragEl.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;

      const moveId = this.currentDragEl.getAttribute('data-move-id');
      this.elementPositions[moveId] = { x: newX, y: newY };
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.currentDragEl) {
          this.currentDragEl.classList.remove('is-dragging');
          this.currentDragEl = null;
        }
        document.body.style.cursor = '';
        localStorage.setItem('portfolio_element_positions', JSON.stringify(this.elementPositions));
      }
    });

    // Double-Click to open Text Edit Modal on any heading or text (Requires Active Admin Edit Mode)
    document.addEventListener('dblclick', (e) => {
      if (!this.isAdmin || !this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        e.preventDefault();
        e.stopPropagation();
        this.openTextModal(editable);
      }
    });

    // Click handler in Edit Mode (Requires Active Admin Edit Mode)
    document.addEventListener('click', (e) => {
      if (!this.isAdmin || !this.isEditing) return;

      // --- Add / Delete list-item controls (the admin add & remove capability) ---
      const delBtn = e.target.closest('.list-del-btn');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.deleteListItem(delBtn.getAttribute('data-del-type'), parseInt(delBtn.getAttribute('data-del-index'), 10));
        return;
      }
      const addBtn = e.target.closest('.list-add-tile, .social-add-pill');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.addListItem(addBtn.getAttribute('data-add-type'));
        return;
      }

      if (e.target.closest('#editor-toolbar') ||
          e.target.closest('#editor-img-modal') || 
          e.target.closest('#editor-text-modal') || 
          e.target.closest('#editor-project-card-modal') || 
          e.target.closest('#admin-auth-modal') || 
          e.target.closest('#toast-container') ||
          e.target.closest('.card-full-edit-btn')) {
        return;
      }

      // Check if clicking Move Handle
      if (e.target.closest('.move-drag-handle')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Check if clicking an image
      const imgFrame = e.target.closest('.arch-img-frame, .project-img-frame, .arch-card-wrapper, [data-img-container]');
      const directImg = e.target.closest('img[data-img-key]');
      const overlay = e.target.closest('.img-edit-overlay');

      if (directImg || overlay || (imgFrame && imgFrame.querySelector('img[data-img-key]'))) {
        e.preventDefault();
        e.stopPropagation();
        const targetImg = directImg || (imgFrame ? imgFrame.querySelector('img[data-img-key]') : null);
        if (targetImg) {
          this.activeImgTarget = targetImg;
          imgUrlInput.value = targetImg.getAttribute('src');
          imgPreview.src = targetImg.getAttribute('src');
          imgModal.classList.add('open');
        }
        return;
      }

      // Check if clicking editable text
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        const parentAnchor = e.target.closest('a');
        if (parentAnchor && !parentAnchor.classList.contains('editor-btn')) {
          e.preventDefault();
        }
        editable.focus();
        return;
      }

      const anyAnchor = e.target.closest('a:not(.editor-btn)');
      if (anyAnchor) {
        e.preventDefault();
      }
    });

    // Real-time live synchronization while typing (Requires Active Admin Edit Mode)
    document.addEventListener('input', (e) => {
      if (!this.isAdmin || !this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        const key = editable.getAttribute('data-edit-key');
        const isHTML = editable.getAttribute('data-is-html') === 'true';
        const val = isHTML ? editable.innerHTML : editable.innerText.trim();
        this.setNestedValue(window.portfolioData, key, val);
      }
    });

    document.addEventListener('blur', (e) => {
      if (!this.isAdmin || !this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        this.syncDOMToData();
        localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));

        // A repo card's URL is the single field that drives its live GitHub data
        // (name, description, language, ⭐ stars, last-updated). When it changes,
        // re-render the Open Source section so the card's data-repo is rebuilt from
        // the new URL and hydrateOpenSource() re-fetches from the GitHub API. Without
        // this, an edited URL is saved but the card keeps the stale (often empty)
        // data-repo it was first rendered with, so it never hydrates. Deferred to a
        // timeout so the click that moved focus away finishes first. No reload needed.
        const key = editable.getAttribute('data-edit-key') || '';
        if (/^openSource\.list\.\d+\.url$/.test(key) && window.PortfolioRender) {
          setTimeout(() => window.PortfolioRender.refresh('openSource'), 0);
        }
      }
    }, true);
  }

  // Open the Text Modal for convenient editing (Strict Admin Only)
  openTextModal(el) {
    if (!this.isAdmin || !this.isEditing) {
      this.openAdminModal();
      return;
    }

    this.activeTextTarget = el;
    const textModal = document.getElementById('editor-text-modal');
    const textInput = document.getElementById('text-modal-input');
    const textLabel = document.getElementById('text-modal-field-label');
    const key = el.getAttribute('data-edit-key') || 'Field';
    const isHTML = el.getAttribute('data-is-html') === 'true';

    textLabel.textContent = `Edit "${key}":`;
    let rawText = isHTML ? el.innerHTML.replace(/<br\s*[\/]?>/gi, '\n') : el.innerText;
    textInput.value = rawText;
    textModal.classList.add('open');
    textInput.focus();
    textInput.select();
  }

  // 11. Toggle visual edit mode
  toggleEditMode(forceState = null) {
    // Require admin authentication to turn on edit mode
    if (!this.isAdmin) {
      this.openAdminModal();
      return;
    }

    this.isEditing = forceState !== null ? forceState : !this.isEditing;
    const body = document.body;
    const toolbar = document.getElementById('editor-toolbar');

    if (this.isEditing) {
      body.classList.add('editor-active');
      if (toolbar) toolbar.classList.add('open');
      this.enableContentEditable(true);
      this.showToast('👑 Edit Mode Active: Edit text directly, swap photos, or click "Edit Case Study" on cards!');
    } else {
      this.syncDOMToData();
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      localStorage.setItem('portfolio_element_positions', JSON.stringify(this.elementPositions));
      body.classList.remove('editor-active');
      if (toolbar) toolbar.classList.remove('open');
      this.enableContentEditable(false);
      this.showToast('👁️ Returned to Public Preview Mode');
    }

    // Let the 3D staging flatten (edit) / resume (preview) in lock-step.
    document.dispatchEvent(new CustomEvent('portfolio:editmodechange', { detail: { editing: this.isEditing } }));
  }

  // 12. Enable/disable contenteditable on tagged text nodes
  enableContentEditable(enable) {
    const editables = document.querySelectorAll('[data-edit-key]');
    editables.forEach(el => {
      el.contentEditable = enable ? 'true' : 'false';
      el.spellcheck = false;
      if (enable) {
        el.setAttribute('title', 'Click to type, or double-click for Edit Popup');
      } else {
        el.removeAttribute('title');
      }
    });
  }

  // 13. Sync DOM edits into memory window.portfolioData
  syncDOMToData() {
    const editables = document.querySelectorAll('[data-edit-key]');
    editables.forEach(el => {
      const key = el.getAttribute('data-edit-key');
      if (key) {
        const isHTML = el.getAttribute('data-is-html') === 'true';
        const val = isHTML ? el.innerHTML : el.innerText.trim();
        this.setNestedValue(window.portfolioData, key, val);
      }
    });

    const editableImgs = document.querySelectorAll('img[data-img-key]');
    editableImgs.forEach(img => {
      const key = img.getAttribute('data-img-key');
      if (key) {
        this.setNestedValue(window.portfolioData, key, img.getAttribute('src'));
      }
    });
  }

  // 14. Helper: set nested property using dot-path notation
  setNestedValue(obj, path, value) {
    if (!path || !obj) return;
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      const nextKey = keys[i + 1];
      const isNextNum = !isNaN(parseInt(nextKey, 10));

      if (current[k] === undefined || current[k] === null) {
        current[k] = isNextNum ? [] : {};
      }
      current = current[k];
    }
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  // 15. Export updated configuration file (portfolio-data.js)
  exportConfigFile() {
    const version = window.PORTFOLIO_DATA_VERSION
      || (window.portfolioData && window.portfolioData.dataVersion) || 1;
    const jsonString = JSON.stringify(window.portfolioData, null, 2);
    const fileContent = `/**
 * ==============================================================================
 * SYED NABEEL AHMED - PORTFOLIO DATA CONFIGURATION
 * Generated via Live Visual Editor
 * ==============================================================================
 */

window.PORTFOLIO_DATA_VERSION = ${version};

window.portfolioData = ${jsonString};
`;
    const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-data.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('📥 Downloaded updated portfolio-data.js!');
  }

  // 16. Toast notification helper
  showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 4000);
  }
}

// Instantiate editor when DOM is ready
window.portfolioEditor = new PortfolioEditor();
