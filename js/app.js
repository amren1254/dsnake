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
    this.handleUrlRouting();
    this.updateAdminNavVisibility();

    // Dynamically update admin tab visibility when creator logs in or logs out
    window.addEventListener('ooniverse_store_auth', () => {
      this.updateAdminNavVisibility();
    });
  }

  bindRouting() {
    window.addEventListener('hashchange', () => this.handleUrlRouting());
    window.addEventListener('popstate', () => this.handleUrlRouting());
  }

  handleUrlRouting() {
    // 1. Pathname check: /admin, /admin/, /products, /tracker, /customizer, /home, /
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    // 2. Hash check: #admin, #products, #tracker, #customizer, #home
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();

    if (rawPath === 'admin' || rawHash === 'admin') {
      this.navigateTo('admin', false);
    } else if (['products', 'customizer', 'tracker'].includes(rawPath)) {
      this.navigateTo(rawPath, false);
    } else if (['products', 'customizer', 'tracker'].includes(rawHash)) {
      this.navigateTo(rawHash, false);
    } else {
      this.navigateTo('home', false);
    }
  }

  updateAdminNavVisibility() {
    const adminNavItems = document.querySelectorAll('.nav-item[data-view="admin"], .mobile-nav-item[data-view="admin"]');
    const isAuth = store.isAuthenticated();
    const isAdminView = this.currentView === 'admin';

    adminNavItems.forEach(item => {
      if (isAdminView || isAuth) {
        item.style.display = item.classList.contains('mobile-nav-item') ? 'flex' : 'inline-flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  navigateTo(viewName, updateUrl = true) {
    this.currentView = viewName;

    // Update view sections
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
      activeView.classList.add('active');
    }

    // Update nav visibility (ensure admin tab is displayed when on admin view or logged in)
    this.updateAdminNavVisibility();

    // Update nav links active state (desktop & mobile)
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Close mobile drawer
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) drawer.classList.remove('active');

    // Update URL history / hash
    if (updateUrl) {
      if (viewName === 'admin') {
        const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
        if (currentPath !== 'admin') {
          try {
            window.history.pushState({ view: 'admin' }, '', '/admin');
          } catch (e) {
            window.location.hash = 'admin';
          }
        }
      } else {
        const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
        if (currentPath === 'admin') {
          try {
            window.history.pushState({ view: viewName }, '', viewName === 'home' ? '/' : `/#${viewName}`);
          } catch (e) {
            window.location.hash = viewName === 'home' ? '' : viewName;
          }
        } else {
          window.location.hash = viewName === 'home' ? '' : viewName;
        }
      }
    }

    // Refresh view specific components
    if (viewName === 'home' || viewName === 'products') {
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
