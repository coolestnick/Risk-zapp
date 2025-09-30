const API_BASE = 'http://localhost:3001';

const testPolicyTypes = [
    'device-protection',
    'event-coverage', 
    'travel-insurance',
    'freelancer-protection',
    'health-micro'
];

async function testAllPolicyTypes() {
    console.log('🧪 Testing All Policy Types...\n');

    for (const policyType of testPolicyTypes) {
        console.log(`Testing policy type: ${policyType}`);
        
        try {
            const policyData = {
                walletAddress: '0xFd3fBa510A135B5DE354B1d4b174208c343aaD42',
                policyName: `Test ${policyType} Policy`,
                policyType: policyType,
                coverageAmount: 5000,
                premiumAmount: 250,
                platformFee: 12.5,
                totalPaid: 262.5,
                transactionHash: `0xtest${policyType}${Math.random().toString(16).substring(2)}${'0'.repeat(40)}`.substring(0, 66),
                tokenSymbol: 'SHM',
                metadata: {
                    testPolicyType: policyType,
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
                console.log(`✅ ${policyType}: SUCCESS - ${data.policy.policyId}`);
            } else {
                console.log(`❌ ${policyType}: FAILED - ${data.error}`);
            }
        } catch (error) {
            console.log(`💥 ${policyType}: ERROR - ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }

    // Final status check
    console.log('📊 Final Status Check:');
    try {
        const statusResponse = await fetch(`${API_BASE}/api/policies/user/0xFd3fBa510A135B5DE354B1d4b174208c343aaD42/status`);
        const statusData = await statusResponse.json();
        
        console.log(`Total Policies: ${statusData.totalPolicies}`);
        console.log(`Active Policies: ${statusData.activePolicies}`);
        console.log(`Has Purchased: ${statusData.hasPurchased}`);
        console.log(`Total Spent: ${statusData.totalSpent}`);
        
        console.log('\nPolicies:');
        statusData.policies.forEach(policy => {
            console.log(`- ${policy.policyName} (${policy.policyId})`);
        });
    } catch (error) {
        console.error('Error checking final status:', error);
    }
}

testAllPolicyTypes().then(() => {
    console.log('\n🎉 Policy type testing completed!');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
});