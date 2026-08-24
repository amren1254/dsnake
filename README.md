# 🧶 Ooniverse Crochet Order Management System

A bespoke artisan web application for **Ooniverse (@ooniverse_2404)** inspired by luxury botanical couture (Hunar Crochet aesthetic), featuring authentic Instagram media, emotion/sentiment categorization (floriography & occasions), an interactive 1-click custom order form, real-time stitch progress tracking, and a secure Creator Studio backed by an **SQLite database**.

---

## ✨ Features

### 1. Authentic Instagram Creations Feed
- Fetches real creations and reels directly from [@ooniverse_2404](https://www.instagram.com/ooniverse_2404):
  - 🌹 *Viral Rose Petal Potli Handbag*
  - 🌸 *Everlasting Tulip & Daisy Floral Wrap*
  - 🎀 *Viral Floral & Bow Crochet Hairtie* (13.9k+ views)
  - 🐱 *Viral Cat Ear Crochet Hair Clips*
  - 🦋 *Whimsical Butterfly Crochet Hairtie*
  - 🌻 *Evergreen Sunflower Single Stem Wrap*
  - 🌿 *Lavender & Chamomile Crochet Stem*
  - 🧸 *Cute Mini Amigurumi Desk Companion*
- Includes like counters, video badges, and direct links to view posts/reels on Instagram.

### 2. Custom Crochet Order System
- **100% Open & Accessible to Explore**:
  - Anyone can browse creations, select categories, pick from 20+ yarn swatches, choose textures (Chunky Velvet, Milk Cotton, Wool Blend, Acrylic), adjust dimensions, and upload reference photos / sketches.
- **Secure Checkout & Booking**:
  - When the customer is ready to place the order, the system requires their **Full Name**, **Phone / WhatsApp Number**, **Email Address**, and **Delivery / Shipping Address**.
  - Client-side and server-side validation against injection attacks, invalid emails, and malformed phone numbers.
  - Generates a unique tracking ID (e.g. `#OON-2026-7955`), instant receipt modal, and 1-click WhatsApp / Instagram DM dispatch.

### 3. Customer Order Tracking Portal
- Look up orders by Order ID or email.
- **6-Stage Visual Timeline**:
  `Order Received` ➔ `Pattern & Yarn Ready` ➔ `On The Hook (WIP)` ➔ `Finishing & QC` ➔ `Gift Wrapped & Shipped` ➔ `Delivered`.
- **Artisan WIP Photos**: Displays live progress photos taken and uploaded by the creator during crafting.

### 4. Protected Creator Studio & SQLite Database
- **Creator Login Screen**: The admin portal is protected behind a secure login screen.
- **SQLite Database (`data/ooniverse.sqlite`)**:
  - `admins` table storing creator username, email, mobile number, and **Bcrypt hashed password**.
  - `orders` table storing all customer details, delivery addresses, specs, and WIP photos.
  - `creations` table storing catalog posts.
- **Default Creator Login Credentials**:
  - **Username**: `ooniverse_creator`
  - **Email**: `ooniverse2404@gmail.com`
  - **Mobile**: `+91 98765 43210`
  - **Password**: `Ooniverse@2026!`
- **Account Settings**: Creator can update their mobile, email, username, or change password anytime from the dashboard.

---

## 🔒 Security Standards Implemented

- **Password Encryption**: Bcrypt hashing with salt rounds = 12.
- **Session Authentication**: JWT signed tokens (24h expiration).
- **Brute Force Protection**: Rate limiting on `/api/auth/login` (max 10 attempts / 15 min per IP).
- **Spam Protection**: Rate limiting on `/api/orders` (max 30 orders / hour per IP).
- **SQL Injection Prevention**: Parameterized prepared statements (`better-sqlite3`).
- **XSS Attack Prevention**: Input sanitization & escaping with `validator.js`.
- **HTTP Security Headers**: `helmet` enabled.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start the full-stack SQLite backend & API server
node server/index.js

# Or run Vite dev server for hot-reloading
npm run dev

# Manually trigger Instagram sync
npm run sync:instagram
```

The application is accessible at `http://localhost:3001` (Backend + SPA) or `http://localhost:5173` (Vite dev).

---

## ⏰ Automated 24-Hour Instagram Cron Job & Vercel Deployment

A GitHub Actions workflow is configured in [`.github/workflows/fetch-instagram-posts.yml`](file:///.github/workflows/fetch-instagram-posts.yml) to automatically keep the website synchronized with the Instagram profile.

### How It Works:
1. **Schedule**: Runs automatically every 24 hours at `00:00 UTC` via GitHub Cron schedule (`cron: '0 0 * * *'`).
2. **Fetch**: Runs [`scripts/sync-instagram.js`](file:///scripts/sync-instagram.js) to fetch all recent posts, media, likes, comments, and captions from Instagram (`@ooniverse_2404` or custom handle).
3. **Smart Merge**: Downloads new post photos to `public/instagram/` and merges new/updated post details into [`data/instagram_posts.json`](file:///data/instagram_posts.json).
4. **Change Detection**: Checks if `data/instagram_posts.json` or media assets have changed.
5. **Git Commit & Push**: Commits the newly discovered posts back to GitHub.
6. **Vercel Build Trigger**:
   - Standard: Pushing new posts to GitHub automatically triggers a production build if Vercel is connected to the GitHub repo.
   - Deploy Hook: If `VERCEL_DEPLOY_HOOK_URL` is set in GitHub Secrets, triggers an instant deployment rebuild via Vercel Deploy Hook.

### Optional GitHub Secrets Configuration:
- `VERCEL_DEPLOY_HOOK_URL`: *(Recommended)* Create a Deploy Hook in **Vercel Project Settings ➔ Git ➔ Deploy Hooks** (e.g. `https://api.vercel.com/v1/integrations/deploy/prj_...`) and add it to **GitHub Repo Settings ➔ Secrets and variables ➔ Actions**.
- `INSTAGRAM_SESSION_ID`: *(Optional)* Your Instagram session cookie string if you want authenticated fetching.

