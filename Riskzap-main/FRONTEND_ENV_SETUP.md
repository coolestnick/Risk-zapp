# Frontend Environment Variables Setup

This document outlines all the environment variables needed for the RiskZap frontend deployment on Vercel.

## Backend API Configuration

The backend is deployed at: **https://risk-zapp-backend.vercel.app**

---

## Required Environment Variables

### 1. Backend API URL (CRITICAL)

```bash
VITE_API_BASE_URL=https://risk-zapp-backend.vercel.app
```

**Purpose:** Connects frontend to the backend API for all policy operations, tracking, and data fetching.

**Used in:**
- `src/services/trackingService.ts:1` - All API calls
- `src/services/api.ts:40` - API service configuration
- `src/components/PolicyCards.tsx:320,350` - Policy purchase and tracking

---

### 2. Shardeum Network Configuration

```bash
# Shardeum Liberty 1.X Chain ID
VITE_SHM_CHAIN_ID=8080

# SHM Token Decimals
VITE_SHM_TOKEN_DECIMALS=18
```

**Purpose:** Configure the blockchain network for Shardeum transactions.

**Used in:**
- `src/services/web3.ts:118-120` - Network validation
- `src/services/web3.ts:114-115` - Token calculations
- `src/contracts/PayFiInsurance.ts:42` - Chain configuration

---

### 3. Company Wallet Address (HARDCODED - No Environment Variable Needed)

**Hardcoded as:** `0x8a97f55b6D61faA30fB6b33D602dBB0714822D80`

**Purpose:** The wallet address that receives premium payments from policy purchases.

**Used in:**
- `src/services/web3.ts:147` - Hardcoded company wallet
- Fallback priority: localStorage → env variable → hardcoded

**Note:** No environment variable needed. The wallet is hardcoded in the source code. You can still override it via:
1. Admin Settings UI (saves to localStorage)
2. Environment variable `VITE_COMPANY_WALLET` (optional)

---

## Optional Environment Variables

### 4. SHM Token Contract Address (Optional)

```bash
VITE_SHM_TOKEN_ADDRESS=0xYourTokenContractAddress
```

**Purpose:** If using a custom ERC-20 token for payments instead of native SHM.

**Used in:**
- `src/services/web3.ts:112` - Token contract interaction

**Note:** Leave empty to use native SHM token.

---

### 5. Demo Mode (Optional)

```bash
VITE_DEMO_MODE=false
```

**Purpose:** Enable/disable demo mode for testing without real transactions.

**Used in:**
- `src/services/web3.ts:24` - Mock transaction handling

**Values:**
- `false` - Production mode (real transactions)
- `true` - Demo mode (mock transactions)

---

### 6. Supabase Configuration (Optional)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Purpose:** Additional analytics and activity feed storage (if using Supabase).

**Used in:**
- `src/lib/supabase.ts:4-5` - Supabase client initialization

**Note:** Only needed if you want to use Supabase for additional features.

---

## Complete .env File Template

Create a `.env` file in your frontend root directory:

```bash
# ============================================
# REQUIRED - Backend Configuration
# ============================================
VITE_API_BASE_URL=https://risk-zapp-backend.vercel.app

# ============================================
# REQUIRED - Shardeum Network
# ============================================
VITE_SHM_CHAIN_ID=8080
VITE_SHM_TOKEN_DECIMALS=18

# ============================================
# OPTIONAL - Company Wallet (Hardcoded in code)
# ============================================
# VITE_COMPANY_WALLET=0xYourCompanyWalletAddress
# Note: Company wallet is hardcoded as 0x8a97f55b6D61faA30fB6b33D602dBB0714822D80

# ============================================
# OPTIONAL - Custom Token
# ============================================
# VITE_SHM_TOKEN_ADDRESS=0xYourTokenContractAddress

# ============================================
# OPTIONAL - Demo Mode
# ============================================
VITE_DEMO_MODE=false

# ============================================
# OPTIONAL - Supabase (for analytics)
# ============================================
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Vercel Deployment Setup

### Step 1: Add Environment Variables

1. Go to **Vercel Dashboard**
2. Select your **frontend project** (e.g., `risk-zapp`)
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://risk-zapp-backend.vercel.app` | Production |
| `VITE_SHM_CHAIN_ID` | `8080` | Production |
| `VITE_SHM_TOKEN_DECIMALS` | `18` | Production |
| `VITE_COMPANY_WALLET` | `0xYour...Address` | Production |
| `VITE_DEMO_MODE` | `false` | Production |

### Step 2: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Select **Redeploy**
4. Check **Use existing Build Cache** (optional)
5. Click **Redeploy**

---

## Testing the Configuration

After deployment, test the connection:

### 1. Check Backend Health
```bash
curl https://risk-zapp-backend.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "production"
}
```

### 2. Test Policy Purchase Flow
1. Open your frontend: `https://risk-zapp.vercel.app`
2. Connect your wallet (MetaMask)
3. Try purchasing a policy
4. Check browser console for any API errors

### 3. Verify API Calls
Open browser DevTools → Network tab and check:
- All API calls go to `https://risk-zapp-backend.vercel.app`
- CORS errors are resolved
- Status codes are 200 or 201 for successful requests

---

## Troubleshooting

### Issue: CORS Errors
**Solution:** Backend CORS is already configured to allow all origins. If issues persist, verify:
- Backend is deployed and accessible
- `VITE_API_BASE_URL` is set correctly

### Issue: "Company wallet not configured"
**Solution:**
- Verify `VITE_COMPANY_WALLET` is set with a valid Ethereum address
- Address should start with `0x`

### Issue: Wrong network error
**Solution:**
- Ensure `VITE_SHM_CHAIN_ID=8080` is set
- User's MetaMask should be connected to Shardeum Liberty 1.X (Chain ID: 8080)

### Issue: API calls fail with 404
**Solution:**
- Verify `VITE_API_BASE_URL` doesn't have trailing slash
- Correct: `https://risk-zapp-backend.vercel.app`
- Wrong: `https://risk-zapp-backend.vercel.app/`

---

## Security Best Practices

1. **Never commit `.env` file to git**
   - Already included in `.gitignore`
   - Only use Vercel environment variables for production

2. **Use separate wallets**
   - Development: Use testnet wallets
   - Production: Use secure company wallet

3. **Monitor API usage**
   - Check Vercel Analytics for unusual traffic
   - Rate limiting is configured (100 requests per 15 minutes)

4. **Validate transactions**
   - Always verify transaction hashes on block explorer
   - Monitor company wallet for incoming payments

---

## Support & Documentation

- **Backend API Docs:** See `backend/API_DOCUMENTATION.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **GitHub Repository:** https://github.com/coolestnick/Risk-zapp

---

## Summary Checklist

Before deploying frontend to production:

- [ ] `VITE_API_BASE_URL` set to `https://risk-zapp-backend.vercel.app`
- [ ] `VITE_SHM_CHAIN_ID` set to `8080`
- [ ] `VITE_SHM_TOKEN_DECIMALS` set to `18`
- [ ] `VITE_COMPANY_WALLET` set to your company wallet address
- [ ] Backend is deployed and healthy
- [ ] MongoDB is connected
- [ ] Test policy purchase works end-to-end
- [ ] CORS errors are resolved
- [ ] Wallet connection works
- [ ] Transaction signatures work

---

**Last Updated:** 2025-09-30
**Backend URL:** https://risk-zapp-backend.vercel.app
**Frontend URL:** https://risk-zapp.vercel.app
