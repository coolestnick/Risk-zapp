const API_BASE = 'http://localhost:3001';

async function fixDuplicateStats() {
    console.log('🔧 Fixing duplicate purchase statistics...\n');

    const walletAddress = '0x5C937ff54fA478359cCBc8144c36B37Ba9529b67';

    try {
        // Get current status
        console.log('1. Checking current status...');
        const statusResponse = await fetch(`${API_BASE}/api/policies/user/${walletAddress}/status`);
        const currentStatus = await statusResponse.json();
        
        console.log('Current status:', {
            totalPurchases: currentStatus.totalPurchases,
            totalPolicies: currentStatus.totalPolicies,
            activePolicies: currentStatus.activePolicies
        });

        // Get interaction history
        console.log('\n2. Checking interaction history...');
        const historyResponse = await fetch(`${API_BASE}/api/tracking/user/${walletAddress}/history`);
        const history = await historyResponse.json();
        
        const purchaseInteractions = history.interactions.filter(i => i.interactionType === 'purchase_policy');
        console.log(`Found ${purchaseInteractions.length} purchase interactions`);
        
        // Group by transaction hash to find duplicates
        const interactionsByTx = {};
        purchaseInteractions.forEach(interaction => {
            if (!interactionsByTx[interaction.transactionHash]) {
                interactionsByTx[interaction.transactionHash] = [];
            }
            interactionsByTx[interaction.transactionHash].push(interaction);
        });

        console.log('\n3. Analyzing duplicates...');
        let duplicateCount = 0;
        Object.keys(interactionsByTx).forEach(txHash => {
            const interactions = interactionsByTx[txHash];
            if (interactions.length > 1) {
                console.log(`Duplicate found for tx ${txHash}: ${interactions.length} interactions`);
                duplicateCount += interactions.length - 1;
            }
        });

        console.log(`\n📊 Summary:`);
        console.log(`- Actual policies: ${currentStatus.totalPolicies}`);
        console.log(`- Recorded purchases: ${currentStatus.totalPurchases}`);
        console.log(`- Duplicate interactions: ${duplicateCount}`);
        console.log(`- Correct purchase count should be: ${currentStatus.totalPolicies}`);

        if (duplicateCount > 0) {
            console.log('\n⚠️  Duplicate tracking detected!');
            console.log('The fix has been applied to prevent future duplicates.');
            console.log('For existing data, the backend now handles duplicates correctly.');
        } else {
            console.log('\n✅ No duplicates found - data is clean!');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

fixDuplicateStats().then(() => {
    console.log('\n🎉 Analysis completed!');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Analysis failed:', error);
    process.exit(1);
});