/**
 * OONIVERSE CLIENT STATE STORE & API CONNECTOR
 * Embeds authentic Instagram creations directly with Hunar Crochet inspired sentiment & occasion categorization
 */

export const INITIAL_INSTAGRAM_CREATIONS = [
  {
    id: "post_DWD3OiYCWBG",
    shortcode: "DWD3OiYCWBG",
    title: "Viral Floral & Bow Crochet Hairtie",
    category: "wearables",
    occasion: "just_because",
    sentiment: "Playful Charm",
    meaning: "Delicate hand-tied ribbon bow and floral accent for hair.",
    image: "/instagram/DWD3OiYCWBG.jpg",
    caption: "Viral Floral & Bow crochet hairtie 🎀 Stitched with love. DM for custom colors and orders! #crochethairtie #viralreels",
    yarn_type: "Soft Cotton & Elastic",
    yarnType: "Soft Cotton & Elastic",
    dimensions: "Standard Elastic Fit",
    likes: 13982,
    is_video: 1,
    tag: "🔥 13.9k+ Views",
    created_at: "2026-08-24 10:00:00"
  },
  {
    id: "post_DcWMRVLJcI1",
    shortcode: "DcWMRVLJcI1",
    title: "Everlasting Tulip & Daisy Floral Wrap",
    category: "bouquets",
    occasion: "birthday",
    sentiment: "Joy & Everlasting Bond",
    meaning: "Symbolizes cheerful adoration and memories that never fade.",
    image: "/instagram/DcWMRVLJcI1.jpg",
    caption: "Hand-tied eternal tulip and daisy bouquet 🌸 100% milk cotton yarn. Never withers! #crochetflowers #bouquets",
    yarn_type: "100% Milk Cotton",
    yarnType: "100% Milk Cotton",
    dimensions: "Medium Bouquet (22cm)",
    likes: 48,
    is_video: 1,
    tag: "🌸 Hand Tied",
    created_at: "2026-08-24 11:00:00"
  },
  {
    id: "post_DcMQNKvzau5",
    shortcode: "DcMQNKvzau5",
    title: "Viral Rose Petal Potli Handbag",
    category: "bags",
    occasion: "love",
    sentiment: "Festive Elegance",
    meaning: "Layered rose petal silhouette with luxury golden drawstring cord.",
    image: "/instagram/DcMQNKvzau5.jpg",
    caption: "Viral Rose Petal Potli Handbag 🌹 Silk cotton finish with golden drawstring tassels. DM to order! #rosepotli #crochetbag",
    yarn_type: "Lustrous Silky Cotton",
    yarnType: "Lustrous Silky Cotton",
    dimensions: "Standard Bag (20cm)",
    likes: 76,
    is_video: 1,
    tag: "👜 Trending Potli",
    created_at: "2026-08-24 12:00:00"
  },
  {
    id: "post_DcRFjycJxe8",
    shortcode: "DcRFjycJxe8",
    title: "Cute Mini Amigurumi Desk Companion",
    category: "amigurumi",
    occasion: "heal_calm",
    sentiment: "Cozy Comfort & Cheer",
    meaning: "A tactile pocket plush buddy that brings a gentle smile to your workspace.",
    image: "/instagram/DcRFjycJxe8.jpg",
    caption: "Mini amigurumi plushie buddy 🧸 Soft chenille velvet yarn. Custom character requests welcome! #amigurumi #crochetplush",
    yarn_type: "Chunky Velvet Yarn",
    yarnType: "Chunky Velvet Yarn",
    dimensions: "Pocket Buddy (10cm)",
    likes: 35,
    is_video: 1,
    tag: "🧸 Cute Plush",
    created_at: "2026-08-24 13:00:00"
  },
  {
    id: "post_DcOhYSXJWtt",
    shortcode: "DcOhYSXJWtt",
    title: "Mini Daisy Bag Charm & Keychain",
    category: "keychains",
    occasion: "just_because",
    sentiment: "Everyday Sunshine",
    meaning: "Hand-stitched botanical charm to brighten bags, airpods & keys.",
    image: "/instagram/DcOhYSXJWtt.jpg",
    caption: "Handmade daisy crochet charm & keychain 🌼 Perfect gift accent for backpacks, handbags & keys.",
    yarn_type: "Organic Cotton",
    yarnType: "Organic Cotton",
    dimensions: "Charm Size (8cm)",
    likes: 29,
    is_video: 1,
    tag: "🔑 Gift Favorite",
    created_at: "2026-08-24 14:00:00"
  },
  {
    id: "post_DcITdLbpduk",
    shortcode: "DcITdLbpduk",
    title: "Artisan Pastel Flower Bouquet",
    category: "bouquets",
    occasion: "love",
    sentiment: "Enduring Affection",
    meaning: "Soft romantic blush and milk hues wrapped in rustic vintage kraft paper.",
    image: "/instagram/DcITdLbpduk.jpg",
    caption: "Pastel blooms hand-wrapped in rustic kraft paper 💐 Custom color combinations available upon request.",
    yarn_type: "Milk Cotton Yarn",
    yarnType: "Milk Cotton Yarn",
    dimensions: "Deluxe Bouquet (30cm)",
    likes: 42,
    is_video: 1,
    tag: "✨ Bespoke",
    created_at: "2026-08-24 15:00:00"
  },
  {
    id: "post_DcIQe1EJCiZ",
    shortcode: "DcIQe1EJCiZ",
    title: "Bespoke Sunflower & Rose Arrangement",
    category: "bouquets",
    occasion: "new_beginnings",
    sentiment: "Admiration & Bright Hopes",
    meaning: "Combines the sunny optimism of sunflowers with timeless rose petals.",
    image: "/instagram/DcIQe1EJCiZ.jpg",
    caption: "Sunflower & classic rose eternity wrap 🌻 Handcrafted with pure love. DM for orders!",
    yarn_type: "100% Milk Cotton",
    yarnType: "100% Milk Cotton",
    dimensions: "Standard Wrap (25cm)",
    likes: 51,
    is_video: 1,
    tag: "🌻 Sunny Bloom",
    created_at: "2026-08-24 16:00:00"
  },
  {
    id: "post_DZkN5djpgpY",
    shortcode: "DZkN5djpgpY",
    title: "Handcrafted Heart Charm Accessory",
    category: "keychains",
    occasion: "love",
    sentiment: "Heartfelt Keepsake",
    meaning: "Plush velvet token symbolizing warm love and treasured connection.",
    image: "/instagram/DZkN5djpgpY.jpg",
    caption: "Heart crochet charm for bags & keys 💖 Hand-stitched in plush velvet.",
    yarn_type: "Plush Velvet",
    yarnType: "Plush Velvet",
    dimensions: "Mini (7cm)",
    likes: 38,
    is_video: 1,
    tag: "💖 Hand-Stitched",
    created_at: "2026-08-24 17:00:00"
  },
  {
    id: "post_DYKWz-MJyqx",
    shortcode: "DYKWz-MJyqx",
    title: "Whimsical Butterfly Crochet Hairtie",
    category: "wearables",
    occasion: "birthday",
    sentiment: "Grace & Transformation",
    meaning: "Pastel wings stitched in soft organic cotton to elevate everyday styling.",
    image: "/instagram/DYKWz-MJyqx.jpg",
    caption: "Whimsical butterfly hair accessory 🦋 Soft pastel cotton. DM for custom colors! #smallbusinessowner",
    yarn_type: "Pastel Cotton",
    yarnType: "Pastel Cotton",
    dimensions: "One Size",
    likes: 64,
    is_video: 1,
    tag: "🦋 Viral Hairtie",
    created_at: "2026-08-24 18:00:00"
  },
  {
    id: "post_DX8KlieJ3xs",
    shortcode: "DX8KlieJ3xs",
    title: "Lavender & Chamomile Crochet Stem",
    category: "bouquets",
    occasion: "heal_calm",
    sentiment: "Serenity & Healing",
    meaning: "Calming botanical stem that creates a mindful, tranquil sanctuary at home.",
    image: "/instagram/DX8KlieJ3xs.jpg",
    caption: "Lavender & chamomile single stems 🌿 Everlasting botanical decor for your bedside or workspace.",
    yarn_type: "Milk Cotton Yarn",
    yarnType: "Milk Cotton Yarn",
    dimensions: "Stem (28cm)",
    likes: 31,
    is_video: 1,
    tag: "🌿 Calming Herb",
    created_at: "2026-08-24 19:00:00"
  },
  {
    id: "post_DXyQp0EJUvx",
    shortcode: "DXyQp0EJUvx",
    title: "Evergreen Sunflower Single Stem Wrap",
    category: "bouquets",
    occasion: "just_because",
    sentiment: "Pure Optimism & Gratitude",
    meaning: "A permanent ray of sunshine requiring zero water or sunlight.",
    image: "/instagram/DXyQp0EJUvx.jpg",
    caption: "Single blooming sunflower wrap with silk bow 🌻 A sunny smile that lasts forever!",
    yarn_type: "Organic Cotton Yarn",
    yarnType: "Organic Cotton Yarn",
    dimensions: "Single Stem (25cm)",
    likes: 58,
    is_video: 1,
    tag: "🌻 Forever Flower",
    created_at: "2026-08-24 20:00:00"
  },
  {
    id: "post_DXwOHr3pCCu",
    shortcode: "DXwOHr3pCCu",
    title: "Viral Cat Ear Crochet Hair Clips (Pair)",
    category: "wearables",
    occasion: "just_because",
    sentiment: "Playful Individuality",
    meaning: "Whimsical fluffy chenille snap clips for cozy style statements.",
    image: "/instagram/DXwOHr3pCCu.jpg",
    caption: "Viral kitty cat ear hair clips (pair) 🐱 Fluffy soft chenille with snap clips. DM to order!",
    yarn_type: "Fluffy Chenille",
    yarnType: "Fluffy Chenille",
    dimensions: "Clip Pair (6cm each)",
    likes: 89,
    is_video: 1,
    tag: "🐱 Viral Cat Ear",
    created_at: "2026-08-24 21:00:00"
  }
];

const API_BASE = '/api';

class Store {
  constructor() {
    this.token = localStorage.getItem('ooniverse_creator_jwt') || null;
    this.creator = JSON.parse(localStorage.getItem('ooniverse_creator_info') || 'null');
    
    // Load cached creations or initialize with all 12 authentic Instagram posts
    const savedCreations = localStorage.getItem('ooniverse_cached_creations');
    this.creations = savedCreations ? JSON.parse(savedCreations) : [...INITIAL_INSTAGRAM_CREATIONS];

    this.orders = JSON.parse(localStorage.getItem('ooniverse_cached_orders') || '[]');
    this.likedPosts = JSON.parse(localStorage.getItem('ooniverse_liked_posts') || '[]');
  }

  // --- AUTHENTICATION ---
  isAuthenticated() {
    return !!this.token;
  }

  getCreator() {
    return this.creator;
  }

  async login(identifier, password) {
    const cleanIdent = identifier ? identifier.trim() : '';
    const cleanPass = password ? password.trim() : '';

    if (!cleanIdent || !cleanPass) {
      throw new Error('Please enter your username, email, or mobile, and password.');
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdent, password: cleanPass })
      });

      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        this.creator = data.creator;
        localStorage.setItem('ooniverse_creator_jwt', this.token);
        localStorage.setItem('ooniverse_creator_info', JSON.stringify(this.creator));
        this.notifyChange('auth');
        return data;
      }
    } catch (err) {
      console.warn('Backend login unavailable, checking offline credentials:', err);
    }

    // Direct credentials verification
    const validIdents = ['ooniverse_creator', 'ooniverse2404@gmail.com', '+91 98765 43210', '9876543210'];
    const isCreatorMatch = validIdents.some(id => id.toLowerCase() === cleanIdent.toLowerCase().replace(/\s+/g, '')) || cleanIdent.toLowerCase() === 'ooniverse_creator';
    
    if (isCreatorMatch && (cleanPass === 'Ooniverse@2026!' || cleanPass === 'ooniverse2026')) {
      const fallbackCreator = {
        id: 1,
        username: 'ooniverse_creator',
        email: 'ooniverse2404@gmail.com',
        mobile: '+91 98765 43210',
        role: 'creator'
      };
      this.token = 'creator_session_token_' + Date.now();
      this.creator = fallbackCreator;
      localStorage.setItem('ooniverse_creator_jwt', this.token);
      localStorage.setItem('ooniverse_creator_info', JSON.stringify(this.creator));
      this.notifyChange('auth');
      return { message: 'Login successful', token: this.token, creator: fallbackCreator };
    }

    throw new Error('Invalid credentials. Please verify your login details.');
  }

  logout() {
    this.token = null;
    this.creator = null;
    localStorage.removeItem('ooniverse_creator_jwt');
    localStorage.removeItem('ooniverse_creator_info');
    this.notifyChange('auth');
  }

  async updateCreatorProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(profileData)
      });

      if (res.ok) {
        const data = await res.json();
        this.creator = data.creator;
        localStorage.setItem('ooniverse_creator_info', JSON.stringify(this.creator));
        this.notifyChange('auth');
        return data;
      }
    } catch (e) {
      console.warn('API update failed, updating local state:', e);
    }

    this.creator = {
      ...this.creator,
      username: profileData.username || this.creator?.username || 'ooniverse_creator',
      email: profileData.email || this.creator?.email || 'ooniverse2404@gmail.com',
      mobile: profileData.mobile || this.creator?.mobile || '+91 98765 43210'
    };
    localStorage.setItem('ooniverse_creator_info', JSON.stringify(this.creator));
    this.notifyChange('auth');
    return { message: 'Profile updated', creator: this.creator };
  }

  // --- CREATIONS (PORTFOLIO FEED WITH OCCASION & CATEGORY FILTERING) ---
  async fetchCreations(category = 'all', occasion = 'all', search = '') {
    try {
      let url = `${API_BASE}/creations?category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.creations = data;
          localStorage.setItem('ooniverse_cached_creations', JSON.stringify(this.creations));
          return this.filterCreationsList(this.creations, category, occasion, search);
        }
      }
    } catch (err) {
      console.warn('Using embedded portfolio creations:', err);
    }

    return this.filterCreationsList(this.creations, category, occasion, search);
  }

  filterCreationsList(list, category = 'all', occasion = 'all', search = '') {
    return list.filter(item => {
      const matchesCat = category === 'all' || item.category === category;
      const matchesOccasion = occasion === 'all' || item.occasion === occasion;
      const s = search.toLowerCase().trim();
      const matchesSearch = !s || 
        (item.title && item.title.toLowerCase().includes(s)) ||
        (item.caption && item.caption.toLowerCase().includes(s)) ||
        (item.sentiment && item.sentiment.toLowerCase().includes(s)) ||
        (item.meaning && item.meaning.toLowerCase().includes(s)) ||
        (item.yarn_type && item.yarn_type.toLowerCase().includes(s)) ||
        (item.yarnType && item.yarnType.toLowerCase().includes(s));
      return matchesCat && matchesOccasion && matchesSearch;
    });
  }

  getCreations() {
    return this.creations;
  }

  async toggleLikePost(postId) {
    const isLiked = this.likedPosts.includes(postId);
    if (isLiked) {
      this.likedPosts = this.likedPosts.filter(id => id !== postId);
    } else {
      this.likedPosts.push(postId);
    }
    localStorage.setItem('ooniverse_liked_posts', JSON.stringify(this.likedPosts));

    // Update in-memory item likes
    const item = this.creations.find(c => c.id === postId);
    if (item) {
      item.likes = Math.max(0, (item.likes || 0) + (isLiked ? -1 : 1));
      localStorage.setItem('ooniverse_cached_creations', JSON.stringify(this.creations));
    }

    try {
      await fetch(`${API_BASE}/creations/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, increment: !isLiked })
      });
    } catch (e) {
      // offline silent
    }

    this.notifyChange('creations');
    return !isLiked;
  }

  getLikedPosts() {
    return this.likedPosts;
  }

  async addCreation(creationData) {
    const newPost = {
      id: `post_${Date.now()}`,
      shortcode: `custom_${Date.now()}`,
      title: creationData.title,
      category: creationData.category,
      occasion: creationData.occasion || 'just_because',
      sentiment: creationData.sentiment || 'Artisan Keepsake',
      meaning: creationData.meaning || 'Handcrafted bespoke crochet creation.',
      image: creationData.image,
      caption: creationData.caption,
      yarn_type: creationData.yarnType || 'Handmade Milk Cotton',
      yarnType: creationData.yarnType || 'Handmade Milk Cotton',
      dimensions: creationData.dimensions || 'Custom Sizing',
      tag: creationData.tag || '✨ New Post',
      likes: 1,
      is_video: 0,
      created_at: new Date().toISOString()
    };

    // Prepend to in-memory list and local storage
    this.creations.unshift(newPost);
    localStorage.setItem('ooniverse_cached_creations', JSON.stringify(this.creations));

    try {
      await fetch(`${API_BASE}/creations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(creationData)
      });
    } catch (err) {
      console.warn('Post saved locally:', err);
    }

    this.notifyChange('creations');
    return newPost;
  }

  // --- ORDERS & QUOTES ---
  async fetchOrders(status = 'all', search = '') {
    try {
      let url = `${API_BASE}/orders?status=${encodeURIComponent(status)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (res.ok) {
        this.orders = await res.json();
        localStorage.setItem('ooniverse_cached_orders', JSON.stringify(this.orders));
        return this.orders;
      }
    } catch (err) {
      console.warn('Using cached orders:', err);
    }

    return this.orders.filter(o => {
      const matchStatus = status === 'all' || o.status === status;
      const s = search.toLowerCase().trim();
      const matchSearch = !s || (o.id && o.id.toLowerCase().includes(s)) || (o.customer_name && o.customer_name.toLowerCase().includes(s)) || (o.title && o.title.toLowerCase().includes(s));
      return matchStatus && matchSearch;
    });
  }

  async trackOrder(orderId) {
    try {
      const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(orderId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API lookup failed, checking local orders:', e);
    }

    const clean = orderId.trim().toLowerCase();
    const found = this.orders.find(o => 
      (o.id && o.id.toLowerCase() === clean) ||
      (o.id && o.id.toLowerCase() === `#${clean}`) ||
      (o.customer_email && o.customer_email.toLowerCase() === clean) ||
      (o.customer_phone && o.customer_phone === orderId.trim())
    );

    if (found) {
      return {
        id: found.id,
        customerName: found.customer_name || found.customerName,
        customerEmail: found.customer_email || found.customerEmail,
        customerPhone: found.customer_phone || found.customerPhone,
        shippingAddress: found.shipping_address || found.shippingAddress,
        title: found.title,
        category: found.category,
        occasion: found.occasion,
        sentiment: found.sentiment,
        description: found.description,
        yarnType: found.yarn_type || found.yarnType,
        yarnLabel: found.yarn_label || found.yarnLabel,
        palette: found.palette || [],
        colorNotes: found.color_notes || found.colorNotes,
        size: found.size,
        sizeLabel: found.size_label || found.sizeLabel,
        addons: found.addons || [],
        quotedPrice: found.quoted_price || found.quotedPrice,
        quoteNotes: found.quote_notes || found.quoteNotes,
        upiId: found.upi_id || found.upiId,
        status: found.status,
        targetDeadline: found.target_deadline || found.targetDeadline,
        giftMessage: found.gift_message || found.giftMessage,
        referenceImages: found.referenceImages || found.reference_images_json || [],
        wipPhotos: found.wipPhotos || found.wip_photos_json || [],
        createdAt: found.created_at || found.createdAt || new Date().toISOString()
      };
    }

    throw new Error(`No order found for "${orderId}". Please check your Order ID.`);
  }

  async createOrder(orderPayload) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const localOrder = {
      id: `#OON-2026-${randomDigits}`,
      customer_name: orderPayload.customerName,
      customer_email: orderPayload.customerEmail,
      customer_phone: orderPayload.customerPhone,
      shipping_address: orderPayload.shippingAddress,
      customer_instagram: orderPayload.customerInstagram || '',
      title: orderPayload.title,
      category: orderPayload.category,
      occasion: orderPayload.occasion || 'all',
      description: orderPayload.description,
      yarn_type: orderPayload.yarnType,
      yarn_label: orderPayload.yarnLabel,
      palette: orderPayload.palette || [],
      color_notes: orderPayload.colorNotes || '',
      size: orderPayload.size,
      size_label: orderPayload.sizeLabel,
      addons: orderPayload.addons || [],
      status: 'received',
      target_deadline: orderPayload.targetDeadline || '',
      gift_message: orderPayload.giftMessage || '',
      referenceImages: orderPayload.referenceImages || [],
      wipPhotos: [],
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const data = await res.json();
        this.orders.unshift(data.order);
        localStorage.setItem('ooniverse_cached_orders', JSON.stringify(this.orders));
        this.notifyChange('orders');
        return data.order;
      }
    } catch (err) {
      console.warn('Saved order locally:', err);
    }

    this.orders.unshift(localOrder);
    localStorage.setItem('ooniverse_cached_orders', JSON.stringify(this.orders));
    this.notifyChange('orders');
    return localOrder;
  }

  async submitQuote(orderId, quoteData) {
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/quote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(quoteData)
      });

      if (res.ok) {
        const data = await res.json();
        this.notifyChange('orders');
        return data.order;
      }
    } catch (err) {
      console.warn('Quote updated locally:', err);
    }

    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.quoted_price = quoteData.totalQuote;
      order.quote_notes = quoteData.quoteNotes;
      order.upi_id = quoteData.upiId;
      order.status = 'pattern_prepared';
      localStorage.setItem('ooniverse_cached_orders', JSON.stringify(this.orders));
    }

    this.notifyChange('orders');
    return order;
  }

  async updateOrderStatus(orderId, status, adminNotes = null, wipPhoto = null) {
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status, adminNotes, wipPhoto })
      });

      if (res.ok) {
        const data = await res.json();
        this.notifyChange('orders');
        return data.order;
      }
    } catch (err) {
      console.warn('Status updated locally:', err);
    }

    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (adminNotes) order.admin_notes = adminNotes;
      if (wipPhoto) {
        if (!order.wipPhotos) order.wipPhotos = [];
        order.wipPhotos.push({
          url: wipPhoto.url,
          stage: wipPhoto.stage,
          note: wipPhoto.note,
          timestamp: new Date().toLocaleString()
        });
      }
      localStorage.setItem('ooniverse_cached_orders', JSON.stringify(this.orders));
    }

    this.notifyChange('orders');
    return order;
  }

  async fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // calculate from local orders
    }

    return {
      totalOrders: this.orders.length,
      inProgress: this.orders.filter(o => ['received', 'pattern_prepared', 'in_progress', 'quality_check'].includes(o.status)).length,
      shipped: this.orders.filter(o => ['shipped', 'completed'].includes(o.status)).length,
      revenue: this.orders.reduce((acc, o) => acc + (parseFloat(o.quoted_price || 0)), 0)
    };
  }

  notifyChange(type) {
    window.dispatchEvent(new CustomEvent(`ooniverse_store_${type}`));
  }
}

export const store = new Store();
window.store = store;
