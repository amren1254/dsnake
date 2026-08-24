import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Testing Public Navigation and /admin Route Protection...');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

// 1. Inspect index.html
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

// Check desktop nav item
assert(
  html.includes('id="navItemAdmin"') && html.includes('style="display: none;"'),
  'Desktop Creator Studio nav item has display:none by default in index.html'
);

// Check mobile nav item
assert(
  html.includes('id="mobileNavItemAdmin"') && html.includes('style="display: none;"'),
  'Mobile Creator Dashboard nav item has display:none by default in index.html'
);

// Check footer nav
assert(
  !html.includes('onclick="app.navigateTo(\'admin\')">Creator Dashboard</a>'),
  'Creator Dashboard is removed from the public footer navigation'
);

// 2. Inspect js/app.js logic
const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf-8');

assert(
  appJs.includes("pathname === 'admin'") || appJs.includes("rawPath === 'admin'"),
  'app.js handles pathname /admin directly'
);

assert(
  appJs.includes('updateAdminNavVisibility'),
  'app.js includes updateAdminNavVisibility method for dynamic display toggling'
);

assert(
  appJs.includes("window.addEventListener('ooniverse_store_auth'"),
  'app.js listens for auth changes to dynamically update tab visibility'
);

console.log('\n🎉 ALL PUBLIC VIEW & /admin ROUTE PROTECTION TESTS PASSED SUCCESSFULLY!');
