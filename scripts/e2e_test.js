/**
 * AUTOMATED END-TO-END VERIFICATION SUITE FOR OONIVERSE
 * Verifies all links, static assets, images, API contracts, and user workflows
 */

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting Ooniverse E2E Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Main HTML & Static Assets ---
  console.log('1. Verifying HTML & Core CSS/JS Bundles...');
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Homepage HTTP status is 200 (Got ${res.status})`);
    const html = await res.text();
    assert(html.includes('Ooniverse'), 'Homepage contains "Ooniverse" brand');
    assert(html.includes('Artisan Crochet Portfolio'), 'Homepage contains "Artisan Crochet Portfolio"');
    assert(html.includes('Shop by Sentiment'), 'Homepage contains Hunar-inspired sentiment filtering');
    assert(!html.includes('From $36'), 'Homepage does NOT contain old "$36" price');
    assert(!html.includes('Estimate Breakdown'), 'Customizer does NOT contain "Estimate Breakdown"');
  } catch (err) {
    assert(false, `Homepage fetch failed: ${err.message}`);
  }

  // --- TEST 2: Verify All 12 Instagram Images ---
  console.log('\n2. Verifying All 12 Instagram Images...');
  const imageFilenames = [
    'DWD3OiYCWBG.jpg', 'DcWMRVLJcI1.jpg', 'DcMQNKvzau5.jpg', 'DcRFjycJxe8.jpg',
    'DcOhYSXJWtt.jpg', 'DcITdLbpduk.jpg', 'DcIQe1EJCiZ.jpg', 'DZkN5djpgpY.jpg',
    'DYKWz-MJyqx.jpg', 'DX8KlieJ3xs.jpg', 'DXyQp0EJUvx.jpg', 'DXwOHr3pCCu.jpg'
  ];

  for (const filename of imageFilenames) {
    try {
      const res = await fetch(`${BASE_URL}/instagram/${filename}`);
      assert(res.status === 200 && res.headers.get('content-type')?.includes('image'), `Image /instagram/${filename} loaded successfully (HTTP 200)`);
    } catch (e) {
      assert(false, `Image /instagram/${filename} failed to load: ${e.message}`);
    }
  }

  // --- TEST 3: Creations API & Category / Occasion Filtering ---
  console.log('\n3. Verifying Creations API & Category / Occasion Filtering...');
  try {
    const res = await fetch(`${BASE_URL}/api/creations`);
    assert(res.status === 200, 'GET /api/creations returns 200');
    const creations = await res.json();
    assert(Array.isArray(creations) && creations.length >= 12, `Creations array has ${creations.length} items (expected >= 12)`);

    // Category tests
    const categories = ['bouquets', 'wearables', 'bags', 'amigurumi', 'keychains'];
    for (const cat of categories) {
      const catRes = await fetch(`${BASE_URL}/api/creations?category=${cat}`);
      const catItems = await catRes.json();
      assert(catItems.length > 0 && catItems.every(i => i.category === cat), `Category "${cat}" returns ${catItems.length} matching items`);
    }

    // Occasion sentiment tests
    const occasionRes = await fetch(`${BASE_URL}/api/creations?occasion=love`);
    const occasionItems = await occasionRes.json();
    assert(occasionItems.length > 0 && occasionItems.every(i => i.occasion === 'love'), `Occasion "love" returns ${occasionItems.length} romantic sentiment items`);
  } catch (err) {
    assert(false, `Creations API error: ${err.message}`);
  }

  // --- TEST 4: Creator Authentication ---
  console.log('\n4. Verifying Creator Studio Authentication...');
  let authToken = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'ooniverse_creator', password: 'Ooniverse@2026!' })
    });
    assert(res.status === 200, 'POST /api/auth/login returns 200');
    const data = await res.json();
    assert(!!data.token, 'Auth returns valid JWT token');
    assert(data.creator.email === 'ooniverse2404@gmail.com', `Auth returns creator email (${data.creator.email})`);
    authToken = data.token;
  } catch (err) {
    assert(false, `Authentication failed: ${err.message}`);
  }

  // --- TEST 5: Custom Order Submission Workflow ---
  console.log('\n5. Verifying Custom Order Submission...');
  let testOrderId = null;
  try {
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Deepika Roy',
        customerEmail: 'deepika.roy@example.com',
        customerPhone: '+91 98451 23456',
        shippingAddress: 'Flat 101, Palm Meadows, Whitefield, Bengaluru, Karnataka, 560066',
        title: 'Bespoke Sunflower & Rose Eternity Wrap',
        category: 'bouquets',
        description: 'Pastel yellow sunflowers with cream baby breath stems and satin bow.',
        yarnType: 'cotton',
        yarnLabel: '100% Milk Cotton',
        palette: [{ name: 'Honey Mustard', hex: '#E9C46A' }, { name: 'Vanilla White', hex: '#FDFBF7' }],
        size: 'standard',
        sizeLabel: 'Regular / Medium (15-22cm)',
        addons: ['gift_wrap', 'wooden_tag'],
        totalPrice: 0
      })
    });

    assert(orderRes.status === 201, 'POST /api/orders returns 201 Created');
    const orderData = await orderRes.json();
    testOrderId = orderData.order.id;
    assert(!!testOrderId && testOrderId.startsWith('#OON-2026-'), `Created Order ID: ${testOrderId}`);
  } catch (err) {
    assert(false, `Order creation failed: ${err.message}`);
  }

  // --- TEST 6: Creator Quotation Generator & Dispatch ---
  console.log('\n6. Verifying Creator Quotation Generator...');
  try {
    const quoteRes = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(testOrderId)}/quote`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        craftFee: 650,
        materialFee: 180,
        courierFee: 90,
        totalQuote: 920,
        quoteNotes: 'Includes luxury kraft gift box, dried floral sprig, and personalized wooden tag.',
        upiId: 'ooniverse@upi'
      })
    });

    assert(quoteRes.status === 200, `PUT /api/orders/${testOrderId}/quote returns 200`);
    const quoteData = await quoteRes.json();
    assert(quoteData.order.quoted_price === 920, `Order quoted_price saved as ₹${quoteData.order.quoted_price}`);
    assert(quoteData.order.status === 'pattern_prepared', `Order status updated to "${quoteData.order.status}"`);
  } catch (err) {
    assert(false, `Quotation update failed: ${err.message}`);
  }

  // --- TEST 7: Customer Order Tracking Portal ---
  console.log('\n7. Verifying Customer Order Tracker...');
  try {
    const trackRes = await fetch(`${BASE_URL}/api/orders/track/${encodeURIComponent(testOrderId)}`);
    assert(trackRes.status === 200, `GET /api/orders/track/${testOrderId} returns 200`);
    const trackData = await trackRes.json();
    assert(trackData.customerName === 'Deepika Roy', `Customer name matches (${trackData.customerName})`);
    assert(trackData.quotedPrice === 920, `Quoted price is ₹${trackData.quotedPrice}`);
    assert(trackData.quoteNotes.includes('luxury kraft gift box'), 'Quote notes visible in tracking');
  } catch (err) {
    assert(false, `Order tracking lookup failed: ${err.message}`);
  }

  // --- TEST 8: Creator Publishing New Creation Post ---
  console.log('\n8. Verifying Post Publishing in Creator Studio...');
  try {
    const postRes = await fetch(`${BASE_URL}/api/creations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Pastel Daisy Bag Charm',
        category: 'keychains',
        image: '/instagram/DcOhYSXJWtt.jpg',
        caption: 'Handcrafted pastel daisy charm stitched with love! DM for custom colors. 🌼',
        yarnType: 'Organic Cotton',
        tag: '🌸 New Arrival'
      })
    });

    assert(postRes.status === 201, 'POST /api/creations returns 201 Created');
    const newPost = await postRes.json();
    assert(newPost.title === 'Pastel Daisy Bag Charm', `Published post title matches (${newPost.title})`);

    // Verify it appears in public feed
    const feedRes = await fetch(`${BASE_URL}/api/creations`);
    const feed = await feedRes.json();
    assert(feed.some(p => p.title === 'Pastel Daisy Bag Charm'), 'Newly published post appears in public portfolio feed');
  } catch (err) {
    assert(false, `Post publishing failed: ${err.message}`);
  }

  // --- TEST 9: Analytics & Stats Pipeline ---
  console.log('\n9. Verifying Studio Pipeline Stats...');
  try {
    const statsRes = await fetch(`${BASE_URL}/api/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert(statsRes.status === 200, 'GET /api/stats returns 200');
    const stats = await statsRes.json();
    assert(stats.totalOrders > 0, `Stats totalOrders = ${stats.totalOrders}`);
    assert(stats.revenue >= 920, `Pipeline quoted revenue = ₹${stats.revenue}`);
  } catch (err) {
    assert(false, `Stats API failed: ${err.message}`);
  }

  // --- SUMMARY ---
  console.log('\n=========================================');
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
