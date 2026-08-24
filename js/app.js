/**
 * OONIVERSE MAIN APP BOOTSTRAPPER & ROUTER
 */
import { store } from './store.js';
import { gallery } from './gallery.js';
import { customizer } from './customizer.js';
import { tracker } from './tracker.js';
import { admin } from './admin.js';

class App {
  constructor() {
    this.currentView = 'home';
    this.init();
  }

  init() {
    this.bindRouting();
    this.handleUrlHash();
  }

  bindRouting() {
    window.addEventListener('hashchange', () => this.handleUrlHash());
  }

  handleUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (['home', 'customizer', 'tracker', 'admin'].includes(hash)) {
      this.navigateTo(hash, false);
    } else {
      this.navigateTo('home', false);
    }
  }

  navigateTo(viewName, updateHash = true) {
    this.currentView = viewName;

    // Update view sections
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
      activeView.classList.add('active');
    }

    // Update nav links (desktop & mobile)
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Close mobile drawer
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) drawer.classList.remove('active');

    // Update URL hash
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Refresh view specific components
    if (viewName === 'home') {
      gallery.render();
    } else if (viewName === 'admin') {
      admin.render();
    } else if (viewName === 'customizer') {
      customizer.updateRequestSummary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu() {
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) {
      drawer.classList.toggle('active');
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'error') icon = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

export const app = new App();
window.app = app;
