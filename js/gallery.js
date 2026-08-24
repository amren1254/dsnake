/**
 * OONIVERSE CREATIONS GALLERY
 * Categorized portfolio with Occasion & Sentiment filters inspired by Hunar Crochet
 */
import { store } from './store.js';

class Gallery {
  constructor() {
    this.currentCategory = 'all';
    this.currentOccasion = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    this.bindEvents();
    // Render immediately from in-memory initial state
    this.render();

    // Then attempt background sync with backend SQLite
    await store.fetchCreations(this.currentCategory, this.currentOccasion, this.searchQuery);
    this.render();

    window.addEventListener('ooniverse_store_creations', () => {
      this.render();
    });
  }

  bindEvents() {
    // Category Pills
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        catPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.dataset.category;
        this.render();
      });
    });

    // Occasion Sentiment Tabs
    const occasionTabs = document.querySelectorAll('.occasion-tab');
    occasionTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        occasionTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentOccasion = e.currentTarget.dataset.occasion;
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
    const creations = store.filterCreationsList(allCreations, this.currentCategory, this.currentOccasion, this.searchQuery);
    const likedPosts = store.getLikedPosts();

    if (!creations || creations.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px; background: #FFF; border-radius: 16px; border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-wand-sparkles" style="font-size: 2rem; color: var(--primary-rose); margin-bottom: 12px;"></i>
          <h3>No creations found for selected filter</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Request a completely custom piece tailored to your vision & occasion!</p>
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

      const rawLikes = Number(item.likes) || 12;
      const formattedLikes = rawLikes >= 1000 ? `${(rawLikes / 1000).toFixed(rawLikes >= 10000 ? 0 : 1)}k` : rawLikes;

      const title = item.title || 'Handcrafted Crochet Piece';
      const yarn = item.yarn_type || item.yarnType || '100% Milk Cotton';
      const description = typeof item.description === 'string' ? item.description : (item.caption || '');

      return `
        <article class="post-card" data-id="${item.id}">
          <div class="post-image-wrap">
            <img src="${item.image}" alt="${title}" class="post-img" loading="lazy">
            
            ${item.sentiment ? `
              <div class="post-badge">
                <span>${item.sentiment}</span>
              </div>
            ` : (item.tag ? `
              <div class="post-badge">
                <span>${item.tag}</span>
              </div>
            ` : '')}

            ${item.is_video ? `
              <div class="video-indicator-badge" title="Instagram Reel">
                <i class="fa-solid fa-play"></i> Reel
              </div>
            ` : ''}

            <button class="post-like-btn ${isLiked ? 'liked' : ''}" onclick="gallery.handleLike('${item.id}')" title="Like this piece" aria-label="Like this piece">
              <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
              <span class="like-num-badge">${formattedLikes}</span>
            </button>
          </div>

          <div class="post-body">
            <h3 class="post-title">${title}</h3>
            <div class="post-yarn-chip">
              <i class="fa-solid fa-seedling"></i>
              <span>${yarn}</span>
            </div>

            ${description ? `<p class="post-desc">${description}</p>` : ''}

            <hr class="post-card-divider">

            <div class="post-footer-actions">
              <a href="${igPostUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-ig" title="View on Instagram (@ooniverse_2404)" aria-label="View on Instagram">
                <i class="fa-brands fa-instagram"></i>
              </a>
              <button class="btn btn-primary btn-card-order" onclick="gallery.orderSimilar('${item.id}')" title="Order" aria-label="Order">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Order</span>
              </button>
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
