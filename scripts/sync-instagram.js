/**
 * Instagram Posts Synchronizer & JSON Updater
 * Fetches latest posts from Instagram profile, downloads media assets, and updates data/instagram_posts.json
 * 
 * Usage:
 *   node scripts/sync-instagram.js
 *   node scripts/sync-instagram.js [username]
 *   INSTAGRAM_USERNAME=ooniverse_2404 node scripts/sync-instagram.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const DEFAULT_USERNAME = 'ooniverse_2404';
const username = process.argv[2]?.replace(/^@/, '') || process.env.INSTAGRAM_USERNAME || DEFAULT_USERNAME;
const sessionId = process.env.INSTAGRAM_SESSION_ID || process.env.IG_SESSION_ID || '';
const forceDownload = process.argv.includes('--force-download');

const DATA_FILE = path.join(rootDir, 'data', 'instagram_posts.json');
const MEDIA_DIR = path.join(rootDir, 'public', 'instagram');

// Ensure directories exist
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

console.log(`\n🧵 [Instagram Sync] Initializing sync for @${username}...`);

/**
 * Fetch profile data with multiple fallback strategies
 */
async function fetchInstagramProfile(targetUser) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'x-ig-app-id': '936619743392459',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': `https://www.instagram.com/${targetUser}/`,
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (sessionId) {
    headers['Cookie'] = `sessionid=${sessionId};`;
    console.log(`🔐 Using authenticated session cookie for @${targetUser}`);
  }

  // Strategy 1: web_profile_info API
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(targetUser)}`;
    console.log(`📡 Requesting profile from: ${url}`);
    
    const res = await fetch(url, { headers });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.user) {
        console.log(`✅ Successfully fetched profile info via web_profile_info API!`);
        return json.data.user;
      }
    } else {
      console.warn(`⚠️ Primary API returned status ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.warn(`⚠️ Primary API request failed: ${err.message}`);
  }

  // Strategy 2: Alternate mobile user agent endpoint
  try {
    console.log(`🔄 Attempting fallback endpoint...`);
    const mobileHeaders = {
      'User-Agent': 'Instagram 219.0.0.12.117 Android (29/10; 480dpi; 1080x2160; OnePlus; GM1913; GM1913; qcom; en_US)',
      'Accept': '*/*',
      'x-ig-app-id': '936619743392459',
      'Accept-Language': 'en-US,en;q=0.9'
    };
    if (sessionId) mobileHeaders['Cookie'] = `sessionid=${sessionId};`;

    const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(targetUser)}`;
    const res = await fetch(url, { headers: mobileHeaders });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.user) {
        console.log(`✅ Successfully fetched profile info via mobile API!`);
        return json.data.user;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Fallback API failed: ${err.message}`);
  }

  throw new Error(`Could not fetch Instagram profile for @${targetUser}. If Instagram requires authentication, please set the INSTAGRAM_SESSION_ID secret.`);
}

/**
 * Download an image file locally to avoid CDN expiration
 */
async function downloadMedia(url, localFilePath) {
  if (!url) return false;
  if (fs.existsSync(localFilePath) && !forceDownload) {
    const stats = fs.statSync(localFilePath);
    if (stats.size > 1000) {
      return true; // Already downloaded and valid
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`⚠️ Failed to download media from ${url.slice(0, 60)}... Status: ${res.status}`);
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(localFilePath, buffer);
    return true;
  } catch (err) {
    console.warn(`⚠️ Error downloading media: ${err.message}`);
    return false;
  }
}

/**
 * Main Sync Process
 */
async function sync() {
  let existingPosts = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      existingPosts = JSON.parse(raw);
      if (!Array.isArray(existingPosts)) existingPosts = [];
    } catch (e) {
      console.warn(`⚠️ Existing posts file was corrupt, starting fresh.`);
      existingPosts = [];
    }
  }

  console.log(`📦 Loaded ${existingPosts.length} existing posts from ${path.relative(rootDir, DATA_FILE)}`);

  // Fetch from Instagram
  const user = await fetchInstagramProfile(username);
  const timelineEdges = user?.edge_owner_to_timeline_media?.edges || [];
  console.log(`📸 Discovered ${timelineEdges.length} posts on Instagram timeline for @${username}`);

  const existingMap = new Map();
  existingPosts.forEach(p => {
    if (p.shortcode) existingMap.set(p.shortcode, p);
  });

  let newPostsCount = 0;
  let updatedPostsCount = 0;
  const mergedPosts = [];
  const processedShortcodes = new Set();

  for (const edge of timelineEdges) {
    const node = edge.node;
    const shortcode = node.shortcode;
    if (!shortcode) continue;

    processedShortcodes.add(shortcode);

    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
    const likes = node.edge_liked_by?.count ?? node.edge_media_preview_like?.count ?? 0;
    const comments = node.edge_media_to_comment?.count ?? 0;
    const isVideo = !!node.is_video;
    const displayUrl = node.display_url || '';
    const videoUrl = node.video_url || null;
    const timestamp = node.taken_at_timestamp || Math.floor(Date.now() / 1000);
    
    const localImgName = `${shortcode}.jpg`;
    const localImgPath = path.join(MEDIA_DIR, localImgName);
    const localImgUrl = `/instagram/${localImgName}`;

    // Download image locally
    if (displayUrl) {
      const downloaded = await downloadMedia(displayUrl, localImgPath);
      if (downloaded) {
        // downloaded successfully
      }
    }

    if (existingMap.has(shortcode)) {
      // Existing post -> update stats
      const existing = existingMap.get(shortcode);
      let changed = false;

      if (existing.likes !== likes || existing.comments !== comments) {
        existing.likes = likes;
        existing.comments = comments;
        changed = true;
      }

      if (caption && existing.caption !== caption) {
        existing.caption = caption;
        changed = true;
      }

      if (displayUrl && existing.display_url !== displayUrl) {
        existing.display_url = displayUrl;
        changed = true;
      }

      if (videoUrl && existing.video_url !== videoUrl) {
        existing.video_url = videoUrl;
        changed = true;
      }

      if (!existing.local_image) {
        existing.local_image = localImgUrl;
        changed = true;
      }

      if (changed) {
        updatedPostsCount++;
      }

      mergedPosts.push(existing);
    } else {
      // New post found!
      newPostsCount++;
      console.log(`✨ New post detected! Shortcode: ${shortcode}, Likes: ${likes}, Timestamp: ${timestamp}`);

      const newPost = {
        shortcode,
        is_video: isVideo,
        display_url: displayUrl,
        video_url: videoUrl,
        caption,
        likes,
        comments,
        timestamp,
        local_image: localImgUrl
      };

      mergedPosts.push(newPost);
    }
  }

  // Retain any older existing posts that may not have appeared in the first page of timeline
  for (const post of existingPosts) {
    if (post.shortcode && !processedShortcodes.has(post.shortcode)) {
      mergedPosts.push(post);
    }
  }

  // Sort descending by timestamp (newest first)
  mergedPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const hasChanges = newPostsCount > 0 || updatedPostsCount > 0;

  // Save updated JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(mergedPosts, null, 2) + '\n', 'utf-8');
  console.log(`💾 Saved ${mergedPosts.length} posts to ${path.relative(rootDir, DATA_FILE)}`);

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`📊 Sync Summary:`);
  console.log(`   • Total Posts in Database: ${mergedPosts.length}`);
  console.log(`   • New Posts Added:         ${newPostsCount}`);
  console.log(`   • Posts Updated:           ${updatedPostsCount}`);
  console.log(`   • Changes Detected:        ${hasChanges ? 'YES' : 'NO'}`);
  console.log(`═══════════════════════════════════════════════\n`);

  // If running inside GitHub Actions, export outputs
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=${hasChanges}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_posts_count=${newPostsCount}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `updated_posts_count=${updatedPostsCount}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `total_posts_count=${mergedPosts.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `instagram_username=${username}\n`);
  }

  return { hasChanges, newPostsCount, updatedPostsCount, totalPosts: mergedPosts.length };
}

// Execute
sync().catch(err => {
  console.error(`❌ Sync failed with error:`, err);
  process.exit(1);
});
