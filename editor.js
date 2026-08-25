/**
 * ==============================================================================
 * PORTFOLIO LIVE VISUAL EDITOR (CMS ENGINE 4.0 - ADVANCED TEXT & DRAG EDITOR)
 * ==============================================================================
 * Guarantees 100% smooth text and heading editing:
 * 1. Direct inline typing with auto-focus and instant visual sync.
 * 2. Dedicated Text Edit Modal for modifying any heading/text in an input box.
 * 3. Photo replacement modal with file upload and preview.
 * 4. Freeform Drag & Move for container boxes and cards.
 * ==============================================================================
 */

class PortfolioEditor {
  constructor() {
    this.isEditing = false;
    this.activeImgTarget = null;
    this.activeTextTarget = null;
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
    this.setupDraggableContainers();
    this.applySavedPositions();
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

  // 2. Hydrate DOM from portfolioData
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

  // 3. Setup Draggable Move Handles ONLY on container cards & boxes (never on text!)
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
      '.contact-left',
      '.contact-card'
    ];

    let idx = 0;
    containerSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.getAttribute('data-move-id')) {
          el.setAttribute('data-move-id', `container_${el.className.split(' ')[0]}_${idx++}`);
        }

        // Add Move Handle only if not present and element is NOT a text node
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

  // 4. Apply saved positions from localStorage
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

  // 5. Create Editor UI, Toolbar, Image Modal & Text Edit Modal
  createEditorUI() {
    // Floating Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'editor-toggle-btn';
    toggleBtn.className = 'editor-floating-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle Live Visual Editor');
    toggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      <span id="editor-btn-label">✏️ Edit Mode</span>
    `;
    document.body.appendChild(toggleBtn);

    // Floating Action Toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.className = 'editor-toolbar-panel';
    toolbar.innerHTML = `
      <div class="toolbar-brand">
        <span class="live-dot"></span>
        <div class="toolbar-text-group">
          <strong>Visual Editor Active</strong>
          <small>Click any heading or text to edit | Double-click for Edit Popup | Drag ✥ Move to reposition</small>
        </div>
      </div>
      <div class="toolbar-actions">
        <button id="editor-save-btn" class="editor-btn editor-btn-primary" title="Save changes and positions in browser storage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Changes</span>
        </button>

        <button id="editor-reset-layout-btn" class="editor-btn editor-btn-secondary" title="Reset all moved positions back to default">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Reset Layout</span>
        </button>

        <button id="editor-export-btn" class="editor-btn editor-btn-secondary" title="Download updated portfolio-data.js file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Export Config</span>
        </button>

        <button id="editor-reset-btn" class="editor-btn editor-btn-danger" title="Revert to original default content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>Reset All</span>
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
            <small id="text-modal-hint" style="color: var(--text-muted); display: block; margin-top: 0.4rem;">
              You can type text freely. To add a line break in titles, press Enter.
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
  }

  // 6. Bind Events
  bindEvents() {
    const toggleBtn = document.getElementById('editor-toggle-btn');
    const saveBtn = document.getElementById('editor-save-btn');
    const exportBtn = document.getElementById('editor-export-btn');
    const resetBtn = document.getElementById('editor-reset-btn');
    const resetLayoutBtn = document.getElementById('editor-reset-layout-btn');
    const exitBtn = document.getElementById('editor-exit-btn');
    
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
    const textLabel = document.getElementById('text-modal-field-label');

    toggleBtn.addEventListener('click', () => this.toggleEditMode());
    exitBtn.addEventListener('click', () => this.toggleEditMode(false));

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

    // Apply Photo
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
      if (!this.isEditing) return;

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
      if (!this.isDragging || !this.currentDragEl) return;

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

    // Double-Click to open Text Edit Modal on any heading or text
    document.addEventListener('dblclick', (e) => {
      if (!this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        e.preventDefault();
        e.stopPropagation();
        this.openTextModal(editable);
      }
    });

    // Click handler in Edit Mode
    document.addEventListener('click', (e) => {
      if (!this.isEditing) return;

      if (e.target.closest('#editor-toolbar') || 
          e.target.closest('#editor-img-modal') || 
          e.target.closest('#editor-text-modal') || 
          e.target.closest('#editor-toggle-btn') || 
          e.target.closest('#toast-container')) {
        return;
      }

      // Check if clicking Move Handle
      if (e.target.closest('.move-drag-handle')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Check if clicking an image
      const imgFrame = e.target.closest('.arch-img-frame, .project-img-frame, .arch-card-wrapper, .project-card, [data-img-container]');
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
        // Focus and select text for effortless typing
        editable.focus();
        return;
      }

      const anyAnchor = e.target.closest('a:not(.editor-btn)');
      if (anyAnchor) {
        e.preventDefault();
      }
    });

    // Real-time live synchronization while typing
    document.addEventListener('input', (e) => {
      if (!this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        const key = editable.getAttribute('data-edit-key');
        const isHTML = editable.getAttribute('data-is-html') === 'true';
        const val = isHTML ? editable.innerHTML : editable.innerText.trim();
        this.setNestedValue(window.portfolioData, key, val);
      }
    });

    document.addEventListener('blur', (e) => {
      if (!this.isEditing) return;
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        this.syncDOMToData();
        localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      }
    }, true);
  }

  // Open the Text Modal for convenient editing
  openTextModal(el) {
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

  // 7. Toggle visual edit mode
  toggleEditMode(forceState = null) {
    this.isEditing = forceState !== null ? forceState : !this.isEditing;
    const body = document.body;
    const toggleBtn = document.getElementById('editor-toggle-btn');
    const toolbar = document.getElementById('editor-toolbar');
    const btnLabel = document.getElementById('editor-btn-label');

    if (this.isEditing) {
      body.classList.add('editor-active');
      toolbar.classList.add('open');
      toggleBtn.classList.add('active');
      btnLabel.textContent = '✏️ Editing Active';
      this.enableContentEditable(true);
      this.showToast('✏️ Edit Mode Active: Click any heading/text to type directly, or double-click for Edit Popup!');
    } else {
      this.syncDOMToData();
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      localStorage.setItem('portfolio_element_positions', JSON.stringify(this.elementPositions));
      body.classList.remove('editor-active');
      toolbar.classList.remove('open');
      toggleBtn.classList.remove('active');
      btnLabel.textContent = '✏️ Edit Mode';
      this.enableContentEditable(false);
      this.showToast('👁️ Returned to Preview Mode');
    }
  }

  // 8. Enable/disable contenteditable on tagged text nodes
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

  // 9. Sync DOM edits into memory window.portfolioData
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

  // 10. Helper: set nested property using dot-path notation
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

  // 11. Export updated configuration file (portfolio-data.js)
  exportConfigFile() {
    const jsonString = JSON.stringify(window.portfolioData, null, 2);
    const fileContent = `/**
 * ==============================================================================
 * SYED NABEEL AHMED - PORTFOLIO DATA CONFIGURATION
 * Generated via Live Visual Editor
 * ==============================================================================
 */

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

  // 12. Toast notification helper
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
