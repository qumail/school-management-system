// tests/manual-schools-test.js
const request = require('supertest');
const app = require('../app');

async function testSchoolsEndpoint() {
  console.log('🔍 Manual Schools API Test');
  console.log('=========================\n');

  // Test 1: Check if endpoint exists (should return 401, not 404)
  console.log('Test 1: Access without token');
  const res1 = await request(app).get('/api/schools');
  console.log(`Status: ${res1.statusCode}`);
  console.log(`Body:`, res1.body);
  console.log('✅ Endpoint exists!' + (res1.statusCode !== 404 ? ' (good)' : ' (bad)'));
  
  // Test 2: Check all registered routes
  console.log('\nTest 2: All registered routes:');
  const routes = [];
  if (app._router && app._router.stack) {
    app._router.stack.forEach((layer) => {
      if (layer.route) {
        routes.push(`${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push(`${Object.keys(handler.route.methods).join(',')} ${handler.route.path}`);
          }
        });
      }
    });
  }
  
  routes.sort().forEach(route => console.log(`  ${route}`));
  
  // Test 3: Check specifically for school routes
  console.log('\nTest 3: School routes:');
  const schoolRoutes = routes.filter(r => r.includes('/api/schools'));
  if (schoolRoutes.length > 0) {
    schoolRoutes.forEach(route => console.log(`  ✅ ${route}`));
  } else {
    console.log('  ❌ No school routes found!');
  }
}

testSchoolsEndpoint();