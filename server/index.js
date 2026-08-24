import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ooniverse_secure_artisan_jwt_secret_2026_!#';

// Initialize Database
initDatabase();

// Security Middleware: Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/dist', express.static(path.join(__dirname, '../dist')));

// Rate Limiter for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiter for Order Creation
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { error: 'Order submission limit reached. Please contact @ooniverse_2404 on Instagram.' }
});

// Authentication Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Creator login required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = db.prepare('SELECT id, username, email, mobile, role FROM admins WHERE id = ?').get(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid session. Account not found.' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return validator.escape(str.trim());
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your username, email, or mobile, and password.' });
  }

  const cleanIdent = identifier.trim();

  const admin = db.prepare(`
    SELECT * FROM admins 
    WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) OR mobile = ?
  `).get(cleanIdent, cleanIdent, cleanIdent);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your login details.' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    message: 'Login successful',
    token,
    creator: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role
    }
  });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ creator: req.admin });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { username, email, mobile, currentPassword, newPassword } = req.body;

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });

  let newHash = admin.password_hash;
  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(400).json({ error: 'Current password incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    newHash = bcrypt.hashSync(newPassword, 12);
  }

  const updatedUsername = username ? username.trim() : admin.username;
  const updatedEmail = email ? email.trim() : admin.email;
  const updatedMobile = mobile ? mobile.trim() : admin.mobile;

  try {
    db.prepare(`
      UPDATE admins 
      SET username = ?, email = ?, mobile = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updatedUsername, updatedEmail, updatedMobile, newHash, admin.id);

    res.json({
      message: 'Creator profile updated successfully in database.',
      creator: {
        id: admin.id,
        username: updatedUsername,
        email: updatedEmail,
        mobile: updatedMobile,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: 'Username or email already in use by another account.' });
  }
});

// -------------------------------------------------------------
// CREATIONS & POST FEED ROUTES
// -------------------------------------------------------------

// GET /api/creations
app.get('/api/creations', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM creations';
  const params = [];
  const conditions = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (search) {
    conditions.push('(title LIKE ? OR caption LIKE ? OR yarn_type LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const creations = db.prepare(query).all(...params);
  res.json(creations);
});

// POST /api/creations
app.post('/api/creations', requireAuth, (req, res) => {
  const { title, category, price, image, caption, yarnType, dimensions, tag } = req.body;

  if (!title || !category || !image) {
    return res.status(400).json({ error: 'Missing required creation fields.' });
  }

  const id = `post_${Date.now()}`;
  const insert = db.prepare(`
    INSERT INTO creations (id, shortcode, title, category, price, image, caption, yarn_type, dimensions, tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    `custom_${Date.now()}`,
    sanitizeText(title),
    category,
    parseFloat(price) || 299,
    image,
    caption ? caption.trim() : '',
    yarnType ? sanitizeText(yarnType) : 'Handmade Milk Cotton',
    dimensions ? sanitizeText(dimensions) : 'Custom Fit',
    tag ? sanitizeText(tag) : '✨ New Post'
  );

  const created = db.prepare('SELECT * FROM creations WHERE id = ?').get(id);
  res.status(201).json(created);
});

// POST /api/creations/like
app.post('/api/creations/like', (req, res) => {
  const { postId, increment } = req.body;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  const delta = increment ? 1 : -1;
  db.prepare('UPDATE creations SET likes = MAX(0, likes + ?) WHERE id = ?').run(delta, postId);
  const updated = db.prepare('SELECT id, likes FROM creations WHERE id = ?').get(postId);
  res.json(updated);
});

// -------------------------------------------------------------
// ORDERS & QUOTATION ROUTES
// -------------------------------------------------------------

// POST /api/orders (Public - Customer Requests a Custom Quote & Places Order)
app.post('/api/orders', orderLimiter, (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    customerInstagram,
    title,
    category,
    description,
    yarnType,
    yarnLabel,
    palette,
    colorNotes,
    size,
    sizeLabel,
    addons,
    totalPrice,
    targetDeadline,
    giftMessage,
    referenceImages
  } = req.body;

  // Validation
  if (!customerName || customerName.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
  }

  if (!customerEmail || !validator.isEmail(customerEmail.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address for quotation updates.' });
  }

  if (!customerPhone || customerPhone.trim().length < 7) {
    return res.status(400).json({ error: 'Please provide a valid WhatsApp / Mobile number.' });
  }

  if (!shippingAddress || shippingAddress.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide your shipping / delivery address (City, State, Pincode).' });
  }

  const safeName = sanitizeText(customerName);
  const safeEmail = validator.normalizeEmail(customerEmail.trim());
  const safePhone = sanitizeText(customerPhone);
  const safeAddress = sanitizeText(shippingAddress);
  const safeIg = customerInstagram ? sanitizeText(customerInstagram) : '';
  const safeTitle = sanitizeText(title || 'Custom Crochet Piece');
  const safeDesc = sanitizeText(description || '');
  const safeColorNotes = colorNotes ? sanitizeText(colorNotes) : '';
  const safeGiftMessage = giftMessage ? sanitizeText(giftMessage) : '';

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const orderId = `#OON-${new Date().getFullYear()}-${randomDigits}`;

  const insert = db.prepare(`
    INSERT INTO orders (
      id, customer_name, customer_email, customer_phone, shipping_address, customer_instagram,
      title, category, description, yarn_type, yarn_label, palette_json, color_notes,
      size, size_label, addons_json, total_price, status, target_deadline, gift_message,
      reference_images_json, wip_photos_json, admin_notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 'received', ?, ?,
      ?, '[]', 'New quote request placed on website.'
    )
  `);

  insert.run(
    orderId,
    safeName,
    safeEmail,
    safePhone,
    safeAddress,
    safeIg,
    safeTitle,
    category || 'amigurumi',
    safeDesc,
    yarnType || 'cotton',
    yarnLabel || '100% Milk Cotton',
    JSON.stringify(palette || []),
    safeColorNotes,
    size || 'standard',
    sizeLabel || 'Standard Size',
    JSON.stringify(addons || []),
    parseFloat(totalPrice) || 499.0,
    targetDeadline || null,
    safeGiftMessage,
    JSON.stringify(referenceImages || [])
  );

  const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  res.status(201).json({
    message: 'Quote request submitted successfully!',
    order: {
      ...createdOrder,
      palette: JSON.parse(createdOrder.palette_json || '[]'),
      addons: JSON.parse(createdOrder.addons_json || '[]'),
      referenceImages: JSON.parse(createdOrder.reference_images_json || '[]'),
      wipPhotos: JSON.parse(createdOrder.wip_photos_json || '[]')
    }
  });
});

// GET /api/orders/track/:orderId (Public Order & Quote Tracking)
app.get('/api/orders/track/:orderId', (req, res) => {
  const rawId = req.params.orderId.trim();
  const searchId = rawId.startsWith('#') ? rawId : `#${rawId}`;

  const order = db.prepare(`
    SELECT id, customer_name, customer_email, customer_phone, shipping_address,
           title, category, description, yarn_type, yarn_label, palette_json, color_notes,
           size, size_label, addons_json, total_price, quoted_price, quote_breakdown_json, quote_notes, upi_id,
           status, target_deadline, gift_message, reference_images_json, wip_photos_json, created_at
    FROM orders
    WHERE id = ? OR LOWER(id) = LOWER(?) OR LOWER(customer_email) = LOWER(?) OR customer_phone = ?
  `).get(searchId, rawId, rawId, rawId);

  if (!order) {
    return res.status(404).json({ error: `No order found for "${rawId}". Please check your Order ID or receipt.` });
  }

  res.json({
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
    title: order.title,
    category: order.category,
    description: order.description,
    yarnType: order.yarn_type,
    yarnLabel: order.yarn_label,
    palette: JSON.parse(order.palette_json || '[]'),
    colorNotes: order.color_notes,
    size: order.size,
    sizeLabel: order.size_label,
    addons: JSON.parse(order.addons_json || '[]'),
    totalPrice: order.total_price,
    quotedPrice: order.quoted_price,
    quoteBreakdown: order.quote_breakdown_json ? JSON.parse(order.quote_breakdown_json) : null,
    quoteNotes: order.quote_notes,
    upiId: order.upi_id,
    status: order.status,
    targetDeadline: order.target_deadline,
    giftMessage: order.gift_message,
    referenceImages: JSON.parse(order.reference_images_json || '[]'),
    wipPhotos: JSON.parse(order.wip_photos_json || '[]'),
    createdAt: order.created_at
  });
});

// GET /api/orders (Admin Only)
app.get('/api/orders', requireAuth, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR title LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);
  const parsed = rows.map(r => ({
    ...r,
    palette: JSON.parse(r.palette_json || '[]'),
    addons: JSON.parse(r.addons_json || '[]'),
    referenceImages: JSON.parse(r.reference_images_json || '[]'),
    wipPhotos: JSON.parse(r.wip_photos_json || '[]'),
    quoteBreakdown: r.quote_breakdown_json ? JSON.parse(r.quote_breakdown_json) : null
  }));

  res.json(parsed);
});

// PUT /api/orders/:orderId/quote (Creator Sends Official Bespoke Quote in ₹)
app.put('/api/orders/:orderId/quote', requireAuth, (req, res) => {
  const orderId = req.params.orderId;
  const { craftFee, materialFee, courierFee, totalQuote, quoteNotes, upiId, updateStatus } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const breakdown = {
    craftFee: parseFloat(craftFee) || 0,
    materialFee: parseFloat(materialFee) || 0,
    courierFee: parseFloat(courierFee) || 0,
    totalQuote: parseFloat(totalQuote) || 0
  };

  const newStatus = updateStatus || (order.status === 'received' ? 'pattern_prepared' : order.status);

  db.prepare(`
    UPDATE orders 
    SET quoted_price = ?, quote_breakdown_json = ?, quote_notes = ?, upi_id = ?, status = ?
    WHERE id = ?
  `).run(
    breakdown.totalQuote,
    JSON.stringify(breakdown),
    quoteNotes ? sanitizeText(quoteNotes) : '',
    upiId ? sanitizeText(upiId) : 'ooniverse@upi',
    newStatus,
    orderId
  );

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({
    message: 'Official quote saved and dispatched.',
    order: {
      ...updated,
      palette: JSON.parse(updated.palette_json || '[]'),
      addons: JSON.parse(updated.addons_json || '[]'),
      referenceImages: JSON.parse(updated.reference_images_json || '[]'),
      wipPhotos: JSON.parse(updated.wip_photos_json || '[]'),
      quoteBreakdown: JSON.parse(updated.quote_breakdown_json || '{}')
    }
  });
});

// PUT /api/orders/:orderId/status
app.put('/api/orders/:orderId/status', requireAuth, (req, res) => {
  const orderId = req.params.orderId;
  const { status, adminNotes, wipPhoto } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  let updatedWip = JSON.parse(order.wip_photos_json || '[]');
  if (wipPhoto && wipPhoto.url) {
    updatedWip.push({
      url: wipPhoto.url,
      stage: wipPhoto.stage || 'Work In Progress',
      note: sanitizeText(wipPhoto.note || 'Stitching in progress'),
      timestamp: new Date().toLocaleString()
    });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, admin_notes = ?, wip_photos_json = ?
    WHERE id = ?
  `).run(
    status || order.status,
    adminNotes ? sanitizeText(adminNotes) : order.admin_notes,
    JSON.stringify(updatedWip),
    orderId
  );

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({
    message: 'Order updated successfully.',
    order: {
      ...updated,
      palette: JSON.parse(updated.palette_json || '[]'),
      addons: JSON.parse(updated.addons_json || '[]'),
      referenceImages: JSON.parse(updated.reference_images_json || '[]'),
      wipPhotos: JSON.parse(updated.wip_photos_json || '[]')
    }
  });
});

// GET /api/stats
app.get('/api/stats', requireAuth, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const inProgress = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('received', 'pattern_prepared', 'in_progress', 'quality_check')`).get().count;
  const shipped = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('shipped', 'completed')`).get().count;
  const revenue = db.prepare('SELECT SUM(COALESCE(quoted_price, total_price)) as sum FROM orders').get().sum || 0;

  res.json({
    totalOrders,
    inProgress,
    shipped,
    revenue: Math.round(revenue)
  });
});

// Catch-all route to serve SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🧶 Ooniverse Crochet Order Management Server running on port ${PORT}`);
  console.log(`🇮🇳 Indian Rupee (₹) Quotation System active`);
});
