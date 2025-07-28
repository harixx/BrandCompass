import axios from 'axios';

async function testSearch() {
  try {
    // Test 1: Basic Apple search on CNN
    console.log('=== Testing Apple search on CNN ===');
    const response1 = await axios.post('https://google.serper.dev/search', {
      q: 'site:cnn.com "Apple"',
      num: 5
    }, {
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Results found:', response1.data.organic?.length || 0);
    if (response1.data.organic) {
      response1.data.organic.slice(0, 3).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   Snippet: ${result.snippet}`);
        console.log(`   URL: ${result.link}\n`);
      });
    }

    // Test 2: Microsoft search on TechCrunch
    console.log('=== Testing Microsoft search on TechCrunch ===');
    const response2 = await axios.post('https://google.serper.dev/search', {
      q: 'site:techcrunch.com "Microsoft"',
      num: 5
    }, {
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Results found:', response2.data.organic?.length || 0);
    if (response2.data.organic) {
      response2.data.organic.slice(0, 2).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   Snippet: ${result.snippet}`);
        console.log(`   URL: ${result.link}\n`);
      });
    }

    // Test 3: Non-existent brand
    console.log('=== Testing non-existent brand "CryptoCracker" ===');
    const response3 = await axios.post('https://google.serper.dev/search', {
      q: 'site:cnn.com "CryptoCracker"',
      num: 5
    }, {
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Results found:', response3.data.organic?.length || 0);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSearch();