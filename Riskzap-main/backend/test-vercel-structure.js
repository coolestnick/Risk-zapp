import { connectToDatabase } from './lib/db.js';

async function testVercelStructure() {
    console.log('🧪 Testing Vercel Backend Structure...\n');

    try {
        // Test 1: Database Connection
        console.log('1. Testing database connection...');
        await connectToDatabase();
        console.log('✅ Database connection successful');

        // Test 2: Import Models
        console.log('\n2. Testing model imports...');
        const { default: Policy } = await import('./src/models/Policy.js');
        const { default: User } = await import('./src/models/User.js');
        const { default: UserInteraction } = await import('./src/models/UserInteraction.js');
        console.log('✅ All models imported successfully');

        // Test 3: Test a simple query
        console.log('\n3. Testing database query...');
        const policyCount = await Policy.countDocuments();
        const userCount = await User.countDocuments();
        console.log(`✅ Database queries successful: ${policyCount} policies, ${userCount} users`);

        console.log('\n🎉 Vercel structure test completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: vercel dev (to test locally)');
        console.log('2. Run: vercel --prod (to deploy)');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

testVercelStructure().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('💥 Structure test failed:', error);
    process.exit(1);
});