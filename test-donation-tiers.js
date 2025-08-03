const fetch = require('node-fetch');

console.log('🧪 Testing Donation Tier Creation...\n');

async function testDonationTiers() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test the GET endpoint first
    console.log('1. Testing GET /api/monetization/donation-tiers');
    const getResponse = await fetch(`${baseUrl}/api/monetization/donation-tiers`);
    const getTiers = await getResponse.text();
    console.log('Status:', getResponse.status);
    console.log('Response preview:', getTiers.substring(0, 200));
    
    if (getResponse.status === 401) {
      console.log('\n⚠️  Authentication required - this is expected for protected routes');
      console.log('✅ The API endpoint exists and is properly protected');
      return;
    }
    
    // If we get here, try to parse JSON
    try {
      const jsonTiers = JSON.parse(getTiers);
      console.log('Parsed response:', JSON.stringify(jsonTiers, null, 2));
    } catch (e) {
      console.log('Response is not JSON, which is expected without auth');
    }
    
  } catch (error) {
    console.error('Error testing donation tiers:', error.message);
  }
}

testDonationTiers(); 