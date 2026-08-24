/**
 * Instagram Posts Synchronizer & JSON Updater
 * Fetches latest posts from Instagram profile, downloads media assets, and updates data/instagram_posts.json
 * 
 * Usage:
 *   node scripts/sync-instagram.js
 *   node scripts/sync-instagram.js [username]
 *   INSTAGRAM_USERNAME=ooniverse_2404 INSTAGRAM_SESSION_ID="..." node scripts/sync-instagram.js
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
if (sessionId) {
  console.log(`🔐 Using authenticated session cookie for @${username}`);
}

function getRequestHeaders(targetUser) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'x-ig-app-id': '936619743392459',
    'x-asbd-id': '129477',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': `https://www.instagram.com/${targetUser}/`,
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (sessionId) {
    const dsUserId = sessionId.split(':')[0] || '';
    headers['Cookie'] = `sessionid=${encodeURIComponent(sessionId)}; ds_user_id=${dsUserId};`;
  }
  return headers;
}

/**
 * Fetch profile metadata to obtain User ID and Total Posts count
 */
async function fetchInstagramProfile(targetUser) {
  const headers = getRequestHeaders(targetUser);

  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(targetUser)}`;
    console.log(`📡 Requesting profile from: ${url}`);
    
    const res = await fetch(url, { headers });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.user) {
        console.log(`✅ Successfully fetched profile info for @${targetUser}`);
        return json.data.user;
      }
    } else {
      console.warn(`⚠️ Primary profile API returned status ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.warn(`⚠️ Primary profile API request failed: ${err.message}`);
  }

  // Fallback public endpoint without cookie
  try {
    const publicHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'x-ig-app-id': '936619743392459',
      'Accept': '*/*',
      'Referer': `https://www.instagram.com/${targetUser}/`,
      'X-Requested-With': 'XMLHttpRequest'
    };
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(targetUser)}`;
    const res = await fetch(url, { headers: publicHeaders });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.user) {
        return json.data.user;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Fallback public profile API failed: ${err.message}`);
  }

  throw new Error(`Could not fetch Instagram profile for @${targetUser}.`);
}

/**
 * Fetch all posts across pages via User Feed API
 */
async function fetchAllUserFeedPosts(userId, targetUser) {
  const headers = getRequestHeaders(targetUser);
  const posts = [];
  const shortcodeSet = new Set();
  let maxId = '';
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 12) {
    let feedUrl = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=50`;
    if (maxId) feedUrl += `&max_id=${encodeURIComponent(maxId)}`;

    console.log(`🔄 Fetching Feed Page ${page}...`);
    const res = await fetch(feedUrl, { headers });
    if (!res.ok) {
      console.warn(`⚠️ Feed request returned status ${res.status}`);
      break;
    }

    const data = await res.json();
    const items = data.items || [];
    console.log(`✅ Page ${page} returned ${items.length} items (more_available: ${data.more_available})`);

    for (const item of items) {
      const code = item.code;
      if (!code || shortcodeSet.has(code)) continue;
      shortcodeSet.add(code);

      const imgUrl = item.image_versions2?.candidates?.[0]?.url || item.display_url || '';
      posts.push({
        shortcode: code,
        caption: item.caption?.text || '',
        likes: item.like_count || 0,
        comments: item.comment_count || 0,
        is_video: Boolean(item.video_versions && item.video_versions.length > 0),
        display_url: imgUrl,
        video_url: item.video_versions?.[0]?.url || null,
        timestamp: item.taken_at || Math.floor(Date.now() / 1000)
      });
    }

    hasMore = Boolean(data.more_available && data.next_max_id);
    maxId = data.next_max_id || '';
    page++;
    await new Promise(r => setTimeout(r, 500));
  }

  return posts;
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

const CURATED_METADATA = {
  'DWD3OiYCWBG': { title: 'Viral Floral & Bow Crochet Hairtie', category: 'wearables', occasion: 'just_because', sentiment: 'Playful Charm', yarn_type: 'Soft Cotton & Elastic', tag: '🔥 13.9k+ Views' },
  'DcWMRVLJcI1': { title: 'Everlasting Tulip & Daisy Floral Wrap', category: 'bouquets', occasion: 'birthday', sentiment: 'Joy & Everlasting Bond', yarn_type: '100% Milk Cotton', tag: '🌸 Hand Tied' },
  'DcMQNKvzau5': { title: 'Viral Rose Petal Potli Handbag', category: 'bags', occasion: 'love', sentiment: 'Festive Elegance', yarn_type: 'Lustrous Silky Cotton', tag: '👜 Trending Potli' },
  'DcRFjycJxe8': { title: 'Cute Mini Amigurumi Desk Companion', category: 'amigurumi', occasion: 'heal_calm', sentiment: 'Cozy Comfort & Cheer', yarn_type: 'Chunky Velvet Yarn', tag: '🧸 Cute Plush' },
  'DcOhYSXJWtt': { title: 'Mini Daisy Bag Charm & Keychain', category: 'keychains', occasion: 'just_because', sentiment: 'Everyday Sunshine', yarn_type: 'Organic Cotton', tag: '🔑 Gift Favorite' },
  'DcITdLbpduk': { title: 'Artisan Pastel Flower Bouquet', category: 'bouquets', occasion: 'love', sentiment: 'Enduring Affection', yarn_type: 'Milk Cotton Yarn', tag: '✨ Bespoke' },
  'DcIQe1EJCiZ': { title: 'Bespoke Sunflower & Rose Arrangement', category: 'bouquets', occasion: 'new_beginnings', sentiment: 'Admiration & Bright Hopes', yarn_type: '100% Milk Cotton', tag: '🌻 Sunny Bloom' },
  'DZkN5djpgpY': { title: 'Handcrafted Heart Charm Accessory', category: 'keychains', occasion: 'love', sentiment: 'Heartfelt Keepsake', yarn_type: 'Plush Velvet', tag: '💖 Hand-Stitched' },
  'DYKWz-MJyqx': { title: 'Whimsical Butterfly Crochet Hairtie', category: 'wearables', occasion: 'birthday', sentiment: 'Grace & Transformation', yarn_type: 'Pastel Cotton', tag: '🦋 Viral Hairtie' },
  'DX8KlieJ3xs': { title: 'Lavender & Chamomile Crochet Stem', category: 'bouquets', occasion: 'heal_calm', sentiment: 'Serenity & Healing', yarn_type: 'Milk Cotton Yarn', tag: '🌿 Calming Herb' },
  'DXyQp0EJUvx': { title: 'Evergreen Sunflower Single Stem Wrap', category: 'bouquets', occasion: 'just_because', sentiment: 'Pure Optimism & Gratitude', yarn_type: 'Organic Cotton Yarn', tag: '🌻 Forever Flower' },
  'DXwOHr3pCCu': { title: 'Viral Cat Ear Crochet Hair Clips (Pair)', category: 'wearables', occasion: 'just_because', sentiment: 'Playful Individuality', yarn_type: 'Fluffy Chenille', tag: '🐱 Viral Cat Ear' }
};

function inferCategoryFromCaption(caption = '') {
  const c = (caption || '').toLowerCase();
  if (c.includes('hairtie') || c.includes('hair tie') || c.includes('clip') || c.includes('cardigan') || c.includes('wearable') || c.includes('scrunchie') || c.includes('band')) return 'wearables';
  if (c.includes('bouquet') || c.includes('tulip') || c.includes('flower') || c.includes('rose') || c.includes('sunflower') || c.includes('stem') || c.includes('wrap')) return 'bouquets';
  if (c.includes('bag') || c.includes('potli') || c.includes('tote') || c.includes('pouch') || c.includes('purse')) return 'bags';
  if (c.includes('keychain') || c.includes('charm') || c.includes('accessory')) return 'keychains';
  if (c.includes('amigurumi') || c.includes('plush') || c.includes('toy') || c.includes('buddy') || c.includes('doll')) return 'amigurumi';
  return 'bouquets';
}

function parsePostTitleAndDescription(caption = '', shortcode = '') {
  const curated = CURATED_METADATA[shortcode] || {};
  if (!caption) {
    return {
      title: curated.title || `Ooniverse Creation #${shortcode}`,
      description: '',
      sentiment: curated.sentiment || 'Artisan Keepsake',
      yarn_type: curated.yarn_type || '100% Milk Cotton',
      category: curated.category || 'bouquets'
    };
  }

  const rawLines = caption.split('\n').map(l => l.trim());
  const nonBlank = rawLines.filter(Boolean);

  let title = '';
  let sentiment = '';
  let yarn_type = '';
  let category = '';
  const descLines = [];

  for (let i = 0; i < nonBlank.length; i++) {
    const line = nonBlank[i];

    // Check for sentiment / vibe line (e.g. "✨ Playful Charm" or "Sentiment: Playful Charm")
    if (/^(✨|sentiment:|vibe:|tag:)/i.test(line)) {
      sentiment = line.replace(/^(✨|sentiment:|vibe:|tag:)\s*/i, '').replace(/#\S+/g, '').trim();
      continue;
    }

    // Check for yarn / material line (e.g. "🧵 Soft Cotton & Elastic" or "Yarn: Soft Cotton")
    if (/^(🧵|🌿|🌱|yarn:|material:)/i.test(line)) {
      yarn_type = line.replace(/^(🧵|🌿|🌱|yarn:|material:)\s*/i, '').replace(/#\S+/g, '').trim();
      continue;
    }

    // Check for category line (e.g. "Category: Wearables" or "📂 Wearables")
    if (/^(category:|cat:|📂)/i.test(line)) {
      category = line.replace(/^(category:|cat:|📂)\s*/i, '').trim().toLowerCase();
      continue;
    }

    // First line becomes Title
    if (!title) {
      title = line;
      continue;
    }

    // Remaining lines become Description
    descLines.push(line);
  }

  if (!title) title = curated.title || `Ooniverse Creation #${shortcode}`;
  const description = descLines.join('\n');

  return {
    title,
    description,
    sentiment: sentiment || curated.sentiment || 'Artisan Keepsake',
    yarn_type: yarn_type || curated.yarn_type || '100% Milk Cotton',
    category: category || curated.category || inferCategoryFromCaption(caption)
  };
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

  // Fetch profile metadata
  const user = await fetchInstagramProfile(username);
  const userId = user?.id;
  const totalAccountPosts = user?.edge_owner_to_timeline_media?.count || 0;
  console.log(`📸 Discovered profile @${username} (User ID: ${userId || 'N/A'}, Total Account Posts: ${totalAccountPosts})`);

  let rawDiscoveredPosts = [];

  // If session ID is provided and we have userId, use the Feed API for full multi-page retrieval
  if (sessionId && userId) {
    console.log(`🚀 Authenticated session active. Fetching full timeline via Feed API...`);
    rawDiscoveredPosts = await fetchAllUserFeedPosts(userId, username);
  }

  // If no posts were retrieved via Feed API (or unauthenticated), extract Page 1 from profile media edges
  if (rawDiscoveredPosts.length === 0) {
    const page1Edges = user?.edge_owner_to_timeline_media?.edges || [];
    for (const edge of page1Edges) {
      const node = edge.node;
      if (!node?.shortcode) continue;
      rawDiscoveredPosts.push({
        shortcode: node.shortcode,
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        likes: node.edge_liked_by?.count ?? node.edge_media_preview_like?.count ?? 0,
        comments: node.edge_media_to_comment?.count ?? 0,
        is_video: !!node.is_video,
        display_url: node.display_url || '',
        video_url: node.video_url || null,
        timestamp: node.taken_at_timestamp || Math.floor(Date.now() / 1000)
      });
    }
    console.log(`📄 Page 1 returned ${rawDiscoveredPosts.length} posts.`);
  }

  console.log(`📸 Total posts fetched from Instagram: ${rawDiscoveredPosts.length}`);

  const existingMap = new Map();
  existingPosts.forEach(p => {
    if (p.shortcode) existingMap.set(p.shortcode, p);
  });

  let newPostsCount = 0;
  let updatedPostsCount = 0;
  const mergedPosts = [];
  const processedShortcodes = new Set();

  for (const postData of rawDiscoveredPosts) {
    const { shortcode, caption, likes, comments, is_video, display_url, video_url, timestamp } = postData;
    processedShortcodes.add(shortcode);

    const localImgName = `${shortcode}.jpg`;
    const localImgPath = path.join(MEDIA_DIR, localImgName);
    const localImgUrl = `/instagram/${localImgName}`;

    // Download image locally
    if (display_url) {
      await downloadMedia(display_url, localImgPath);
    }

    const { title, description, sentiment, yarn_type, category } = parsePostTitleAndDescription(caption, shortcode);

    if (existingMap.has(shortcode)) {
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

      if (display_url && existing.display_url !== display_url) {
        existing.display_url = display_url;
        changed = true;
      }

      if (video_url && existing.video_url !== video_url) {
        existing.video_url = video_url;
        changed = true;
      }

      if (!existing.local_image) {
        existing.local_image = localImgUrl;
        changed = true;
      }

      // Title, Description, Sentiment, Yarn, Category
      if (existing.title !== title || existing.description !== description || existing.sentiment !== sentiment || existing.yarn_type !== yarn_type || existing.category !== category) {
        existing.title = title;
        existing.description = description;
        existing.sentiment = sentiment;
        existing.yarn_type = yarn_type;
        existing.category = category;
        changed = true;
      }

      if (changed) {
        updatedPostsCount++;
      }

      mergedPosts.push(existing);
    } else {
      newPostsCount++;
      console.log(`✨ New post detected! Shortcode: ${shortcode}, Likes: ${likes}, Title: "${title}"`);

      const newPost = {
        shortcode,
        title,
        description,
        category,
        sentiment,
        yarn_type,
        is_video: is_video,
        display_url: display_url,
        video_url: video_url,
        caption,
        likes,
        comments,
        timestamp,
        local_image: localImgUrl
      };

      mergedPosts.push(newPost);
    }
  }

  // Retain any existing posts previously fetched or archived
  for (const post of existingPosts) {
    if (post.shortcode && !processedShortcodes.has(post.shortcode)) {
      const { title, description, sentiment, yarn_type, category } = parsePostTitleAndDescription(post.caption, post.shortcode);
      post.title = title;
      post.description = description;
      post.sentiment = post.sentiment || sentiment;
      post.yarn_type = post.yarn_type || yarn_type;
      post.category = post.category || category;
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
  console.log(`   • Total Account Posts:     ${totalAccountPosts}`);
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
