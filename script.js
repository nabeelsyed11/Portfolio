/**
 * Syed Nabeel Ahmed - Dynamic Portfolio Script
 * Handles dynamic content rendering from portfolio-data.js,
 * modal popups, active nav highlights, and form interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if portfolioData exists from portfolio-data.js or localStorage
  const savedData = localStorage.getItem('custom_portfolio_data');
  if (savedData) {
    try {
      window.portfolioData = JSON.parse(savedData);
    } catch (e) {
      console.error('Error loading saved portfolio data:', e);
    }
  }

  const data = window.portfolioData;

  // 1. Dynamic Rendering / Hydration
  const renderPortfolio = () => {
    if (!data) return;

    // Helper to get nested value
    const getNested = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Populate all text nodes marked with data-edit-key
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

    // Populate all image sources marked with data-img-key
    document.querySelectorAll('img[data-img-key]').forEach(img => {
      const key = img.getAttribute('data-img-key');
      const src = getNested(data, key);
      if (src) {
        img.src = src;
      }
    });

    // Social link hrefs are emitted directly by render.js (the single source of
    // truth for lists), so no index-based href patching is needed here.
  };

  renderPortfolio();

  // 2. Elements & Navigation
  const navbar = document.getElementById('navbar');
  const navMenu = document.getElementById('nav-menu');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const contactForm = document.getElementById('contact-form');
  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const toastContainer = document.getElementById('toast-container');
  const themeToggle = document.getElementById('theme-toggle');

  // Theme Switcher Logic
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      document.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { theme: newTheme } }));
      localStorage.setItem('portfolio_theme', newTheme);
      if (window.portfolioEditor) {
        window.portfolioEditor.showToast(newTheme === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
      }
    });
  }

  // 3. Header scroll effect & active section tracking
  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let currentSectionId = '';
    const scrollPosition = window.scrollY + 180;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 4. Smooth Anchor Scrolling & Mobile menu toggle
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const hash = this.getAttribute('href');
      if (!hash || hash === '#' || hash === '#admin') return;

      const targetEl = document.querySelector(hash);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
        }
      }
    });
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isExpanded = navMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });
  }

  // 5. Scroll entrance animations (Intersection Observer)
  const animateElements = document.querySelectorAll(
    '.hero-content, .hero-visual, .about-visual, .about-content, .skills-content, .skills-visual, .projects-header-grid, .project-card, .contact-left, .contact-right'
  );

  animateElements.forEach(el => el.classList.add('fade-up'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    animateElements.forEach(el => observer.observe(el));
  } else {
    // No IntersectionObserver: reveal everything so nothing is stuck hidden.
    animateElements.forEach(el => el.classList.add('in-view'));
  }

  // 6. Project Modal Handling
  const openModal = (projectKey) => {
    // Find project from portfolioData.projects.list
    const projectList = (window.portfolioData && window.portfolioData.projects && window.portfolioData.projects.list) || [];
    let project = projectList.find(p => p.id === projectKey);
    
    // Fallback if not matched by ID
    if (!project && !isNaN(projectKey)) {
      project = projectList[parseInt(projectKey, 10)];
    }

    if (!project) return;

    modalBody.innerHTML = `
      <img src="${project.image}" alt="${project.title}" class="modal-header-img">
      <div class="modal-inner-body">
        <span class="role-pill">${project.role}</span>
        <h3 class="modal-title">${project.title}</h3>
        <p class="modal-text">${project.summary}</p>
        
        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <strong>Duration</strong>
            <span>${project.duration || 'Flexible'}</span>
          </div>
          <div class="modal-meta-item">
            <strong>Tech Stack</strong>
            <span>${project.technologies || 'Modern Web Technologies'}</span>
          </div>
        </div>

        <p class="modal-text">${project.details || project.summary}</p>
      </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Expose for other modules (belt-and-suspenders; delegation below handles clicks).
  window.PortfolioApp = { openModal, closeModal };

  // Delegate project-card clicks on the container so dynamically added cards work too.
  const projectsContainer = document.getElementById('projects-list-container');
  if (projectsContainer) {
    projectsContainer.addEventListener('click', (e) => {
      // In edit mode, do NOT open the view modal so the admin can edit cards directly.
      if (document.body.classList.contains('editor-active')) return;
      const card = e.target.closest('.project-card');
      if (!card || !projectsContainer.contains(card)) return;
      openModal(card.getAttribute('data-project'));
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // 7. Contact Form Submission
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');
      const submitBtn = document.getElementById('submit-btn');

      if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
        window.portfolioEditor ? window.portfolioEditor.showToast('Please fill out all fields.') : alert('Please fill out all fields.');
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        window.portfolioEditor ? window.portfolioEditor.showToast('Please enter a valid email address.') : alert('Please enter a valid email address.');
        return;
      }

      const notify = (msg) => window.portfolioEditor
        ? window.portfolioEditor.showToast(msg)
        : alert(msg);

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      // Web3Forms emails each submission straight to your inbox — but only once a
      // real access key is set in index.html. We check whether that key is a valid
      // UUID; if it's still the placeholder, we fall back to opening the visitor's
      // own email client addressed to you, so a message is NEVER silently lost.
      // Paste your real key into index.html and this fallback is skipped automatically.
      const FALLBACK_EMAIL = 'nabeelahmedna7860@gmail.com';
      const accessKey = ((contactForm.querySelector('input[name="access_key"]') || {}).value || '').trim();
      const keyIsReal = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accessKey);

      if (!keyIsReal) {
        // No Web3Forms key yet → hand the message off to the visitor's email app.
        const subject = `Portfolio contact from ${name}`;
        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        window.location.href =
          `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        notify(`📧 Opening your email app — or write to me directly at ${FALLBACK_EMAIL}`);
        return;
      }

      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span>`;

      // Handle the response in-page so the visitor keeps the success animation
      // instead of being redirected away to the Web3Forms confirmation page.
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm)
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          if (data && data.success) {
            contactForm.reset();
            notify('✅ Thank you! Your message has been sent.');
          } else {
            notify('⚠️ Sorry, your message could not be sent. Please email me directly.');
            console.error('[contact] Web3Forms rejected the submission:', data);
          }
        })
        .catch((err) => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          notify('⚠️ Network error — please check your connection or email me directly.');
          console.error('[contact] submission failed:', err);
        });
    });
  }
});
