/**
 * ==============================================================================
 * PORTFOLIO LIVE VISUAL EDITOR (CMS ENGINE 2.0)
 * ==============================================================================
 * Comprehensive real-time visual editor allowing live on-screen editing of
 * ALL headings, sub-headings, paragraphs, tags, badges, buttons, links,
 * and photos with instant preview, image uploads, and localStorage persistence.
 * ==============================================================================
 */

class PortfolioEditor {
  constructor() {
    this.isEditing = false;
    this.activeImgTarget = null;
    this.initStorage();
    this.createEditorUI();
    this.bindEvents();
    this.autoHydrateDOM();
  }

  // 1. Initialize local storage or fallback to default portfolioData
  initStorage() {
    const saved = localStorage.getItem('custom_portfolio_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        window.portfolioData = Object.assign({}, window.portfolioData, parsed);
        console.log('Loaded customized portfolio data from localStorage.');
      } catch (e) {
        console.error('Failed to parse saved portfolio data:', e);
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

  // 3. Create the floating Edit Mode button, Toolbar, and Image Modal
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
          <small>Click any text to type, or click any photo to replace</small>
        </div>
      </div>
      <div class="toolbar-actions">
        <button id="editor-save-btn" class="editor-btn editor-btn-primary" title="Save changes in browser storage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Changes</span>
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
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
          <span>Reset</span>
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
  }

  // 4. Bind events
  bindEvents() {
    const toggleBtn = document.getElementById('editor-toggle-btn');
    const saveBtn = document.getElementById('editor-save-btn');
    const exportBtn = document.getElementById('editor-export-btn');
    const resetBtn = document.getElementById('editor-reset-btn');
    const exitBtn = document.getElementById('editor-exit-btn');
    
    // Image modal elements
    const imgModal = document.getElementById('editor-img-modal');
    const imgClose = document.getElementById('img-modal-close');
    const imgCancel = document.getElementById('img-modal-cancel');
    const imgApply = document.getElementById('img-modal-apply');
    const imgFileInput = document.getElementById('img-modal-file');
    const imgUrlInput = document.getElementById('img-modal-url');
    const imgPreview = document.getElementById('img-modal-preview');

    toggleBtn.addEventListener('click', () => this.toggleEditMode());
    exitBtn.addEventListener('click', () => this.toggleEditMode(false));

    saveBtn.addEventListener('click', () => {
      this.syncDOMToData();
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      this.showToast('✅ All edits and images saved to browser storage!');
    });

    exportBtn.addEventListener('click', () => {
      this.syncDOMToData();
      this.exportConfigFile();
    });

    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all content and photos back to original defaults?')) {
        localStorage.removeItem('custom_portfolio_data');
        window.location.reload();
      }
    });

    // Image Modal events
    const closeImgModal = () => {
      imgModal.classList.remove('open');
      this.activeImgTarget = null;
    };

    imgClose.addEventListener('click', closeImgModal);
    imgCancel.addEventListener('click', closeImgModal);

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

    // Universal Click Interceptor for Edit Mode
    document.addEventListener('click', (e) => {
      if (!this.isEditing) return;

      // Don't intercept clicks inside editor toolbar or modal
      if (e.target.closest('#editor-toolbar') || e.target.closest('#editor-img-modal') || e.target.closest('#editor-toggle-btn') || e.target.closest('#toast-container')) {
        return;
      }

      // Check if user clicked an image or its overlay/container
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

      // Check if user clicked an editable text element or anchor
      const editable = e.target.closest('[data-edit-key]');
      if (editable) {
        // Prevent anchor navigation while editing
        const parentAnchor = e.target.closest('a');
        if (parentAnchor && !parentAnchor.classList.contains('editor-btn')) {
          e.preventDefault();
        }
        editable.focus();
        return;
      }

      // Prevent regular links from navigating when in edit mode
      const anyAnchor = e.target.closest('a:not(.editor-btn)');
      if (anyAnchor) {
        e.preventDefault();
      }
    }, true);

    // Auto-save text inputs in real-time on input/blur
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

  // 5. Toggle visual edit mode
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
      this.showToast('✏️ Edit Mode ON: Click any headline, text, or photo directly on the page to edit!');
    } else {
      this.syncDOMToData();
      localStorage.setItem('custom_portfolio_data', JSON.stringify(window.portfolioData));
      body.classList.remove('editor-active');
      toolbar.classList.remove('open');
      toggleBtn.classList.remove('active');
      btnLabel.textContent = '✏️ Edit Mode';
      this.enableContentEditable(false);
      this.showToast('👁️ Returned to Preview Mode');
    }
  }

  // 6. Enable/disable contenteditable on tagged text nodes
  enableContentEditable(enable) {
    const editables = document.querySelectorAll('[data-edit-key]');
    editables.forEach(el => {
      el.contentEditable = enable ? 'true' : 'false';
      el.spellcheck = false;
      if (enable) {
        el.setAttribute('title', 'Click to edit text');
      } else {
        el.removeAttribute('title');
      }
    });
  }

  // 7. Sync DOM edits into memory window.portfolioData
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

  // 8. Helper: set nested property using dot-path notation
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

  // 9. Export updated configuration file (portfolio-data.js)
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

  // 10. Toast notification helper
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
