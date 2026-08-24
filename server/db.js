import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ooniverse.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance & reliability
db.pragma('journal_mode = WAL');

// Initialize Tables
export function initDatabase() {
  // 1. Admins / Creator Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'creator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Orders & Quotations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT,
      customer_instagram TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      yarn_type TEXT NOT NULL,
      yarn_label TEXT NOT NULL,
      palette_json TEXT,
      color_notes TEXT,
      size TEXT NOT NULL,
      size_label TEXT NOT NULL,
      addons_json TEXT,
      total_price REAL NOT NULL,
      quoted_price REAL,
      quote_breakdown_json TEXT,
      quote_notes TEXT,
      upi_id TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      target_deadline TEXT,
      gift_message TEXT,
      reference_images_json TEXT,
      wip_photos_json TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe Column Migrations for Upgrades
  const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
  const columnNames = tableInfo.map(c => c.name);
  if (!columnNames.includes('quoted_price')) {
    db.exec('ALTER TABLE orders ADD COLUMN quoted_price REAL;');
  }
  if (!columnNames.includes('quote_breakdown_json')) {
    db.exec('ALTER TABLE orders ADD COLUMN quote_breakdown_json TEXT;');
  }
  if (!columnNames.includes('quote_notes')) {
    db.exec('ALTER TABLE orders ADD COLUMN quote_notes TEXT;');
  }
  if (!columnNames.includes('upi_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN upi_id TEXT;');
  }

  // 3. Creations / Instagram Posts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS creations (
      id TEXT PRIMARY KEY,
      shortcode TEXT UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      caption TEXT NOT NULL,
      yarn_type TEXT,
      dimensions TEXT,
      likes INTEGER DEFAULT 0,
      is_video INTEGER DEFAULT 0,
      video_url TEXT,
      tag TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDefaultAdmin();
  seedInstagramCreations();
  seedSampleOrders();
}

function seedDefaultAdmin() {
  const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('ooniverse_creator');
  if (!checkAdmin) {
    const saltRounds = 12;
    const defaultPassword = 'Ooniverse@2026!';
    const passwordHash = bcrypt.hashSync(defaultPassword, saltRounds);

    const insert = db.prepare(`
      INSERT INTO admins (username, email, mobile, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(
      'ooniverse_creator',
      'ooniverse2404@gmail.com',
      '+91 98765 43210',
      passwordHash,
      'creator'
    );
    console.log('✅ Creator account seeded: username: ooniverse_creator, email: ooniverse2404@gmail.com');
  }
}

function seedInstagramCreations() {
  const instagramPostsFile = path.join(__dirname, '../data/instagram_posts.json');
  if (!fs.existsSync(instagramPostsFile)) return;

  try {
    const posts = JSON.parse(fs.readFileSync(instagramPostsFile, 'utf-8'));
    
    // Clear and refresh creations with exact INR prices and verified categories
    db.prepare('DELETE FROM creations').run();

    const insert = db.prepare(`
      INSERT OR REPLACE INTO creations (
        id, shortcode, title, category, price, image, caption, yarn_type, dimensions, likes, is_video, video_url, tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const titleMap = {
      'DWD3OiYCWBG': { title: 'Viral Floral & Bow Crochet Hairtie', cat: 'wearables', price: 249, yarn: 'Soft Cotton & Elastic', tag: '🔥 13.9k+ Views' },
      'DcWMRVLJcI1': { title: 'Everlasting Tulip & Daisy Floral Wrap', cat: 'bouquets', price: 799, yarn: '100% Milk Cotton', tag: '🌸 Hand Tied' },
      'DcRFjycJxe8': { title: 'Cute Mini Amigurumi Desk Companion', cat: 'amigurumi', price: 399, yarn: 'Chunky Velvet Yarn', tag: '🧸 Cute Plush' },
      'DcOhYSXJWtt': { title: 'Mini Daisy Bag Charm & Keychain', cat: 'keychains', price: 199, yarn: 'Organic Cotton', tag: '🔑 Gift Favorite' },
      'DcMQNKvzau5': { title: 'Viral Rose Petal Potli Handbag', cat: 'bags', price: 999, yarn: 'Lustrous Silky Cotton', tag: '👜 Trending Potli' },
      'DcITdLbpduk': { title: 'Artisan Pastel Flower Bouquet', cat: 'bouquets', price: 899, yarn: 'Milk Cotton Yarn', tag: '✨ Bespoke' },
      'DcIQe1EJCiZ': { title: 'Bespoke Sunflower & Rose Arrangement', cat: 'bouquets', price: 749, yarn: '100% Milk Cotton', tag: '🌻 Sunny Bloom' },
      'DZkN5djpgpY': { title: 'Handcrafted Heart Charm Accessory', cat: 'keychains', price: 220, yarn: 'Plush Velvet', tag: '💖 Hand-Stitched' },
      'DYKWz-MJyqx': { title: 'Whimsical Butterfly Crochet Hairtie', cat: 'wearables', price: 199, yarn: 'Pastel Cotton', tag: '🦋 Viral Hairtie' },
      'DX8KlieJ3xs': { title: 'Lavender & Chamomile Crochet Stem', cat: 'bouquets', price: 349, yarn: 'Milk Cotton Yarn', tag: '🌿 Calming Herb' },
      'DXyQp0EJUvx': { title: 'Evergreen Sunflower Single Stem Wrap', cat: 'bouquets', price: 449, yarn: 'Organic Cotton Yarn', tag: '🌻 Forever Flower' },
      'DXwOHr3pCCu': { title: 'Viral Cat Ear Crochet Hair Clips (Pair)', cat: 'wearables', price: 299, yarn: 'Fluffy Chenille', tag: '🐱 Viral Cat Ear' }
    };

    for (const post of posts) {
      const info = titleMap[post.shortcode] || {
        title: `Ooniverse Creation #${post.shortcode}`,
        cat: 'bouquets',
        price: 499,
        yarn: 'Handcrafted Milk Cotton',
        tag: '✨ Handmade'
      };

      const localImg = `/instagram/${post.shortcode}.jpg`;

      insert.run(
        `post_${post.shortcode}`,
        post.shortcode,
        info.title,
        info.cat,
        info.price,
        localImg,
        post.caption || 'Handcrafted with love by @ooniverse_2404 🧶 DM for custom colors and orders!',
        info.yarn,
        'Handcrafted Custom Size',
        post.likes || 12,
        post.is_video ? 1 : 0,
        post.video_url || null,
        info.tag
      );
    }
    console.log(`✅ Seeded ${posts.length} real Instagram posts with INR prices into SQLite database.`);
  } catch (err) {
    console.error('Error seeding Instagram posts:', err);
  }
}

function seedSampleOrders() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM orders').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(`
    INSERT INTO orders (
      id, customer_name, customer_email, customer_phone, shipping_address, customer_instagram,
      title, category, description, yarn_type, yarn_label, palette_json, color_notes,
      size, size_label, addons_json, total_price, quoted_price, quote_breakdown_json, quote_notes, upi_id,
      status, target_deadline, gift_message, reference_images_json, wip_photos_json, admin_notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);

  insert.run(
    '#OON-2026-8841',
    'Pooja Sharma',
    'pooja.s@example.com',
    '+91 98765 12345',
    'Flat 402, Lotus Heights, Indiranagar, Bengaluru, Karnataka, 560038',
    '@pooja_crafts',
    'Viral Rose Potli Bag in Crimson & Gold',
    'bags',
    'Custom crimson rose potli with gold drawstring cords and pearl beads.',
    'cotton',
    '100% Milk Cotton',
    JSON.stringify([{ name: 'Strawberry Red', hex: '#E76F51' }, { name: 'Honey Mustard', hex: '#E9C46A' }]),
    'Main rose petals in crimson red, cord in mustard gold',
    'standard',
    'Standard Bag (20cm)',
    JSON.stringify(['gift_wrap', 'wooden_tag']),
    1050.0,
    980.0,
    JSON.stringify({ craft: 750, material: 150, shipping: 80, total: 980 }),
    'Includes luxury pearl tassels & custom initial wooden tag.',
    'ooniverse@upi',
    'in_progress',
    '2026-09-01',
    'Happy Birthday Pooja!',
    JSON.stringify(['/instagram/DcMQNKvzau5.jpg']),
    JSON.stringify([{
      url: '/instagram/DcMQNKvzau5.jpg',
      stage: 'Crocheting On The Hook',
      note: 'Base petals crocheted and drawstring loops attached!',
      timestamp: '2026-08-24 14:00'
    }]),
    'Priority custom bag order. Pearl beads sourced.',
    '2026-08-22 10:30:00'
  );

  insert.run(
    '#OON-2026-9102',
    'Aarav Mehta',
    'aarav.m@example.com',
    '+91 98123 45678',
    '12 Silver Crest Villa, Bandra West, Mumbai, Maharashtra, 400050',
    '@aarav_m',
    'Sunflowers & Lavender Eternity Bouquet',
    'bouquets',
    '3 large blooming sunflowers with 4 lavender stems in kraft wrapping.',
    'cotton',
    '100% Milk Cotton',
    JSON.stringify([{ name: 'Honey Mustard', hex: '#E9C46A' }, { name: 'Lavender Haze', hex: '#A084E8' }, { name: 'Matcha Sage', hex: '#8A9A86' }]),
    'Bright yellow petals and deep brown sunflower centers',
    'large',
    'Large Deluxe Bouquet (35cm)',
    JSON.stringify(['gift_wrap']),
    899.0,
    849.0,
    JSON.stringify({ craft: 650, material: 120, shipping: 79, total: 849 }),
    'Evergreen bouquet with dried floral accents.',
    'ooniverse@upi',
    'shipped',
    '2026-08-28',
    'Happy 5th Anniversary!',
    JSON.stringify(['/instagram/DXyQp0EJUvx.jpg']),
    JSON.stringify([{
      url: '/instagram/DXyQp0EJUvx.jpg',
      stage: 'Gift Wrapped & Shipped',
      note: 'Bouquet arranged in rustic kraft paper with silk ribbon and wax seal card.',
      timestamp: '2026-08-23 11:30'
    }]),
    'Dispatched via BlueDart #TRK-9921448',
    '2026-08-19 15:45:00'
  );
  console.log('✅ Seeded demo orders into SQLite database.');
}

export default db;
