const API_BASE = 'http://localhost:3001';

async function testPolicyAPI() {
    console.log('🧪 Testing Policy API...\n');

    // Test 1: Check initial status
    console.log('1. Testing initial policy status...');
    try {
        const response = await fetch(`${API_BASE}/api/policies/user/0x1234567890123456789012345678901234567890/has-purchased`);
        const data = await response.json();
        console.log('✅ Initial status:', data);
    } catch (error) {
        console.error('❌ Initial status error:', error.message);
    }

    // Test 2: Create a test policy
    console.log('\n2. Testing policy creation...');
    try {
        const policyData = {
            walletAddress: '0x1234567890123456789012345678901234567890',
            policyName: 'Test Health Insurance',
            policyType: 'health-micro',
            coverageAmount: 5000,
            premiumAmount: 250,
            platformFee: 12.5,
            totalPaid: 262.5,
            transactionHash: '0xtest' + Math.random().toString(16).substring(2) + '0'.repeat(60),
            tokenSymbol: 'SHM',
            metadata: {
                testPurchase: true,
                timestamp: new Date().toISOString()
            }
        };

        const response = await fetch(`${API_BASE}/api/policies/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(policyData)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Policy created successfully:', data);
        } else {
            console.error('❌ Policy creation failed:', data);
            return;
        }

        // Test 3: Check status after creation
        console.log('\n3. Testing status after policy creation...');
        const statusResponse = await fetch(`${API_BASE}/api/policies/user/0x1234567890123456789012345678901234567890/has-purchased`);
        const statusData = await statusResponse.json();
        console.log('✅ Status after purchase:', statusData);

        // Test 4: Get full policy status
        console.log('\n4. Testing full policy status...');
        const fullStatusResponse = await fetch(`${API_BASE}/api/policies/user/0x1234567890123456789012345678901234567890/status`);
        const fullStatusData = await fullStatusResponse.json();
        console.log('✅ Full policy status:', fullStatusData);

    } catch (error) {
        console.error('❌ Policy creation error:', error.message);
    }
}

// Run the test
testPolicyAPI().then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});