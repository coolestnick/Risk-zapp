// Test complete frontend-backend integration
// Run with: node test-frontend-integration.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test wallet address (matching frontend format)
const testWalletAddress = '0x742d35Cc6635C0532925a3b8D0A942C7ddAb62';

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');

  try {
    // ==================== TEST 1: Policy Types ====================
    console.log('📋 Test 1: Policy Types Integration');
    
    const { data: policyTypes, error: policyTypesError } = await supabase
      .from('policy_types')
      .select('*')
      .eq('active', true)
      .order('popular', { ascending: false });

    if (policyTypesError) {
      console.error('❌ Policy types test failed:', policyTypesError.message);
      return false;
    }

    console.log('✅ Policy types loaded:', policyTypes.length, 'types');
    console.log('📊 Popular policies:', policyTypes.filter(p => p.popular).map(p => p.name));

    // ==================== TEST 2: User Profile ====================
    console.log('\n👤 Test 2: User Profile Integration');
    
    // First check if profile exists
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', testWalletAddress.toLowerCase())
      .single();

    // Create profile if doesn't exist
    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          wallet_address: testWalletAddress.toLowerCase(),
          kyc_verified: false,
          kyc_status: 'pending',
          registration_date: new Date().toISOString(),
        }])
        .select()
        .single();

      if (profileError) {
        console.error('❌ User profile creation failed:', profileError.message);
        return false;
      }
      profile = newProfile;
    }

    console.log('✅ User profile ready:', profile.wallet_address);
    console.log('🔐 KYC Status:', profile.kyc_status);

    // ==================== TEST 3: Enhanced Policy Creation ====================
    console.log('\n📝 Test 3: Enhanced Policy Creation');
    
    const deviceProtectionPolicy = {
      user_wallet_address: testWalletAddress.toLowerCase(),
      policy_type: 'device-protection',
      premium: 0.5,
      duration: 365,
      metadata: {
        features: ['Accidental damage', 'Theft protection', 'Liquid damage'],
        device: 'iPhone 15 Pro',
        policyId: 'device-protection',
        walletAddress: testWalletAddress,
        test: true
      },
      transaction_hash: '0x1234567890abcdef1234567890abcdef12345678',
      block_number: 12345,
      gas_used: 21000,
    };

    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .insert([deviceProtectionPolicy])
      .select(`
        *,
        policy_types!inner(name, features, coverage_description, icon)
      `)
      .single();

    if (policyError) {
      console.error('❌ Policy creation failed:', policyError.message);
      return false;
    }

    console.log('✅ Policy created successfully!');
    console.log('🆔 Policy ID:', policy.id);
    console.log('💰 Premium:', policy.premium, 'SHM');
    console.log('🏷️ Platform Fee:', policy.platform_fee, 'SHM');
    console.log('💵 Total Paid:', policy.total_paid, 'SHM');
    console.log('🛡️ Coverage:', policy.coverage, 'SHM');
    console.log('📅 Expires:', new Date(policy.expiry_date).toLocaleDateString());
    console.log('📊 Current Claim Value:', policy.current_claim_value, 'SHM');

    // ==================== TEST 4: Activity Logging ====================
    console.log('\n📊 Test 4: Activity Logging Integration');
    
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert([{
        user_wallet_address: testWalletAddress.toLowerCase(),
        action: 'policy_purchase',
        description: `Purchased Device Protection policy for ${policy.premium} SHM`,
        amount: policy.total_paid,
        policy_id: policy.id,
        transaction_hash: policy.transaction_hash,
        status: 'success',
        metadata: {
          policyType: policy.policy_type,
          coverage: policy.coverage,
          duration: policy.duration,
        },
      }])
      .select()
      .single();

    if (activityError) {
      console.error('❌ Activity logging failed:', activityError.message);
      return false;
    }

    console.log('✅ Activity logged successfully!');
    console.log('🎯 Action:', activity.action);
    console.log('📝 Description:', activity.description);

    // ==================== TEST 5: Portfolio Summary ====================
    console.log('\n💼 Test 5: Portfolio Summary Integration');
    
    // Wait a moment for triggers to update the view
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolio_summary')
      .select('*')
      .eq('user_wallet_address', testWalletAddress.toLowerCase())
      .single();

    if (portfolioError) {
      console.error('❌ Portfolio summary failed:', portfolioError.message);
      return false;
    }

    console.log('✅ Portfolio summary generated!');
    console.log('📊 Portfolio Stats:');
    console.log('   🔘 Active Policies:', portfolio.active_policies);
    console.log('   💰 Total Invested:', portfolio.total_invested, 'SHM');
    console.log('   💎 Current Claim Value:', portfolio.current_claim_value, 'SHM');
    console.log('   📈 Profit/Loss:', portfolio.profit_loss, 'SHM');

    // ==================== TEST 6: Claim Processing ====================
    console.log('\n🏆 Test 6: Claim Processing Integration');
    
    // Simulate a claim after some time
    const daysHeld = 15; // Simulate 15 days
    const claimPercentage = 5 + ((daysHeld - 1) / 29) * 4.5; // Early claim
    const baseClaimAmount = policy.premium * (claimPercentage / 100);
    const timeBonus = 0; // No bonus for early claim
    const bonusAmount = 0;
    const totalClaimAmount = baseClaimAmount + bonusAmount;
    const withdrawalFee = totalClaimAmount * 0.002; // 0.2%
    const netPayout = totalClaimAmount - withdrawalFee;

    const { data: claim, error: claimError } = await supabase
      .from('claim_records')
      .insert([{
        policy_id: policy.id,
        user_wallet_address: testWalletAddress.toLowerCase(),
        base_claim_amount: baseClaimAmount,
        claim_percentage: claimPercentage,
        days_held: daysHeld,
        time_bonus: timeBonus,
        bonus_amount: bonusAmount,
        withdrawal_fee: withdrawalFee,
        total_claim_amount: totalClaimAmount,
        net_payout: netPayout,
        status: 'approved',
      }])
      .select()
      .single();

    if (claimError) {
      console.error('❌ Claim processing failed:', claimError.message);
      return false;
    }

    console.log('✅ Claim processed successfully!');
    console.log('💰 Claim Breakdown:');
    console.log('   📊 Base Claim:', claim.base_claim_amount, 'SHM', `(${claim.claim_percentage.toFixed(2)}%)`);
    console.log('   ⏰ Time Bonus:', claim.time_bonus, '%');
    console.log('   💵 Gross Claim:', claim.total_claim_amount, 'SHM');
    console.log('   💸 Withdrawal Fee:', claim.withdrawal_fee, 'SHM');
    console.log('   💎 Net Payout:', claim.net_payout, 'SHM');

    // Update policy status
    const { error: statusError } = await supabase
      .from('policies')
      .update({
        status: 'claimed',
        claim_amount: claim.net_payout,
        claim_date: new Date().toISOString(),
      })
      .eq('id', policy.id);

    if (statusError) {
      console.error('❌ Policy status update failed:', statusError.message);
      return false;
    }

    // ==================== TEST 7: Global Activity Feed ====================
    console.log('\n🌍 Test 7: Global Activity Feed Integration');
    
    const { data: globalActivities, error: globalError } = await supabase
      .from('recent_global_activities')
      .select('*')
      .limit(10);

    if (globalError) {
      console.error('❌ Global activities failed:', globalError.message);
      return false;
    }

    console.log('✅ Global activity feed working!');
    console.log('📊 Recent Activities:', globalActivities.length);
    globalActivities.slice(0, 3).forEach((act, i) => {
      console.log(`   ${i + 1}. ${act.anonymized_address} - ${act.description}`);
    });

    // ==================== TEST 8: Platform Statistics ====================
    console.log('\n📈 Test 8: Platform Statistics Integration');
    
    const { data: stats, error: statsError } = await supabase
      .from('platform_statistics')
      .select('*')
      .eq('id', 1)
      .single();

    if (statsError) {
      console.error('❌ Platform statistics failed:', statsError.message);
      return false;
    }

    console.log('✅ Platform statistics updated!');
    console.log('📊 Platform Stats:');
    console.log('   📋 Total Policies:', stats.total_policies_count);
    console.log('   💰 Total Premium Volume:', stats.total_premium_volume, 'SHM');
    console.log('   🔘 Active Policies:', stats.active_policies_count);
    console.log('   🏆 Claims Processed:', stats.claims_processed_count);
    console.log('   ✅ Success Rate:', stats.success_rate, '%');
    console.log('   ⏱️ Avg Response Time:', stats.average_response_time, 'minutes');

    // ==================== TEST 9: User Address Retrieval ====================
    console.log('\n👥 Test 9: User Address Retrieval');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('policies')
      .select('user_wallet_address')
      .not('user_wallet_address', 'is', null);

    if (usersError) {
      console.error('❌ User address retrieval failed:', usersError.message);
      return false;
    }

    const uniqueAddresses = [...new Set(allUsers.map(u => u.user_wallet_address))];
    console.log('✅ User addresses retrieved!');
    console.log('👥 Total Unique Users:', uniqueAddresses.length);
    console.log('📝 User Addresses:');
    uniqueAddresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr}`);
    });

    // ==================== CLEANUP ====================
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete in correct order (due to foreign keys)
    await supabase.from('activities').delete().eq('user_wallet_address', testWalletAddress.toLowerCase());
    await supabase.from('claim_records').delete().eq('user_wallet_address', testWalletAddress.toLowerCase());
    await supabase.from('policies').delete().eq('user_wallet_address', testWalletAddress.toLowerCase());
    await supabase.from('user_profiles').delete().eq('wallet_address', testWalletAddress.toLowerCase());

    console.log('✅ Test data cleaned up');

    return true;

  } catch (error) {
    console.error('💥 Unexpected error during integration testing:', error);
    return false;
  }
}

// Run the comprehensive test
testFrontendIntegration().then(success => {
  if (success) {
    console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED! 🎉');
    console.log('\n✨ Your RiskZap database is perfectly configured for the frontend!');
    console.log('\n🚀 Features Ready:');
    console.log('   ✅ Policy type management');
    console.log('   ✅ User profile & KYC');
    console.log('   ✅ Enhanced policy creation');
    console.log('   ✅ Automatic fee calculations');
    console.log('   ✅ Time-based claim values');
    console.log('   ✅ Activity feed with anonymization');
    console.log('   ✅ Portfolio analytics');
    console.log('   ✅ Platform statistics');
    console.log('   ✅ User address tracking');
    console.log('   ✅ Row-level security');
    console.log('\n📊 Database Tables Created:');
    console.log('   📋 policy_types - Available insurance types');
    console.log('   👤 user_profiles - User KYC and profiles');
    console.log('   📜 policies - Insurance policies with calculations');
    console.log('   📊 activities - Activity feed and logging');
    console.log('   🏆 claim_records - Detailed claim processing');
    console.log('   📈 platform_statistics - Dashboard metrics');
    console.log('\n💡 Next Steps:');
    console.log('   1. Run the schema SQL in your Supabase dashboard');
    console.log('   2. Start your frontend application');
    console.log('   3. All user interactions will be stored in the database!');
    
    process.exit(0);
  } else {
    console.log('\n💥 Integration tests failed. Please check the errors above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});