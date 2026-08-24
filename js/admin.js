/**
 * OONIVERSE CREATOR STUDIO & ADMIN DASHBOARD
 * Protected creator login screen, SQLite database synchronization, quotation generator, and creation publishing
 */
import { store } from './store.js';

class Admin {
  constructor() {
    this.currentFilter = 'all';
    this.newPostImageBase64 = null;
    this.wipImageBase64 = null;
    this.editingOrderId = null;
    this.quotingOrderId = null;

    this.init();
  }

  init() {
    this.render();

    window.addEventListener('ooniverse_store_auth', () => {
      this.render();
    });
    window.addEventListener('ooniverse_store_orders', () => {
      if (store.isAuthenticated()) this.render();
    });
  }

  render() {
    const adminContainer = document.querySelector('.admin-container');
    if (!adminContainer) return;

    if (!store.isAuthenticated()) {
      this.renderLoginScreen(adminContainer);
    } else {
      this.renderDashboard(adminContainer);
    }
  }

  // --- 1. CREATOR LOGIN SCREEN ---
  renderLoginScreen(container) {
    container.innerHTML = `
      <div class="creator-login-wrapper">
        <div class="creator-login-card">
          <div class="login-badge-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          
          <div class="login-header-text">
            <h2>Creator Studio Access</h2>
            <p>Authorized access only for Ooniverse owner & artisan.</p>
          </div>

          <form id="creatorLoginForm" onsubmit="admin.handleLogin(event)">
            <div class="form-group">
              <label class="form-label" for="loginIdentifier">
                <i class="fa-solid fa-user"></i> Username, Email or Mobile
              </label>
              <input type="text" id="loginIdentifier" class="form-input" placeholder="Enter username, email or mobile number" required autocomplete="username">
            </div>

            <div class="form-group">
              <label class="form-label" for="loginPassword">
                <i class="fa-solid fa-key"></i> Creator Password
              </label>
              <input type="password" id="loginPassword" class="form-input" placeholder="••••••••••••" required autocomplete="current-password">
            </div>

            <div class="login-security-notice">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Secured with Bcrypt encryption, SQLite DB & Rate Limit protection.</span>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="btnLoginSubmit">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In to Studio
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const btn = document.getElementById('btnLoginSubmit');

    if (!identifier || !password) return;

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
      }

      await store.login(identifier, password);
      if (window.app) window.app.showToast('✨ Welcome back to Ooniverse Studio!', 'success');
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Invalid credentials. Please check and try again.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Studio';
      }
    }
  }

  handleLogout() {
    store.logout();
    if (window.app) window.app.showToast('Logged out of Creator Studio.', 'info');
  }

  // --- 2. CREATOR DASHBOARD ---
  async renderDashboard(container) {
    const creator = store.getCreator() || { username: 'Creator', email: '', mobile: '' };

    container.innerHTML = `
      <!-- Creator Top Header Banner -->
      <div class="admin-header">
        <div class="admin-header-title-block">
          <div class="section-badge"><i class="fa-solid fa-crown"></i> Creator Studio &bull; SQLite Live DB</div>
          <h2 class="section-title">Ooniverse Orders & Quotations Pipeline</h2>
        </div>
        <div class="admin-top-actions">
          <button class="btn btn-action-icon btn-admin-header-icon" onclick="admin.openProfileModal()" title="Account Settings" aria-label="Account Settings">
            <i class="fa-solid fa-user-gear"></i>
          </button>
          <button class="btn btn-primary btn-action-icon btn-admin-header-icon" onclick="admin.openNewPostModal()" title="New Creation Post" aria-label="New Creation Post">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button class="btn btn-action-icon btn-admin-header-icon" onclick="admin.handleLogout()" title="Logout" aria-label="Logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="admin-metrics-grid" id="adminMetricsGrid">
        <div class="metric-card">
          <div class="metric-icon icon-purple"><i class="fa-solid fa-inbox"></i></div>
          <div class="metric-data">
            <span class="metric-val" id="metricTotalOrders">...</span>
            <span class="metric-lbl">Total Requests</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon icon-yellow"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <div class="metric-data">
            <span class="metric-val" id="metricInProgress">...</span>
            <span class="metric-lbl">On The Hook (WIP)</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon icon-blue"><i class="fa-solid fa-truck-fast"></i></div>
          <div class="metric-data">
            <span class="metric-val" id="metricShipped">...</span>
            <span class="metric-lbl">Dispatched / Delivered</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon icon-green"><i class="fa-solid fa-indian-rupee-sign"></i></div>
          <div class="metric-data">
            <span class="metric-val" id="metricTotalRevenue">...</span>
            <span class="metric-lbl">Quoted Pipeline (₹)</span>
          </div>
        </div>
      </div>

      <!-- Orders Management Table Card -->
      <div class="admin-table-card">
        <div class="table-card-header">
          <div class="table-filters">
            <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" onclick="admin.filterStatus('all')">All</button>
            <button class="filter-tab ${this.currentFilter === 'received' ? 'active' : ''}" onclick="admin.filterStatus('received')">New Requests</button>
            <button class="filter-tab ${this.currentFilter === 'pattern_prepared' ? 'active' : ''}" onclick="admin.filterStatus('pattern_prepared')">Quoted / Sourcing</button>
            <button class="filter-tab ${this.currentFilter === 'in_progress' ? 'active' : ''}" onclick="admin.filterStatus('in_progress')">Crocheting</button>
            <button class="filter-tab ${this.currentFilter === 'quality_check' ? 'active' : ''}" onclick="admin.filterStatus('quality_check')">Finishing</button>
            <button class="filter-tab ${this.currentFilter === 'shipped' ? 'active' : ''}" onclick="admin.filterStatus('shipped')">Shipped</button>
            <button class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" onclick="admin.filterStatus('completed')">Delivered</button>
          </div>
          <div class="table-search">
            <input type="text" id="adminSearchInput" placeholder="Search by customer, city, ID..." class="form-input-sm" oninput="admin.renderOrdersTable()">
          </div>
        </div>

        <div class="table-responsive">
          <table class="admin-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer & Address</th>
                <th>Requested Item</th>
                <th>Yarn & Palette</th>
                <th>Inspo Ref</th>
                <th>Quotation Status</th>
                <th>Crafting Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="adminOrdersTableBody">
              <tr>
                <td colspan="8" style="text-align:center; padding: 24px;">Loading orders from SQLite DB...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadStats();
    this.renderOrdersTable();
  }

  async loadStats() {
    const stats = await store.fetchStats();
    if (!stats) return;

    const elTotal = document.getElementById('metricTotalOrders');
    const elProg = document.getElementById('metricInProgress');
    const elShip = document.getElementById('metricShipped');
    const elRev = document.getElementById('metricTotalRevenue');

    if (elTotal) elTotal.textContent = stats.totalOrders;
    if (elProg) elProg.textContent = stats.inProgress;
    if (elShip) elShip.textContent = stats.shipped;
    if (elRev) elRev.textContent = `₹${stats.revenue ? stats.revenue.toLocaleString('en-IN') : 0}`;
  }

  filterStatus(status) {
    this.currentFilter = status;
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.textContent.toLowerCase() === status.replace('_', ' ') || (status === 'all' && tab.textContent === 'All'));
    });
    this.renderOrdersTable();
  }

  async renderOrdersTable() {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;

    const searchVal = document.getElementById('adminSearchInput')?.value.trim() || '';
    const orders = await store.fetchOrders(this.currentFilter, searchVal);

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 36px; color:var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size:1.8rem; margin-bottom:8px; display:block;"></i>
            No orders found in this view.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const firstInspo = order.referenceImages && order.referenceImages.length > 0 ? order.referenceImages[0] : null;
      const paletteNames = order.palette && order.palette.length > 0 ? order.palette.map(c => c.name).join(', ') : 'Default';
      const quoted = order.quoted_price || order.quotedPrice;

      return `
        <tr>
          <td class="cell-order-id">
            <strong>${order.id}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">
              ${new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </div>
          </td>

          <td>
            <span class="cell-cust-name">${order.customer_name || order.customerName}</span>
            <span class="cell-cust-contact">${order.customer_phone || order.customerPhone} &bull; ${order.customer_email || order.customerEmail}</span>
            <div style="font-size:0.75rem; color:var(--text-body); margin-top:3px; max-width:230px; line-height:1.3;">
              <i class="fa-solid fa-location-dot" style="color:var(--primary-rose);"></i> ${order.shipping_address || order.shippingAddress || 'No address'}
            </div>
          </td>

          <td>
            <div class="cell-item-title">${order.title}</div>
            <span class="cell-item-cat">${order.category}</span>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
              ${order.size_label || order.sizeLabel || order.size}
            </div>
          </td>

          <td>
            <div style="font-size:0.8rem; font-weight:600; color:var(--text-dark);">${order.yarn_label || order.yarnLabel || order.yarn_type}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${paletteNames}</div>
          </td>

          <td>
            ${firstInspo ? `
              <img src="${firstInspo}" alt="Inspo Ref" class="cell-inspo-thumb" onclick="admin.viewImageFull('${firstInspo}')" title="Click to view">
            ` : `
              <div class="no-ref-icon"><i class="fa-solid fa-image"></i></div>
            `}
          </td>

          <td>
            ${quoted ? `
              <strong style="color:var(--primary-rose); font-size:1.05rem;">₹${quoted}</strong>
              <div style="font-size:0.7rem; color:#166534; font-weight:600;">Official Quote Sent</div>
            ` : `
              <span class="status-pill received" style="font-size:0.75rem;">Pending Quote</span>
            `}
          </td>

          <td>
            <span class="status-pill ${order.status}">${order.status.replace('_', ' ')}</span>
          </td>

          <td>
            <div class="table-actions">
              <!-- Creator Quote Builder Button -->
              <button class="btn-icon-action quote-btn" onclick="admin.openQuoteModal('${order.id}')" title="Generate & Send Official Quote">
                <i class="fa-solid fa-file-invoice-dollar"></i>
              </button>

              <!-- Order Stage & WIP Uploader -->
              <button class="btn-icon-action" onclick="admin.openOrderManager('${order.id}')" title="Update Crafting Stage & WIP Photo">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>

              <!-- WhatsApp Chat -->
              <a href="https://wa.me/${(order.customer_phone || order.customerPhone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn-icon-action wa" title="Chat on WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </a>

              <!-- Customer Tracker View -->
              <button class="btn-icon-action" onclick="tracker.lookupSample('${order.id}'); app.navigateTo('tracker');" title="View Customer Tracker">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- 3. CREATOR BESPOKE QUOTATION GENERATOR ---
  openQuoteModal(orderId) {
    const orders = store.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    this.quotingOrderId = orderId;

    const subtitle = document.getElementById('quoteModalSubtitle');
    const body = document.getElementById('quoteModalBody');
    if (!body) return;

    if (subtitle) {
      subtitle.textContent = `Order ${order.id} for ${order.customer_name || order.customerName} (${order.title})`;
    }

    const defaultCraft = 500;
    const defaultMaterial = 150;
    const defaultCourier = 80;
    const initialTotal = defaultCraft + defaultMaterial + defaultCourier;

    body.innerHTML = `
      <div class="quote-modal-layout">
        <!-- Left: Quotation Input Form -->
        <div class="quote-form-column">
          <div class="quote-customer-summary">
            <h4><i class="fa-solid fa-clipboard-user"></i> Customer Request Summary</h4>
            <p><strong>Item:</strong> ${order.title} (${order.category})</p>
            <p><strong>Notes:</strong> ${order.description}</p>
            <p><strong>Yarn / Size:</strong> ${order.yarn_label || order.yarnLabel} &bull; ${order.size_label || order.sizeLabel}</p>
            <p><strong>Delivery Location:</strong> ${order.shipping_address || order.shippingAddress || 'India'}</p>
          </div>

          <form onsubmit="admin.handleSaveAndDispatchQuote(event)">
            <div class="form-row">
              <div class="form-col">
                <label class="form-label" for="quoteCraftFee">Base Crafting & Pattern Fee (₹) <span class="req">*</span></label>
                <input type="number" id="quoteCraftFee" class="form-input" value="${defaultCraft}" min="0" oninput="admin.updateQuoteCalculation()" required>
              </div>
              <div class="form-col">
                <label class="form-label" for="quoteMaterialFee">Material / Yarn Sourcing Cost (₹)</label>
                <input type="number" id="quoteMaterialFee" class="form-input" value="${defaultMaterial}" min="0" oninput="admin.updateQuoteCalculation()">
              </div>
            </div>

            <div class="form-row">
              <div class="form-col">
                <label class="form-label" for="quoteCourierFee">Courier / Shipping Charges (₹)</label>
                <input type="number" id="quoteCourierFee" class="form-input" value="${defaultCourier}" min="0" oninput="admin.updateQuoteCalculation()">
              </div>
              <div class="form-col">
                <label class="form-label" for="quoteTurnaround">Estimated Crafting Days</label>
                <input type="text" id="quoteTurnaround" class="form-input" value="4 - 6 business days" oninput="admin.updateQuotePreview()">
              </div>
            </div>

            <div class="form-row">
              <div class="form-col">
                <label class="form-label" for="quoteUpiId">Your UPI ID for Advance</label>
                <input type="text" id="quoteUpiId" class="form-input" value="${order.upi_id || 'ooniverse@upi'}" oninput="admin.updateQuotePreview()">
              </div>
              <div class="form-col">
                <label class="form-label">Total Quoted Amount (₹)</label>
                <div class="quote-total-highlight">
                  <span id="quoteTotalDisplay">₹${initialTotal}</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quoteArtisanNotes">Custom Artisan Advice / Note to Customer</label>
              <textarea id="quoteArtisanNotes" rows="2" class="form-input" placeholder="e.g. I will use soft milk cotton and include a complimentary sunflower bookmark!" oninput="admin.updateQuotePreview()">${order.quote_notes || 'Hand-stitched with care using premium milk cotton yarn.'}</textarea>
            </div>

            <div class="modal-footer" style="padding:0; margin-top:20px;">
              <button type="button" class="btn btn-secondary" onclick="app.closeModal('creatorQuoteModal')">Cancel</button>
              <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Official Quote (₹)</button>
            </div>
          </form>
        </div>

        <!-- Right: Live WhatsApp / Instagram Quotation Message Preview -->
        <div class="quote-preview-column">
          <div class="preview-header">
            <h4><i class="fa-brands fa-whatsapp" style="color:#25D366;"></i> WhatsApp / DM Message Template</h4>
            <span class="preview-badge">Auto-formatted</span>
          </div>

          <div class="whatsapp-message-bubble" id="whatsappMessageBubble">
            <!-- Populated via admin.updateQuotePreview() -->
          </div>

          <div class="quote-dispatch-buttons">
            <button type="button" class="btn btn-primary btn-block" onclick="admin.dispatchQuoteWhatsApp()">
              <i class="fa-brands fa-whatsapp"></i> Send Quote on WhatsApp
            </button>
            <button type="button" class="btn btn-instagram btn-block" onclick="admin.dispatchQuoteInstagram()">
              <i class="fa-brands fa-instagram"></i> Copy & Open Instagram DM
            </button>
          </div>
        </div>
      </div>
    `;

    this.updateQuoteCalculation();
    if (window.app) window.app.openModal('creatorQuoteModal');
  }

  updateQuoteCalculation() {
    const craft = parseFloat(document.getElementById('quoteCraftFee')?.value) || 0;
    const material = parseFloat(document.getElementById('quoteMaterialFee')?.value) || 0;
    const courier = parseFloat(document.getElementById('quoteCourierFee')?.value) || 0;
    const total = craft + material + courier;

    const disp = document.getElementById('quoteTotalDisplay');
    if (disp) disp.textContent = `₹${total}`;

    this.updateQuotePreview();
  }

  getQuoteMessageText() {
    const order = store.orders.find(o => o.id === this.quotingOrderId);
    if (!order) return '';

    const craft = parseFloat(document.getElementById('quoteCraftFee')?.value) || 0;
    const material = parseFloat(document.getElementById('quoteMaterialFee')?.value) || 0;
    const courier = parseFloat(document.getElementById('quoteCourierFee')?.value) || 0;
    const total = craft + material + courier;
    const days = document.getElementById('quoteTurnaround')?.value || '4-6 business days';
    const upi = document.getElementById('quoteUpiId')?.value || 'ooniverse@upi';
    const note = document.getElementById('quoteArtisanNotes')?.value || '';
    const custName = order.customer_name || order.customerName || 'Customer';

    return `🧶 *OONIVERSE CUSTOM CROCHET QUOTATION* [${order.id}]

Hello ${custName}! Thank you for your custom crochet request. Here is your official bespoke quotation:

✨ *Item:* ${order.title}
🧶 *Yarn Texture:* ${order.yarn_label || order.yarnLabel || order.yarn_type}
📏 *Dimensions:* ${order.size_label || order.sizeLabel || order.size}
🎨 *Palette:* ${order.palette && order.palette.length > 0 ? order.palette.map(c => c.name).join(', ') : 'Custom'}

💵 *PRICE BREAKDOWN:*
• Crafting & Pattern Creation: ₹${craft}
• Yarn & Embellishments: ₹${material}
• Courier / Delivery: ₹${courier}
━━━━━━━━━━━━━━━━━━
💰 *TOTAL AMOUNT: ₹${total}*

⏱️ *Estimated Turnaround:* ${days}
💳 *UPI for 50% Advance:* ${upi}

📝 *Artisan Note:* "${note}"

Please reply to confirm and we'll begin crafting your stitch magic! 🪄`;
  }

  updateQuotePreview() {
    const bubble = document.getElementById('whatsappMessageBubble');
    if (!bubble) return;

    const rawText = this.getQuoteMessageText();
    bubble.innerHTML = rawText.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  }

  async handleSaveAndDispatchQuote(e) {
    e.preventDefault();
    if (!this.quotingOrderId) return;

    const craft = parseFloat(document.getElementById('quoteCraftFee')?.value) || 0;
    const material = parseFloat(document.getElementById('quoteMaterialFee')?.value) || 0;
    const courier = parseFloat(document.getElementById('quoteCourierFee')?.value) || 0;
    const total = craft + material + courier;
    const upi = document.getElementById('quoteUpiId')?.value.trim();
    const note = document.getElementById('quoteArtisanNotes')?.value.trim();

    try {
      await store.submitQuote(this.quotingOrderId, {
        craftFee: craft,
        materialFee: material,
        courierFee: courier,
        totalQuote: total,
        quoteNotes: note,
        upiId: upi,
        updateStatus: 'pattern_prepared'
      });

      if (window.app) {
        window.app.closeModal('creatorQuoteModal');
        window.app.showToast(`✨ Official quote of ₹${total} saved to SQLite database!`, 'success');
      }
      this.render();
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Error saving quote.', 'error');
    }
  }

  dispatchQuoteWhatsApp() {
    const order = store.orders.find(o => o.id === this.quotingOrderId);
    if (!order) return;

    const phone = (order.customer_phone || order.customerPhone || '').replace(/[^0-9]/g, '');
    const msg = this.getQuoteMessageText();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  dispatchQuoteInstagram() {
    const msg = this.getQuoteMessageText();
    navigator.clipboard.writeText(msg);
    if (window.app) window.app.showToast('Quotation text copied to clipboard! Opening Instagram...', 'info');
    setTimeout(() => {
      window.open('https://www.instagram.com/ooniverse_2404/', '_blank');
    }, 500);
  }

  // --- 4. ORDER STAGE & LIVE WIP PHOTO MANAGER ---
  async openOrderManager(orderId) {
    const orders = store.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    this.editingOrderId = orderId;
    this.wipImageBase64 = null;

    const subtitle = document.getElementById('adminModalOrderSubtitle');
    const content = document.getElementById('adminModalOrderContent');
    if (!content) return;

    if (subtitle) subtitle.textContent = `${order.id} - ${order.customer_name || order.customerName} (${order.title})`;

    content.innerHTML = `
      <form onsubmit="admin.handleSaveOrderUpdate(event)">
        <div class="form-group">
          <label class="form-label" for="orderStageSelect">Current Crafting Stage <span class="req">*</span></label>
          <select id="orderStageSelect" class="form-input">
            <option value="received" ${order.status === 'received' ? 'selected' : ''}>1. Order Received (Reviewing)</option>
            <option value="pattern_prepared" ${order.status === 'pattern_prepared' ? 'selected' : ''}>2. Pattern Sourced / Quoted</option>
            <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>3. Crocheting On The Hook (WIP)</option>
            <option value="quality_check" ${order.status === 'quality_check' ? 'selected' : ''}>4. Finishing & Quality Check</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>5. Gift Wrapped & Shipped</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>6. Delivered & Complete</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="adminOrderNotes">Artisan Internal / Courier Tracking Notes</label>
          <textarea id="adminOrderNotes" rows="2" class="form-input" placeholder="Tracking code (e.g. BlueDart / DTDC #123456), stitch details...">${order.admin_notes || ''}</textarea>
        </div>

        <div style="border-top:1px solid var(--border-subtle); padding-top:16px; margin-top:16px;">
          <h4 style="font-family:var(--font-serif); margin-bottom:10px; color:var(--text-dark);">
            <i class="fa-solid fa-camera"></i> Upload Live WIP Progress Photo (Visible to Customer Tracker)
          </h4>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label-sub" for="wipStageName">Progress Label</label>
              <input type="text" id="wipStageName" class="form-input-sm" placeholder="e.g. Base Stitches / Finishing Petals">
            </div>
            <div class="form-col">
              <label class="form-label-sub" for="wipNote">Artisan Caption</label>
              <input type="text" id="wipNote" class="form-input-sm" placeholder="e.g. Completed outer petals and added drawstring cord!">
            </div>
          </div>
          <div class="form-group">
            <input type="file" id="wipPhotoFile" accept="image/*" class="form-input" onchange="admin.handleWipImageSelect(event)">
            <div id="wipPhotoPreview" style="margin-top:10px;"></div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="app.closeModal('adminOrderModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Order Changes</button>
        </div>
      </form>
    `;

    if (window.app) window.app.openModal('adminOrderModal');
  }

  handleWipImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      this.wipImageBase64 = event.target.result;
      const prevDiv = document.getElementById('wipPhotoPreview');
      if (prevDiv) {
        prevDiv.innerHTML = `<img src="${this.wipImageBase64}" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:1px solid var(--border-subtle);">`;
      }
    };
    reader.readAsDataURL(file);
  }

  async handleSaveOrderUpdate(e) {
    e.preventDefault();
    if (!this.editingOrderId) return;

    const newStatus = document.getElementById('orderStageSelect')?.value;
    const adminNotes = document.getElementById('adminOrderNotes')?.value.trim();

    let wipPhoto = null;
    if (this.wipImageBase64) {
      wipPhoto = {
        url: this.wipImageBase64,
        stage: document.getElementById('wipStageName')?.value.trim() || 'WIP Milestone',
        note: document.getElementById('wipNote')?.value.trim() || 'Progress snapshot from the crochet hook'
      };
    }

    try {
      await store.updateOrderStatus(this.editingOrderId, newStatus, adminNotes, wipPhoto);
      if (window.app) {
        window.app.closeModal('adminOrderModal');
        window.app.showToast(`Order ${this.editingOrderId} updated in SQLite DB!`, 'success');
      }
      this.render();
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Error updating order.', 'error');
    }
  }

  // --- 5. CREATOR PROFILE / ACCOUNT SETTINGS MODAL ---
  openProfileModal() {
    const creator = store.getCreator() || {};

    const subtitle = document.getElementById('adminModalOrderSubtitle');
    const content = document.getElementById('adminModalOrderContent');
    if (!content) return;

    if (subtitle) subtitle.textContent = 'Edit Creator Mobile, Email, Username & Password';

    content.innerHTML = `
      <form onsubmit="admin.handleSaveProfile(event)">
        <div class="form-group">
          <label class="form-label" for="profUsername">Username <span class="req">*</span></label>
          <input type="text" id="profUsername" class="form-input" value="${creator.username || ''}" required>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label" for="profEmail">Email Address <span class="req">*</span></label>
            <input type="email" id="profEmail" class="form-input" value="${creator.email || ''}" required>
          </div>
          <div class="form-col">
            <label class="form-label" for="profMobile">Mobile / WhatsApp Number <span class="req">*</span></label>
            <input type="tel" id="profMobile" class="form-input" value="${creator.mobile || ''}" required>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-subtle); padding-top:16px; margin-top:16px;">
          <h4 style="font-family:var(--font-serif); margin-bottom:10px; color:var(--text-dark);">Change Password (Optional)</h4>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label-sub" for="profCurrentPass">Current Password</label>
              <input type="password" id="profCurrentPass" class="form-input-sm" placeholder="••••••••">
            </div>
            <div class="form-col">
              <label class="form-label-sub" for="profNewPass">New Password</label>
              <input type="password" id="profNewPass" class="form-input-sm" placeholder="Minimum 6 characters">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="app.closeModal('adminOrderModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Update SQLite Profile</button>
        </div>
      </form>
    `;

    if (window.app) window.app.openModal('adminOrderModal');
  }

  async handleSaveProfile(e) {
    e.preventDefault();
    const username = document.getElementById('profUsername')?.value.trim();
    const email = document.getElementById('profEmail')?.value.trim();
    const mobile = document.getElementById('profMobile')?.value.trim();
    const currentPassword = document.getElementById('profCurrentPass')?.value;
    const newPassword = document.getElementById('profNewPass')?.value;

    try {
      await store.updateCreatorProfile({
        username,
        email,
        mobile,
        currentPassword,
        newPassword
      });

      if (window.app) {
        window.app.closeModal('adminOrderModal');
        window.app.showToast('Creator profile updated in SQLite database!', 'success');
      }
      this.render();
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Error updating profile.', 'error');
    }
  }

  // --- 6. PUBLISH NEW CREATION POST ---
  openNewPostModal() {
    this.newPostImageBase64 = null;
    document.getElementById('newPostForm')?.reset();
    const prev = document.getElementById('newPostImagePreview');
    if (prev) prev.innerHTML = '';

    if (window.app) window.app.openModal('newPostModal');
  }

  handlePostImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      this.newPostImageBase64 = event.target.result;
      const prev = document.getElementById('newPostImagePreview');
      if (prev) {
        prev.innerHTML = `<img src="${this.newPostImageBase64}" style="width:120px; height:120px; object-fit:cover; border-radius:8px; border:1px solid var(--border-subtle); display:block; margin-top:8px;">`;
      }
    };
    reader.readAsDataURL(file);
  }

  async handleAddNewPost(e) {
    e.preventDefault();

    const title = document.getElementById('newPostTitle')?.value.trim();
    const category = document.getElementById('newPostCategory')?.value;
    const tag = document.getElementById('newPostTag')?.value.trim() || '✨ New Creation';
    const caption = document.getElementById('newPostDesc')?.value.trim();
    const yarnType = document.getElementById('newPostYarn')?.value.trim() || 'Handmade Milk Cotton Yarn';

    if (!title || !caption) {
      if (window.app) window.app.showToast('Please provide a creation title and caption', 'error');
      return;
    }

    if (!this.newPostImageBase64) {
      if (window.app) window.app.showToast('Please select a photo for the creation post', 'error');
      return;
    }

    try {
      await store.addCreation({
        title,
        category,
        image: this.newPostImageBase64,
        caption,
        yarnType,
        dimensions: 'Custom sizing',
        tag: tag
      });

      if (window.app) {
        window.app.closeModal('newPostModal');
        window.app.showToast(`✨ "${title}" published to your portfolio feed!`, 'success');
        window.app.navigateTo('home');
      }
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Error publishing post.', 'error');
    }
  }

  viewImageFull(imgUrl) {
    window.open(imgUrl, '_blank');
  }
}

export const admin = new Admin();
window.admin = admin;
