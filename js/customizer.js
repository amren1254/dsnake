/**
 * OONIVERSE 1-CLICK BESPOKE CROCHET ORDER FORM
 * Single unified page where customers customize their piece and click "Get Quote" in 1 step
 */
import { store } from './store.js';

// Curated artisan yarn color swatches (Hunar Crochet aesthetic)
const COLOR_SWATCHES = [
  { name: 'Rose Wine Burgundy', hex: '#7D2E3A', category: 'red' },
  { name: 'Blush Silk', hex: '#E8A598', category: 'pink' },
  { name: 'Sakura Petal', hex: '#F7D6D0', category: 'pink' },
  { name: 'Amber Honey', hex: '#C58940', category: 'yellow' },
  { name: 'Warm Terracotta', hex: '#B8533E', category: 'red' },
  { name: 'Cappuccino Beige', hex: '#D4C4B5', category: 'neutral' },
  { name: 'Vanilla Silk', hex: '#FDFBF7', category: 'neutral' },
  { name: 'Matcha Sage', hex: '#5B7065', category: 'green' },
  { name: 'Forest Olive', hex: '#3E5C43', category: 'green' },
  { name: 'Eucalyptus Mist', hex: '#A8BBA2', category: 'green' },
  { name: 'Dusty Lilac', hex: '#8B729E', category: 'purple' },
  { name: 'Lavender Mist', hex: '#C4B5D4', category: 'purple' },
  { name: 'Sky Breeze', hex: '#90C2E7', category: 'blue' },
  { name: 'Royal Indigo', hex: '#2B4162', category: 'blue' },
  { name: 'Cocoa Velvet', hex: '#5A4334', category: 'neutral' },
  { name: 'Midnight Espresso', hex: '#241A14', category: 'neutral' }
];

const CATEGORY_NAMES = {
  bouquets: 'Floral Bouquet',
  amigurumi: 'Amigurumi Plushie',
  wearables: 'Wearable & Hair Clips',
  bags: 'Bag or Potli',
  keychains: 'Keychain & Charm',
  custom: 'Custom Creation'
};

const YARN_LABELS = {
  cotton: '100% Milk / Organic Cotton',
  velvet: 'Chunky Chenille / Velvet',
  wool: 'Soft Wool Blend',
  acrylic: 'Premium Soft Acrylic'
};

const SIZE_LABELS = {
  mini: 'Mini / Pocket (5-10cm)',
  standard: 'Regular / Medium (15-22cm)',
  large: 'Large / Deluxe (25-35cm)',
  wearable: 'Custom Apparel Fit'
};

class Customizer {
  constructor() {
    this.uploadedImages = [];
    this.selectedColors = [COLOR_SWATCHES[0], COLOR_SWATCHES[3]];
    this.submittedOrder = null;

    this.init();
  }

  init() {
    this.renderSwatches();
    this.updateSelectedPaletteDisplay();
    this.bindEvents();
    this.updateRequestSummary();
  }

  renderSwatches() {
    const grid = document.getElementById('swatchesGrid');
    if (!grid) return;

    grid.innerHTML = COLOR_SWATCHES.map(swatch => {
      const isSelected = this.selectedColors.some(c => c.name === swatch.name);
      return `
        <button type="button" 
          class="color-swatch-btn ${isSelected ? 'selected' : ''}" 
          style="background-color: ${swatch.hex};" 
          title="${swatch.name}"
          data-color="${swatch.name}"
          onclick="customizer.toggleColor('${swatch.name}')">
        </button>
      `;
    }).join('');
  }

  toggleColor(colorName) {
    const swatch = COLOR_SWATCHES.find(c => c.name === colorName);
    if (!swatch) return;

    const existingIdx = this.selectedColors.findIndex(c => c.name === colorName);
    if (existingIdx > -1) {
      if (this.selectedColors.length > 1) {
        this.selectedColors.splice(existingIdx, 1);
      } else {
        if (window.app) window.app.showToast('Please keep at least 1 color selected', 'info');
      }
    } else {
      if (this.selectedColors.length >= 4) {
        if (window.app) window.app.showToast('You can select up to 4 palette colors', 'info');
        return;
      }
      this.selectedColors.push(swatch);
    }

    this.renderSwatches();
    this.updateSelectedPaletteDisplay();
    this.updateRequestSummary();
  }

  updateSelectedPaletteDisplay() {
    const container = document.getElementById('selectedPaletteChips');
    if (!container) return;

    if (this.selectedColors.length === 0) {
      container.innerHTML = `<span class="placeholder-chip">Click colors above to select</span>`;
      return;
    }

    container.innerHTML = this.selectedColors.map(color => `
      <span class="palette-chip">
        <span class="chip-dot" style="background-color: ${color.hex}"></span>
        ${color.name}
      </span>
    `).join('');
  }

  bindEvents() {
    document.querySelectorAll('input[name="orderCategory"]').forEach(input => {
      input.addEventListener('change', () => this.updateRequestSummary());
    });

    document.querySelectorAll('input[name="yarnType"]').forEach(input => {
      input.addEventListener('change', () => this.updateRequestSummary());
    });

    const titleInput = document.getElementById('customItemTitle');
    if (titleInput) {
      titleInput.addEventListener('input', () => this.updateRequestSummary());
    }

    // Drag and drop setup
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('referenceImageInput');

    if (dropZone && fileInput) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        this.handleImageFiles(files);
      });

      fileInput.addEventListener('change', (e) => {
        this.handleImageFiles(e.target.files);
      });
    }
  }

  handleImageFiles(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        if (window.app) window.app.showToast('Please upload image files only', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target.result;
        this.uploadedImages.push(base64Url);
        this.renderImagePreviews();
        this.updateSummaryThumb(base64Url);
      };
      reader.readAsDataURL(file);
    });

    if (window.app) window.app.showToast('Reference photo(s) attached!', 'success');
  }

  renderImagePreviews() {
    const grid = document.getElementById('imagePreviewGrid');
    if (!grid) return;

    grid.innerHTML = this.uploadedImages.map((imgUrl, index) => `
      <div class="img-preview-card">
        <img src="${imgUrl}" alt="Inspo Ref ${index + 1}">
        <button type="button" class="btn-remove-img" onclick="customizer.removeImage(${index})" title="Remove image">
          &times;
        </button>
      </div>
    `).join('');
  }

  removeImage(index) {
    this.uploadedImages.splice(index, 1);
    this.renderImagePreviews();
    if (this.uploadedImages.length > 0) {
      this.updateSummaryThumb(this.uploadedImages[this.uploadedImages.length - 1]);
    } else {
      this.updateSummaryThumb(null);
    }
  }

  updateSummaryThumb(imgUrl) {
    const thumb = document.getElementById('summaryThumb');
    if (!thumb) return;

    if (imgUrl) {
      thumb.innerHTML = `<img src="${imgUrl}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    } else {
      thumb.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>`;
    }
  }

  updateRequestSummary() {
    const titleVal = document.getElementById('customItemTitle')?.value.trim();
    let category = document.querySelector('input[name="orderCategory"]:checked')?.value;
    
    if (!category) {
      const tLower = (titleVal || '').toLowerCase();
      if (tLower.includes('bouquet') || tLower.includes('tulip') || tLower.includes('sunflower') || tLower.includes('flower')) category = 'bouquets';
      else if (tLower.includes('plush') || tLower.includes('amigurumi') || tLower.includes('buddy') || tLower.includes('doll')) category = 'amigurumi';
      else if (tLower.includes('bag') || tLower.includes('potli') || tLower.includes('tote')) category = 'bags';
      else if (tLower.includes('hair') || tLower.includes('wearable') || tLower.includes('clip') || tLower.includes('cardigan')) category = 'wearables';
      else if (tLower.includes('keychain') || tLower.includes('charm')) category = 'keychains';
      else category = 'custom';
    }

    const yarn = document.querySelector('input[name="yarnType"]:checked')?.value || 'cotton';

    const sumTitle = document.getElementById('sumTitle');
    const sumCategory = document.getElementById('sumCategory');
    const sumYarnLabel = document.getElementById('sumYarnLabel');
    const sumPaletteChips = document.getElementById('sumPaletteChips');

    if (sumTitle) sumTitle.textContent = titleVal || 'Custom Handcrafted Piece';
    if (sumCategory) sumCategory.textContent = CATEGORY_NAMES[category] || 'Custom Piece';
    if (sumYarnLabel) sumYarnLabel.textContent = YARN_LABELS[yarn] || yarn;

    if (sumPaletteChips) {
      sumPaletteChips.innerHTML = this.selectedColors.map(c => `
        <span class="palette-dot-preview" style="background:${c.hex};" title="${c.name}"></span>
      `).join('');
    }

    return {
      category,
      catLabel: CATEGORY_NAMES[category] || 'Custom Piece',
      yarn,
      yarnLabel: YARN_LABELS[yarn] || yarn,
      size: 'standard',
      sizeLabel: 'Handcrafted Custom Size',
      addons: []
    };
  }

  prefillWith(title, categoryName, imagePath, yarnType = 'cotton') {
    if (window.app) window.app.navigateTo('customizer');

    const titleInput = document.getElementById('customItemTitle');
    if (titleInput) {
      titleInput.value = `${title}`;
    }

    const descInput = document.getElementById('customItemDescription');
    if (descInput) {
      descInput.value = `Inspired by "${title}". I would like this piece custom made in my selected color palette.`;
    }

    if (imagePath && !imagePath.startsWith('blob:')) {
      const fullPath = imagePath.startsWith('/') ? imagePath : `/instagram/${imagePath}`;
      this.uploadedImages = [fullPath];
      this.renderImagePreviews();
      this.updateSummaryThumb(fullPath);
    }

    const yarnRadio = document.querySelector(`input[name="yarnType"][value="${yarnType}"]`);
    if (yarnRadio) yarnRadio.checked = true;

    this.updateRequestSummary();

    setTimeout(() => {
      const el = document.getElementById('customItemTitle');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    if (window.app) window.app.showToast(`✨ Form filled for "${title}"! Just enter your contact and click Get Quote.`, 'success');
  }

  async submitOrder() {
    const title = document.getElementById('customItemTitle')?.value.trim();
    const desc = document.getElementById('customItemDescription')?.value.trim();
    const name = document.getElementById('custName')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const address = document.getElementById('custAddress')?.value.trim();
    const igHandle = document.getElementById('custInstagram')?.value.trim() || '';
    const colorNotes = document.getElementById('colorNotes')?.value.trim() || '';

    // Validation
    if (!title) {
      if (window.app) window.app.showToast('Please provide a project name or title', 'error');
      document.getElementById('customItemTitle')?.focus();
      return;
    }

    if (!desc) {
      if (window.app) window.app.showToast('Please describe what you want made', 'error');
      document.getElementById('customItemDescription')?.focus();
      return;
    }

    if (!name || name.length < 2) {
      if (window.app) window.app.showToast('Please enter your full name', 'error');
      document.getElementById('custName')?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      if (window.app) window.app.showToast('Please enter a valid email address', 'error');
      document.getElementById('custEmail')?.focus();
      return;
    }

    if (!phone || phone.length < 7) {
      if (window.app) window.app.showToast('Please provide your WhatsApp / Mobile number', 'error');
      document.getElementById('custPhone')?.focus();
      return;
    }

    if (!address || address.length < 5) {
      if (window.app) window.app.showToast('Please provide your delivery address (City, State, Pincode)', 'error');
      document.getElementById('custAddress')?.focus();
      return;
    }

    const summary = this.updateRequestSummary();

    const payload = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address,
      customerInstagram: igHandle,
      title: title,
      category: summary.category,
      description: desc,
      yarnType: summary.yarn,
      yarnLabel: summary.yarnLabel,
      palette: this.selectedColors,
      colorNotes: colorNotes,
      size: 'standard',
      sizeLabel: 'Handcrafted Custom Size',
      addons: [],
      targetDeadline: '',
      giftMessage: '',
      referenceImages: this.uploadedImages.length > 0 ? this.uploadedImages : ['/instagram/DcWMRVLJcI1.jpg']
    };

    const btnSticky = document.getElementById('btnSubmitSticky');
    const btnBottom = document.getElementById('btnSubmitBottom');

    try {
      if (btnSticky) {
        btnSticky.disabled = true;
        btnSticky.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }
      if (btnBottom) {
        btnBottom.disabled = true;
        btnBottom.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

      const createdOrder = await store.createOrder(payload);
      this.submittedOrder = createdOrder;

      this.showReceiptModal(createdOrder);

      if (window.app) window.app.showToast(`✨ Custom quote request ${createdOrder.id} submitted!`, 'success');
    } catch (err) {
      if (window.app) window.app.showToast(err.message || 'Error submitting quote request.', 'error');
    } finally {
      if (btnSticky) {
        btnSticky.disabled = false;
        btnSticky.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Get Quote';
      }
      if (btnBottom) {
        btnBottom.disabled = false;
        btnBottom.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Get Quote';
      }
    }
  }

  showReceiptModal(order) {
    const modalBody = document.getElementById('receiptModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="receipt-code-highlight">
        <span>Your Custom Tracking ID</span>
        <h2>${order.id}</h2>
      </div>

      <div class="receipt-summary-grid">
        <div class="receipt-row">
          <span>Customer:</span>
          <strong>${order.customer_name || order.customerName}</strong>
        </div>
        <div class="receipt-row">
          <span>Contact:</span>
          <span>${order.customer_phone || order.customerPhone} &bull; ${order.customer_email || order.customerEmail}</span>
        </div>
        <div class="receipt-row">
          <span>Delivery Location:</span>
          <span>${order.shipping_address || order.shippingAddress}</span>
        </div>
        <div class="receipt-row">
          <span>Requested Piece:</span>
          <strong>${order.title}</strong>
        </div>
        <div class="receipt-row">
          <span>Material:</span>
          <span>${order.yarn_label || order.yarnLabel || '100% Milk Cotton'}</span>
        </div>
        <div class="receipt-row total-row">
          <span>Quotation Status:</span>
          <strong style="color:var(--primary-rose); font-size:1.1rem;"><i class="fa-solid fa-comments"></i> In Review by Creator</strong>
        </div>
      </div>

      <div class="receipt-note-box">
        <p>📸 <strong>Next Step:</strong> Creator @ooniverse_2404 will review your reference photos and confirm your bespoke quotation directly on WhatsApp. You can track progress anytime with Tracking ID <strong>${order.id}</strong>.</p>
      </div>
    `;

    if (window.app) window.app.openModal('orderSuccessModal');
  }

  dispatchWhatsApp() {
    if (!this.submittedOrder) return;
    const o = this.submittedOrder;
    const name = o.customer_name || o.customerName;
    const phone = o.customer_phone || o.customerPhone;
    const title = o.title;

    const msg = `🧶 *New Custom Crochet Request* [${o.id}]
*Item:* ${title}
*Customer:* ${name} (${phone})
*Delivery City:* ${o.shipping_address || o.shippingAddress}
*Description:* ${o.description}

Hi @ooniverse_2404! I just submitted this custom crochet request on your website and would love to confirm the quotation! 🪄✨`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
  }

  dispatchInstagram() {
    if (!this.submittedOrder) return;
    const o = this.submittedOrder;
    const msg = `Hi @ooniverse_2404! I submitted custom order request ${o.id} for "${o.title}". Delivery to ${o.shipping_address || o.shippingAddress}. Looking forward to your quote! 🧶`;
    navigator.clipboard.writeText(msg);
    if (window.app) window.app.showToast('Order summary copied to clipboard! Opening Instagram...', 'info');
    setTimeout(() => {
      window.open('https://www.instagram.com/ooniverse_2404/', '_blank');
    }, 500);
  }

  openDirectInstagramDM() {
    window.open('https://www.instagram.com/ooniverse_2404/', '_blank');
  }
}

export const customizer = new Customizer();
window.customizer = customizer;
