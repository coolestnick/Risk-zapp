// Test database connection and functionality
// Run with: node test-database.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test 1: Basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('policies')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Database connection failed:', tablesError.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');

    // Test 2: Insert sample policy
    console.log('\n📝 Testing policy insertion...');
    const testWallet = '0x742d35Cc6635C0532925a3b8D0A942C7ddAb62';
    
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .insert([
        {
          user_wallet_address: testWallet,
          policy_type: 'Device Protection',
          premium: 0.5,
          coverage: 500,
          duration: 30,
          metadata: {
            features: ['theft', 'damage'],
            device: 'iPhone 15',
            test: true
          }
        }
      ])
      .select()
      .single();

    if (policyError) {
      console.error('❌ Policy insertion failed:', policyError.message);
      return false;
    }

    console.log('✅ Policy inserted successfully!');
    console.log('📄 Policy ID:', policy.id);

    // Test 3: Insert sample activity
    console.log('\n📊 Testing activity logging...');
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert([
        {
          user_wallet_address: testWallet,
          action: 'policy_purchase',
          description: 'Test policy purchase for database verification',
          amount: 0.5,
          policy_id: policy.id,
          transaction_hash: '0x1234567890abcdef'
        }
      ])
      .select()
      .single();

    if (activityError) {
      console.error('❌ Activity insertion failed:', activityError.message);
      return false;
    }

    console.log('✅ Activity logged successfully!');
    console.log('📊 Activity ID:', activity.id);

    // Test 4: Query user policies
    console.log('\n🔍 Testing policy retrieval...');
    const { data: userPolicies, error: queryError } = await supabase
      .from('policies')
      .select('*')
      .eq('user_wallet_address', testWallet);

    if (queryError) {
      console.error('❌ Policy query failed:', queryError.message);
      return false;
    }

    console.log('✅ Policy query successful!');
    console.log('📋 Found', userPolicies.length, 'policies for user');

    // Test 5: Query activities
    console.log('\n📈 Testing activity feed...');
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_wallet_address', testWallet)
      .order('timestamp', { ascending: false });

    if (activitiesError) {
      console.error('❌ Activities query failed:', activitiesError.message);
      return false;
    }

    console.log('✅ Activities query successful!');
    console.log('📊 Found', activities.length, 'activities for user');

    // Test 6: Test portfolio summary view
    console.log('\n💼 Testing portfolio summary...');
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolio_summary')
      .select('*')
      .eq('user_wallet_address', testWallet);

    if (portfolioError) {
      console.error('❌ Portfolio summary failed:', portfolioError.message);
      return false;
    }

    console.log('✅ Portfolio summary successful!');
    if (portfolio.length > 0) {
      console.log('💰 Portfolio data:', {
        activePolicies: portfolio[0].active_policies,
        totalInvested: portfolio[0].total_invested,
        totalClaimed: portfolio[0].total_claimed
      });
    }

    // Cleanup: Remove test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('activities').delete().eq('user_wallet_address', testWallet);
    await supabase.from('policies').delete().eq('user_wallet_address', testWallet);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All database tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Policy creation working');
    console.log('   ✅ Activity logging working');
    console.log('   ✅ Data queries working');
    console.log('   ✅ Portfolio views working');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testDatabase().then(success => {
  if (success) {
    console.log('\n🚀 Your RiskZap backend is ready to use!');
    process.exit(0);
  } else {
    console.log('\n💥 Database setup needs attention. Please check the errors above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});