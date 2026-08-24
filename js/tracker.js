/**
 * OONIVERSE ORDER & QUOTE TRACKER (INR / ₹)
 * Looks up live orders & official creator quotations from backend SQLite database
 */
import { store } from './store.js';

const STAGES = [
  { id: 'received', label: 'Request Received', desc: 'Under creator review', icon: 'fa-receipt' },
  { id: 'pattern_prepared', label: 'Quoted & Sourced', desc: 'Bespoke quote & yarn prepared', icon: 'fa-yarn' },
  { id: 'in_progress', label: 'On The Hook', desc: 'Handcrafting stitch-by-stitch', icon: 'fa-wand-magic-sparkles' },
  { id: 'quality_check', label: 'Finishing & QC', desc: 'Blocking, details & tags', icon: 'fa-certificate' },
  { id: 'shipped', label: 'Gift Wrapped & Shipped', desc: 'Dispatched via courier', icon: 'fa-truck-fast' },
  { id: 'completed', label: 'Delivered', desc: 'Enjoy your custom piece!', icon: 'fa-heart-circle-check' }
];

class Tracker {
  constructor() {
    this.currentOrder = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const input = document.getElementById('trackerSearchQuery');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchOrder();
        }
      });
    }
  }

  lookupSample(orderId) {
    const input = document.getElementById('trackerSearchQuery');
    if (input) input.value = orderId;
    this.searchOrder();
  }

  async searchOrder() {
    const input = document.getElementById('trackerSearchQuery');
    const query = input ? input.value.trim() : '';

    if (!query) {
      if (window.app) window.app.showToast('Please enter an Order ID or email address', 'error');
      return;
    }

    try {
      const order = await store.trackOrder(query);
      this.currentOrder = order;
      this.renderOrder(order);
      if (window.app) window.app.showToast(`Found Order ${order.id}!`, 'success');
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Order not found.', 'error');
      document.getElementById('trackerResultCard').style.display = 'none';
      document.getElementById('trackerEmptyState').style.display = 'block';
    }
  }

  renderOrder(order) {
    const resultCard = document.getElementById('trackerResultCard');
    const emptyState = document.getElementById('trackerEmptyState');
    if (!resultCard) return;

    emptyState.style.display = 'none';
    resultCard.style.display = 'block';

    const currentStageIdx = STAGES.findIndex(s => s.id === order.status);
    const stageIndex = currentStageIdx >= 0 ? currentStageIdx : 0;
    const progressPercent = (stageIndex / (STAGES.length - 1)) * 100;

    const stageStatusLabels = {
      received: 'Request Received & Reviewing',
      pattern_prepared: 'Official Quote Sent / Sourcing Yarn',
      in_progress: 'Stitching On The Hook (WIP)',
      quality_check: 'Finishing & Quality Check',
      shipped: 'Shipped via Courier',
      completed: 'Successfully Delivered'
    };

    const isQuoted = !!order.quotedPrice;
    const quoteBreakdown = order.quoteBreakdown || {};

    resultCard.innerHTML = `
      <div class="result-top-bar">
        <div class="result-id-group">
          <span class="order-code-badge">${order.id}</span>
          <span class="order-stage-status status-${order.status}">
            <i class="fa-solid fa-circle-dot"></i> ${stageStatusLabels[order.status] || order.status}
          </span>
        </div>
        <div class="result-date">
          <span style="font-size:0.85rem; color:var(--text-muted);">
            Requested on <strong>${new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
          </span>
        </div>
      </div>

      <!-- 6-Stage Visual Stepper Timeline -->
      <div class="timeline-stepper">
        <div class="timeline-track-bg">
          <div class="timeline-track-fill" style="width: ${progressPercent}%;"></div>
        </div>

        ${STAGES.map((st, idx) => {
          let stateClass = '';
          if (idx < stageIndex) stateClass = 'completed';
          else if (idx === stageIndex) stateClass = 'current';

          return `
            <div class="timeline-step ${stateClass}">
              <div class="timeline-step-icon">
                <i class="fa-solid ${idx < stageIndex ? 'fa-check' : st.icon}"></i>
              </div>
              <span class="timeline-step-label">${st.label}</span>
              <span class="timeline-step-sub">${st.desc}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Official Creator Quote Banner (If Quoted) -->
      ${isQuoted ? `
        <div class="official-quote-banner" style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:18px 24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="font-size:0.8rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.04em;">
              <i class="fa-solid fa-file-invoice-dollar"></i> Official Creator Quotation Confirmed
            </div>
            <div style="font-family:var(--font-serif); font-size:1.6rem; color:#15803D; font-weight:700; margin:2px 0;">
              ₹${order.quotedPrice} <span style="font-size:0.9rem; font-weight:normal; color:#166534;">(All-inclusive)</span>
            </div>
            ${order.quoteNotes ? `
              <p style="font-size:0.85rem; color:#166534; margin:4px 0 0;">
                <i class="fa-solid fa-comment-dots"></i> <em>"${order.quoteNotes}"</em>
              </p>
            ` : ''}
          </div>
          ${order.upiId ? `
            <div style="background:#FFFFFF; padding:10px 16px; border-radius:8px; border:1px solid #BBF7D0; text-align:right;">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Pay Advance via UPI:</span>
              <strong style="color:var(--text-dark); font-family:monospace; font-size:0.95rem;">${order.upiId}</strong>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Item Details & Specifications -->
      <div class="tracker-item-details">
        <div class="item-specs-col">
          <h4>${order.title}</h4>
          <ul class="specs-list">
            <li>
              <span>Customer:</span>
              <strong>${order.customerName}</strong>
            </li>
            <li>
              <span>Delivery To:</span>
              <span>${order.shippingAddress || 'Address on file'}</span>
            </li>
            <li>
              <span>Category:</span>
              <span>${order.category.toUpperCase()}</span>
            </li>
            <li>
              <span>Yarn Texture:</span>
              <strong>${order.yarnLabel || order.yarnType}</strong>
            </li>
            <li>
              <span>Dimensions:</span>
              <span>${order.sizeLabel || order.size}</span>
            </li>
            <li>
              <span>Selected Palette:</span>
              <span>${order.palette ? order.palette.map(c => c.name).join(', ') : 'Custom'}</span>
            </li>
            ${order.colorNotes ? `
              <li>
                <span>Color Notes:</span>
                <span style="font-style:italic;">${order.colorNotes}</span>
              </li>
            ` : ''}
          </ul>
        </div>

        <div class="item-specs-col">
          <h4>Order & Delivery Summary</h4>
          <ul class="specs-list">
            <li>
              <span>Estimated / Quoted Price:</span>
              <strong style="color:var(--primary-rose); font-size:1.2rem;">₹${order.quotedPrice || order.totalPrice}</strong>
            </li>
            <li>
              <span>Crafting Status:</span>
              <strong>${stageStatusLabels[order.status]}</strong>
            </li>
            ${order.targetDeadline ? `
              <li>
                <span>Target Need-by Date:</span>
                <strong>${order.targetDeadline}</strong>
              </li>
            ` : ''}
            ${order.giftMessage ? `
              <li>
                <span>Gift Card Message:</span>
                <span style="font-style:italic;">"${order.giftMessage}"</span>
              </li>
            ` : ''}
          </ul>
        </div>
      </div>

      <!-- Reference Photos -->
      ${order.referenceImages && order.referenceImages.length > 0 ? `
        <div class="tracker-media-section">
          <h4><i class="fa-solid fa-camera-retro"></i> Your Reference Photos</h4>
          <div class="wip-gallery-grid">
            ${order.referenceImages.map((img, i) => `
              <div class="wip-photo-card">
                <img src="${img}" alt="Reference ${i + 1}">
                <span class="wip-photo-tag">Inspo Ref #${i + 1}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Creator WIP Snapshots -->
      <div class="tracker-media-section">
        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Artisan WIP (Work-In-Progress) Photos</h4>
        ${order.wipPhotos && order.wipPhotos.length > 0 ? `
          <div class="wip-gallery-grid">
            ${order.wipPhotos.map(w => `
              <div class="wip-photo-card">
                <img src="${w.url}" alt="WIP Progress">
                <span class="wip-photo-tag">${w.stage || 'Work in progress'}</span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);">
            ${order.wipPhotos.map(w => `
              <p>📸 <em>"${w.note}"</em> &bull; <small>${w.timestamp}</small></p>
            `).join('')}
          </div>
        ` : `
          <p class="no-wip-yet">
            🧵 The artisan is preparing your custom pattern. Progress photos will be posted here as stitches are completed!
          </p>
        `}
      </div>

      <div style="margin-top:32px; padding-top:24px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="font-size:0.875rem; color:var(--text-muted);">
          Need an update or change to this order? Chat with the artisan on WhatsApp.
        </div>
        <a href="https://wa.me/?text=Hi%20@ooniverse_2404!%20Checking%20in%20on%20my%20order%20${encodeURIComponent(order.id)}" target="_blank" class="btn btn-primary btn-sm">
          <i class="fa-brands fa-whatsapp"></i> Chat with Creator
        </a>
      </div>
    `;

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export const tracker = new Tracker();
window.tracker = tracker;
