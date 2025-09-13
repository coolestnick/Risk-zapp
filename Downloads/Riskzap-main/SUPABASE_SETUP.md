# RiskZap Supabase Backend Setup Guide

## Overview
This guide will help you set up a complete Supabase backend for your RiskZap decentralized insurance platform.

## Prerequisites
- Supabase account (free tier works fine)
- Node.js installed for testing
- The Supabase credentials you provided

## Step 1: Environment Setup ✅ 
**Already completed!** Your `.env` file has been updated with:
- `VITE_SUPABASE_URL=https://fmmiqlflfguqimxejeyf.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOi...` (your anon key)

## Step 2: Create Database Schema

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Navigate to your project: `fmmiqlflfguqimxejeyf`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the sidebar
   - Click "New Query"

3. **Run the Schema**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

This will create:
- 📋 **policies** table - Store user insurance policies
- 📊 **activities** table - Store user activity feed
- 🏆 **claim_records** table - Store insurance claims
- 🔒 **Row Level Security** - Secure data access
- 📈 **Views** - Portfolio summaries and analytics
- 🔍 **Indexes** - Optimized database performance

## Step 3: Test Your Setup

1. **Install dependencies** (if not already installed):
```bash
npm install @supabase/supabase-js dotenv
```

2. **Run the test script**:
```bash
node test-database.js
```

This will:
- ✅ Test database connection
- ✅ Create sample policies and activities  
- ✅ Test all CRUD operations
- ✅ Verify security policies
- ✅ Clean up test data

## Step 4: Update Frontend Configuration

The frontend is already configured to use your Supabase database! The app will now:

1. **Store policies** in Supabase instead of localStorage
2. **Log activities** to the database for the activity feed
3. **Track claims** with proper analytics
4. **Sync across devices** for the same wallet address

## Database Schema Overview

### Tables Created:

#### `policies`
- Stores insurance policies purchased by users
- Tracks status (active/expired/claimed)
- Records premium amounts and coverage details

#### `activities` 
- Global activity feed for all user actions
- Policy purchases, claims, payments
- Includes transaction hashes for blockchain verification

#### `claim_records`
- Detailed claim processing records
- Time-based bonus calculations
- Claim approval workflow

### Security Features:

- **Row Level Security (RLS)** - Users only see their own data
- **Wallet-based authentication** - Uses wallet addresses as user IDs
- **Anonymous public access** - For activity feeds and analytics
- **Data validation** - Proper constraints and checks

## Step 5: Monitor Your Backend

### Supabase Dashboard Features:
- **Table Editor** - View and edit data directly
- **SQL Editor** - Run custom queries
- **API** - Auto-generated REST and GraphQL APIs  
- **Auth** - User management (if needed later)
- **Storage** - File uploads (for claim documents)
- **Edge Functions** - Serverless functions (for advanced features)

### Useful Queries:

**Get all users who have interacted:**
```sql
SELECT DISTINCT user_wallet_address, COUNT(*) as total_policies
FROM policies 
GROUP BY user_wallet_address 
ORDER BY total_policies DESC;
```

**Activity feed:**
```sql
SELECT * FROM recent_global_activities LIMIT 50;
```

**Portfolio analytics:**
```sql
SELECT * FROM user_portfolio_summary 
WHERE active_policies > 0;
```

## Step 6: What You Get

✅ **Complete Backend API** - All CRUD operations for policies, claims, activities
✅ **Real-time Data** - Supabase provides real-time subscriptions  
✅ **Scalable Database** - PostgreSQL with automatic scaling
✅ **Security** - Row-level security and wallet-based access
✅ **Analytics** - Built-in views for portfolio and user analytics
✅ **Global Activity Feed** - Public activity feed for community engagement
✅ **Cross-device Sync** - Data persists across browsers and devices

## Troubleshooting

### Common Issues:

1. **Environment variables not loading**
   - Make sure `.env` is in the root directory
   - Restart your dev server after updating `.env`

2. **Database connection fails** 
   - Verify your Supabase URL and key
   - Check if your Supabase project is active

3. **RLS policies blocking access**
   - RLS uses wallet addresses - make sure they match exactly
   - Check Supabase logs for policy violations

4. **Schema creation fails**
   - Run the SQL script in smaller chunks
   - Check for syntax errors in the SQL editor

### Get Help:
- Check Supabase Dashboard logs
- Use the SQL Editor to debug queries
- Test individual components with `test-database.js`

## Next Steps

Your RiskZap backend is now ready! The application will automatically:
- Store new policies in Supabase
- Log all user activities  
- Track claims and payouts
- Provide portfolio analytics
- Enable cross-device data access

**Your users' wallet addresses and all their interactions will now be permanently stored and accessible through the Supabase dashboard!** 🎉