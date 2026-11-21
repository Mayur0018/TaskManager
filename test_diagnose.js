const https = require('https');

function request(options, body) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data.trim()
      }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  console.log('--- 1. Testing Preflight OPTIONS on Render backend ---');
  const preflight = await request({
    hostname: 'taskmanager-r1a4.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://frontend-mayur16.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  console.log('Preflight status:', preflight.status);
  console.log('Preflight allow-origin:', preflight.headers && preflight.headers['access-control-allow-origin']);

  console.log('\n--- 2. Testing POST on Render backend from Vercel Origin ---');
  const postRes = await request({
    hostname: 'taskmanager-r1a4.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Origin': 'https://frontend-mayur16.vercel.app',
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ email: 'test@example.com', password: 'password123' }));
  console.log('POST status:', postRes.status);
  console.log('POST allow-origin:', postRes.headers && postRes.headers['access-control-allow-origin']);
  console.log('POST response:', postRes.data);

  console.log('\n--- 3. Checking Vercel Frontend bundle for API URL ---');
  const vercelHtml = await request({
    hostname: 'frontend-mayur16.vercel.app',
    port: 443,
    path: '/login',
    method: 'GET'
  });
  console.log('Vercel HTML status:', vercelHtml.status);
  const match = vercelHtml.data && vercelHtml.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (match) {
    const assetPath = match[1];
    console.log('Found asset path on Vercel:', assetPath);
    const vercelJs = await request({
      hostname: 'frontend-mayur16.vercel.app',
      port: 443,
      path: assetPath,
      method: 'GET'
    });
    console.log('Contains taskmanager-r1a4.onrender.com?', vercelJs.data.includes('taskmanager-r1a4.onrender.com'));
    console.log('Contains localhost:5000?', vercelJs.data.includes('localhost:5000'));
    const index = vercelJs.data.indexOf('baseURL');
    if (index !== -1) {
      console.log('BaseURL snippet in bundle:', vercelJs.data.substring(index - 20, index + 80));
    }
  }
})();

