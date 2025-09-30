# 🚀 RiskZap Backend API Documentation

**Base URL:** `https://risk-zapp-fn3s.vercel.app`

**Last Updated:** September 13, 2025

---

## 📋 Table of Contents

1. [Authentication & CORS](#authentication--cors)
2. [Health & System](#health--system)
3. [Policy Management](#policy-management)
4. [User Data](#user-data)
5. [Tracking & Analytics](#tracking--analytics)
6. [Debug & Development](#debug--development)
7. [Error Handling](#error-handling)
8. [Environment Variables](#environment-variables)

---

## 🔐 Authentication & CORS

- **Authentication:** No authentication required (public API)
- **CORS:** Enabled for all origins (`*`)
- **Rate Limiting:** Currently disabled for serverless compatibility
- **Content-Type:** `application/json` for POST requests

---

## 🏥 Health & System

### GET `/api/health`

**Description:** Check API health and database connectivity

**Method:** `GET`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-13T17:48:13.697Z",
  "environment": "development",
  "database": "connected",
  "vercel": true
}
```

**cURL Example:**
```bash
curl -X GET https://risk-zapp-fn3s.vercel.app/api/health
```

---

## 📋 Policy Management

### POST `/api/policies/purchase`

**Description:** Create a new policy purchase record

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "walletAddress": "0x5C937ff54fA478359cCBc8144c36B37Ba9529b67",
  "policyType": "travel-insurance",
  "policyName": "Micro Travel",
  "coverageAmount": 30,
  "premiumAmount": 2,
  "platformFee": 0.1,
  "totalPaid": 2.1,
  "tokenSymbol": "SHM",
  "transactionHash": "0x5c94fde7a7a8cdc3f0d6c327a8cf43d40cd51db18a6e84b5267db243dc52e472",
  "blockNumber": 12345678,
  "expiryDate": "2025-12-31T23:59:59.000Z",
  "metadata": {
    "features": ["Trip interruption", "Baggage loss"],
    "duration": "1-7 days"
  },
  "contractAddress": "0x055682a1a8fa88ed10a56724d29bcd44215e04d5"
}
```

**Required Fields:**
- `walletAddress` (string)
- `policyName` (string)
- `coverageAmount` (number)
- `premiumAmount` (number)
- `totalPaid` (number)
- `transactionHash` (string)

**Optional Fields:**
- `policyType` (default: "basic")
- `platformFee` (default: 0)
- `tokenSymbol` (default: "SHM")
- `blockNumber` (number)
- `expiryDate` (ISO date string)
- `metadata` (object)
- `contractAddress` (string)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Policy purchased successfully",
  "policy": {
    "policyId": "POL_1757775109614_W5ZGOU",
    "transactionHash": "0x5c94fde7a7a8cdc3f0d6c327a8cf43d40cd51db18a6e84b5267db243dc52e472",
    "status": "active",
    "purchaseDate": "2025-09-13T14:51:49.618Z"
  }
}
```

**Error Response (409) - Duplicate:**
```json
{
  "error": "Policy with this transaction hash already exists",
  "policy": { /* existing policy object */ }
}
```

**cURL Example:**
```bash
curl -X POST https://risk-zapp-fn3s.vercel.app/api/policies/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "policyName": "Test Policy",
    "coverageAmount": 1000,
    "premiumAmount": 50,
    "totalPaid": 55,
    "transactionHash": "0xabc123..."
  }'
```

---

## 👤 User Data

### GET `/api/has-purchased`

**Description:** Check if a wallet address has purchased any policies

**Method:** `GET`

**Query Parameters:**
- `walletAddress` (required): Ethereum wallet address

**Response:**
```json
{
  "hasPurchased": true,
  "policies": 2
}
```

**cURL Example:**
```bash
curl -X GET "https://risk-zapp-fn3s.vercel.app/api/has-purchased?walletAddress=0x5C937ff54fA478359cCBc8144c36B37Ba9529b67"
```

### GET `/api/user-status`

**Description:** Get comprehensive user status and policy information

**Method:** `GET`

**Query Parameters:**
- `walletAddress` (required): Ethereum wallet address

**Response:**
```json
{
  "walletAddress": "0x5C937ff54fA478359cCBc8144c36B37Ba9529b67",
  "hasPurchased": true,
  "totalPurchases": 1,
  "activePolicies": 1,
  "totalSpent": 2.1,
  "tokenSymbol": "SHM",
  "latestPolicy": {
    "policyId": "POL_1757775109614_W5ZGOU",
    "policyName": "Micro Travel",
    "coverageAmount": 30,
    "status": "active",
    "purchaseDate": "2025-09-13T14:51:49.618Z"
  },
  "policies": [
    {
      "policyId": "POL_1757775109614_W5ZGOU",
      "policyName": "Micro Travel",
      "policyType": "travel-insurance",
      "coverageAmount": 30,
      "premiumAmount": 2,
      "totalPaid": 2.1,
      "status": "active",
      "purchaseDate": "2025-09-13T14:51:49.618Z",
      "expiryDate": null,
      "transactionHash": "0x5c94fde7a7a8cdc3f0d6c327a8cf43d40cd51db18a6e84b5267db243dc52e472"
    }
  ],
  "lastUpdated": "2025-09-13T17:49:45.023Z"
}
```

**cURL Example:**
```bash
curl -X GET "https://risk-zapp-fn3s.vercel.app/api/user-status?walletAddress=0x5C937ff54fA478359cCBc8144c36B37Ba9529b67"
```

---

## 📊 Tracking & Analytics

### POST `/api/tracking/interaction`

**Description:** Track user interactions with the platform

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "walletAddress": "0x5C937ff54fA478359cCBc8144c36B37Ba9529b67",
  "interactionType": "view_policy",
  "policyId": "POL_1757775109614_W5ZGOU",
  "transactionHash": "0x5c94fde7...",
  "amount": 2.1,
  "tokenSymbol": "SHM",
  "metadata": {
    "page": "policy-details",
    "action": "view"
  }
}
```

**Required Fields:**
- `walletAddress` (string)
- `interactionType` (string)

**Optional Fields:**
- `policyId` (string)
- `transactionHash` (string)
- `amount` (number)
- `tokenSymbol` (string)
- `metadata` (object)

**Interaction Types:**
- `view_policy`
- `purchase_policy`
- `claim_policy`
- `page_visit`
- `wallet_connect`
- `transaction_attempt`

**Success Response (201):**
```json
{
  "success": true,
  "interaction": "68c585050038cec4e3f68709",
  "message": "Interaction tracked successfully"
}
```

**cURL Example:**
```bash
curl -X POST https://risk-zapp-fn3s.vercel.app/api/tracking/interaction \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "interactionType": "view_policy",
    "metadata": {"page": "home"}
  }'
```

---

## 🐛 Debug & Development

### GET `/api/test`

**Description:** Simple test endpoint to verify API functionality

**Method:** `GET`

**Query Parameters:** Any (for testing)

**Response:**
```json
{
  "message": "Test route working",
  "method": "GET",
  "query": {
    "param1": "value1",
    "param2": "value2"
  },
  "timestamp": "2025-09-13T17:48:06.100Z"
}
```

**cURL Example:**
```bash
curl -X GET "https://risk-zapp-fn3s.vercel.app/api/test?param1=value1&param2=value2"
```

### GET `/api/debug`

**Description:** Debug database connectivity and query wallet data

**Method:** `GET`

**Query Parameters:**
- `walletAddress` (required): Ethereum wallet address

**Response:**
```json
{
  "walletAddress": "0x5C937ff54fA478359cCBc8144c36B37Ba9529b67",
  "collections": ["users", "policies", "userinteractions"],
  "userCount": 1,
  "policyCount": 1,
  "userQuery": {
    "_id": "68c585050038cec4e3f68709",
    "walletAddress": "0x5C937ff54fA478359cCBc8144c36B37Ba9529b67",
    "hasPurchased": true,
    "totalPurchases": 2,
    "totalSpent": 4.2
  },
  "policyQuery": "1 policies found",
  "timestamp": "2025-09-13T17:49:45.023Z"
}
```

**cURL Example:**
```bash
curl -X GET "https://risk-zapp-fn3s.vercel.app/api/debug?walletAddress=0x5C937ff54fA478359cCBc8144c36B37Ba9529b67"
```

---

## ⚠️ Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "walletAddress is required"
}
```

**405 Method Not Allowed:**
```json
{
  "error": "Method not allowed"
}
```

**409 Conflict:**
```json
{
  "error": "Policy with this transaction hash already exists",
  "policy": { /* existing policy data */ }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to check purchase status"
}
```

**Validation Error (500):**
```json
{
  "error": "Validation error: coverageAmount is required, premiumAmount must be a number",
  "details": "ValidationError: ...",
  "type": "ValidationError"
}
```

---

## 🔧 Environment Variables

Required environment variables for deployment:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/riskzapp` |
| `NODE_ENV` | Environment type | `production` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` (all origins) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

---

## 📈 Policy Types

Supported policy types:
- `basic`
- `premium`
- `enterprise`
- `custom`
- `health-micro`
- `health-standard`
- `health-premium`
- `travel-insurance`
- `device-protection`
- `cyber-security`
- `event-coverage`
- `freelancer-protection`

---

## 🔄 Policy Status Types

- `active` - Policy is currently active
- `expired` - Policy has expired
- `claimed` - Claim has been made
- `cancelled` - Policy was cancelled

---

## 🌐 Frontend Integration

### Environment Variable
```env
VITE_API_BASE_URL=https://risk-zapp-fn3s.vercel.app
```

### Example React Integration
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Check if user has purchased
const checkPurchaseStatus = async (walletAddress) => {
  const response = await fetch(
    `${API_BASE_URL}/api/has-purchased?walletAddress=${walletAddress}`
  );
  return await response.json();
};

// Purchase policy
const purchasePolicy = async (policyData) => {
  const response = await fetch(`${API_BASE_URL}/api/policies/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policyData)
  });
  return await response.json();
};

// Track interaction
const trackInteraction = async (interactionData) => {
  const response = await fetch(`${API_BASE_URL}/api/tracking/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interactionData)
  });
  return await response.json();
};
```

---

## 🚀 Deployment Information

- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js 22.x
- **Database:** MongoDB Atlas
- **Auto-deployment:** Enabled via GitHub integration
- **Repository:** `https://github.com/coolestnick/Risk-zapp`

---

## 📞 Support

For issues or questions about the API:
1. Check the `/api/health` endpoint first
2. Use `/api/debug` for database connectivity issues
3. Review error messages for specific guidance
4. Check environment variables in Vercel dashboard

---

**Generated:** September 13, 2025  
**API Version:** 1.0.0  
**Status:** ✅ Production Ready