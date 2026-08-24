/**
 * OONIVERSE CREATIONS GALLERY (CREATOR INSTAGRAM PORTFOLIO)
 * Displays authentic creations from @ooniverse_2404 without money/prices
 */
import { store } from './store.js';

class Gallery {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    this.bindEvents();
    // Render immediately from in-memory initial state
    this.render();

    // Then attempt background sync with backend SQLite
    await store.fetchCreations(this.currentCategory, this.searchQuery);
    this.render();

    window.addEventListener('ooniverse_store_creations', () => {
      this.render();
    });
  }

  bindEvents() {
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.dataset.category;
        this.render();
      });
    });

    const searchInput = document.getElementById('gallerySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }
  }

  render() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const allCreations = store.getCreations();
    const creations = store.filterCreationsList(allCreations, this.currentCategory, this.searchQuery);
    const likedPosts = store.getLikedPosts();

    if (!creations || creations.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px; background: #FFF; border-radius: 16px; border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-sparkles" style="font-size: 2rem; color: var(--primary-rose); margin-bottom: 12px;"></i>
          <h3>No creations found in "${this.currentCategory}"</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Request a bespoke custom piece in this category!</p>
          <button class="btn btn-primary btn-sm" onclick="app.navigateTo('customizer')">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Request Custom Quote
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = creations.map(item => {
      const isLiked = likedPosts.includes(item.id);
      const igPostUrl = item.shortcode && !item.shortcode.startsWith('custom_') 
        ? `https://www.instagram.com/p/${item.shortcode}/` 
        : `https://www.instagram.com/ooniverse_2404/`;

      return `
        <article class="post-card" data-id="${item.id}">
          <div class="post-image-wrap">
            <img src="${item.image}" alt="${item.title}" class="post-img" loading="lazy">
            
            <div class="post-badge">
              <i class="fa-brands fa-instagram"></i> ${item.tag || 'Handmade'}
            </div>

            ${item.is_video ? `
              <div class="video-indicator-badge" title="Instagram Reel">
                <i class="fa-solid fa-play"></i> Reel
              </div>
            ` : ''}

            <button class="post-like-btn ${isLiked ? 'liked' : ''}" onclick="gallery.handleLike('${item.id}')" title="Like this post">
              <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
            </button>
          </div>

          <div class="post-body">
            <div class="post-header">
              <h3 class="post-title">${item.title}</h3>
              <span class="post-badge-order"><i class="fa-solid fa-sparkles"></i> Made to Order</span>
            </div>

            <p class="post-desc">${item.caption}</p>

            <div class="post-meta-details">
              <div class="meta-row">
                <i class="fa-solid fa-yarn"></i>
                <span>Yarn: <strong>${item.yarn_type || item.yarnType || 'Milk Cotton'}</strong></span>
              </div>
              <div class="meta-row">
                <i class="fa-solid fa-heart" style="color:#EF4444;"></i>
                <span><strong>${item.likes || 12}</strong> likes on Instagram</span>
              </div>
            </div>

            <div class="post-actions">
              <button class="btn-order-similar" onclick="gallery.orderSimilar('${item.id}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Order Similar
              </button>
              <a href="${igPostUrl}" target="_blank" rel="noopener noreferrer" class="btn-inquire-dm" title="View on Instagram">
                <i class="fa-brands fa-instagram"></i> View Post
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  async handleLike(postId) {
    const isLiked = await store.toggleLikePost(postId);
    if (window.app) {
      window.app.showToast(isLiked ? '❤️ Liked! Saved to your favorites.' : 'Removed from favorites', 'info');
    }
  }

  orderSimilar(postId) {
    const creations = store.getCreations();
    const item = creations.find(c => c.id === postId);
    if (item && window.customizer) {
      window.customizer.prefillWith(item.title, item.category, item.image, item.yarn_type || item.yarnType);
    }
  }
}

export const gallery = new Gallery();
window.gallery = gallery;
