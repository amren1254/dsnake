/**
 * OONIVERSE CREATIONS GALLERY
 * Curated Editorial Chapters + Full Archive with Floriography Storytelling
 * Reads directly from Instagram data without altering the source JSON file
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
    this.render();

    // Background sync with backend
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
        this.renderArchiveGrid();
      });
    });

    // Occasion Sentiment Tabs
    const occasionTabs = document.querySelectorAll('.occasion-tab');
    occasionTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        occasionTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentOccasion = e.currentTarget.dataset.occasion;
        this.renderArchiveGrid();
      });
    });

    const searchInput = document.getElementById('gallerySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderArchiveGrid();
      });
    }
  }

  render() {
    this.renderCuratedChapters();
    this.renderArchiveGrid();
  }

  renderCardHtml(item, likedPosts) {
    const isLiked = likedPosts.includes(item.id);
    const igPostUrl = item.shortcode && !item.shortcode.startsWith('custom_') 
      ? `https://www.instagram.com/p/${item.shortcode}/` 
      : `https://www.instagram.com/ooniverse_2404/`;

    const rawLikes = Number(item.likes) || 0;
    const formattedLikes = rawLikes >= 1000 ? `${(rawLikes / 1000).toFixed(rawLikes >= 10000 ? 0 : 1)}k` : rawLikes;

    const caption = item.caption || item.description || '';
    const title = item.title || (caption ? caption.split('\n')[0].replace(/#\S+/g, '').trim() : 'Handmade Crochet Piece') || 'Handmade Crochet Piece';

    return `
      <article class="post-card" data-id="${item.id}">
        <div class="post-image-wrap">
          <img src="${item.image}" alt="${title}" class="post-img" loading="lazy">

          ${item.is_video ? `
            <div class="video-indicator-badge" title="Instagram Reel">
              <i class="fa-solid fa-play"></i> Reel
            </div>
          ` : ''}

          <button class="post-like-btn ${isLiked ? 'liked' : ''}" onclick="gallery.handleLike('${item.id}')" title="Save to favorites" aria-label="Like this piece">
            <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
            <span class="like-num-badge">${formattedLikes}</span>
          </button>
        </div>

        <div class="post-body">
          <h3 class="post-title">${title}</h3>

          ${caption ? `<p class="post-desc">${caption}</p>` : ''}

          <hr class="post-card-divider">

          <div class="post-footer-actions">
            <a href="${igPostUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-ig" title="View authentic post on Instagram (@ooniverse_2404)" aria-label="View on Instagram">
              <i class="fa-brands fa-instagram"></i>
            </a>
            <button class="btn btn-primary btn-card-order" onclick="gallery.orderSimilar('${item.id}')" title="Request custom quote for this piece" aria-label="Order">
              <i class="fa-solid fa-cart-shopping"></i>
              <span>Order</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  renderCuratedChapters() {
    const chaptersWrap = document.getElementById('curatedChapters');
    if (!chaptersWrap) return;

    const allCreations = store.getCreations();
    const likedPosts = store.getLikedPosts();

    // Bouquets category
    const bouquetItems = allCreations.filter(c => c.category === 'bouquets').slice(0, 4);

    // Bags category
    const bagItems = allCreations.filter(c => c.category === 'bags').slice(0, 4);

    // Wearables & Plushies
    const companionItems = allCreations.filter(c => ['amigurumi', 'wearables', 'keychains'].includes(c.category)).slice(0, 4);

    chaptersWrap.innerHTML = `
      <!-- Bouquets Showcase -->
      ${bouquetItems.length > 0 ? `
        <section class="chapter-block">
          <div class="chapter-header">
            <div class="chapter-heading-wrap">
              <span class="chapter-tag">🌸 Bouquets Collection</span>
              <h2 class="chapter-title">Floral Bouquets</h2>
              <p class="chapter-desc">Handmade floral crochet wraps from @ooniverse_2404</p>
            </div>
            <button class="chapter-view-all-btn" onclick="gallery.filterByCategory('bouquets')">
              <span>View All Bouquets</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div class="chapter-grid">
            ${bouquetItems.map(item => this.renderCardHtml(item, likedPosts)).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Bags & Potlis Showcase -->
      ${bagItems.length > 0 ? `
        <section class="chapter-block">
          <div class="chapter-header">
            <div class="chapter-heading-wrap">
              <span class="chapter-tag">👜 Bags & Potlis</span>
              <h2 class="chapter-title">Rose Petal Potlis & Bags</h2>
              <p class="chapter-desc">Handmade drawstring potlis and bags from @ooniverse_2404</p>
            </div>
            <button class="chapter-view-all-btn" onclick="gallery.filterByCategory('bags')">
              <span>View All Bags</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div class="chapter-grid">
            ${bagItems.map(item => this.renderCardHtml(item, likedPosts)).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Wearables & Plushies Showcase -->
      ${companionItems.length > 0 ? `
        <section class="chapter-block">
          <div class="chapter-header">
            <div class="chapter-heading-wrap">
              <span class="chapter-tag">🎀 Wearables & Plushies</span>
              <h2 class="chapter-title">Wearables, Hairties & Plushies</h2>
              <p class="chapter-desc">Handmade crochet hairties, desk companions, and charms from @ooniverse_2404</p>
            </div>
            <button class="chapter-view-all-btn" onclick="gallery.filterByCategory('wearables')">
              <span>View All Wearables</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div class="chapter-grid">
            ${companionItems.map(item => this.renderCardHtml(item, likedPosts)).join('')}
          </div>
        </section>
      ` : ''}
    `;
  }

  renderArchiveGrid() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const allCreations = store.getCreations();
    const creations = store.filterCreationsList(allCreations, this.currentCategory, this.currentOccasion, this.searchQuery);
    const likedPosts = store.getLikedPosts();

    if (!creations || creations.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px; background: #FFFFFF; border-radius: 18px; border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-wand-sparkles" style="font-size: 2rem; color: var(--primary-rose); margin-bottom: 12px;"></i>
          <h3 style="font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 6px;">No pieces found for selected filter</h3>
          <p style="color: var(--text-muted); margin: 6px 0 16px;">Request a bespoke creation tailored to your exact colors, character or occasion!</p>
          <button class="btn btn-primary btn-sm" onclick="app.navigateTo('customizer')">
            <i class="fa-solid fa-cart-shopping"></i> Request Custom Quote
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = creations.map(item => this.renderCardHtml(item, likedPosts)).join('');
  }

  filterByCategory(categoryKey) {
    this.currentCategory = categoryKey;
    if (window.app) {
      window.app.navigateTo('products');
    }
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
      if (pill.dataset.category === categoryKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.renderArchiveGrid();
  }

  async handleLike(postId) {
    const isLiked = await store.toggleLikePost(postId);
    if (window.app) {
      window.app.showToast(isLiked ? 'Saved to your favorites' : 'Removed from favorites', 'info');
    }
    this.render();
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

