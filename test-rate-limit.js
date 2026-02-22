const http = require('http');

async function makeRequest(requestNum) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/test',
            method: 'GET'
        };

        const startTime = Date.now();
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const endTime = Date.now();
                resolve({
                    requestNum,
                    status: res.statusCode,
                    remaining: res.headers['ratelimit-remaining'],
                    limit: res.headers['ratelimit-limit'],
                    reset: res.headers['ratelimit-reset'],
                    time: endTime - startTime
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                requestNum,
                status: 500,
                error: error.message
            });
        });

        req.end();
    });
}

async function testRateLimiting() {
    console.log('🚀 Testing Rate Limiting');
    console.log('========================\n');

    const results = [];
    
    // Make 110 requests
    for (let i = 1; i <= 110; i++) {
        const result = await makeRequest(i);
        results.push(result);
        
        // Show progress every 10 requests
        if (i % 10 === 0 || i === 110) {
            console.log(`Request ${i}: Status=${result.status}, Remaining=${result.remaining || 'N/A'}`);
        }
        
        // Small delay to make output readable
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Analyze results
    console.log('\n📊 Results Summary:');
    console.log('==================');
    
    const successful = results.filter(r => r.status === 200).length;
    const rateLimited = results.filter(r => r.status === 429).length;
    
    console.log(`✅ Successful requests: ${successful}`);
    console.log(`⏱️  Rate limited requests: ${rateLimited}`);
    console.log(`📈 Total requests: ${results.length}`);
    
    // Show when rate limiting started
    const first429 = results.find(r => r.status === 429);
    if (first429) {
        console.log(`\n🔴 Rate limiting started at request #${first429.requestNum}`);
    }
    
    // Show remaining count progression
    console.log('\n📉 Remaining count progression:');
    const remainingValues = results
        .filter(r => r.remaining)
        .map(r => `${r.requestNum}:${r.remaining}`)
        .slice(0, 10); // Show first 10
    
    console.log('   ' + remainingValues.join(' → '));
}

testRateLimiting();