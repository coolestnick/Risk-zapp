# RiskZap Project Documentation

## 🚀 Project Overview
RiskZap is a comprehensive insurance platform built with modern web technologies, deployed on Vercel with MongoDB Atlas database integration.

---

## 🌐 Live URLs

### Frontend (Main Application)
- **URL:** https://risk-zapp.vercel.app/
- **Platform:** Vercel
- **Framework:** React/Vite
- **Status:** ✅ Live

### Backend (API Server)
- **URL:** https://risk-zapp-fn3s.vercel.app/
- **Health Check:** https://risk-zapp-fn3s.vercel.app/api/health
- **Platform:** Vercel Serverless Functions
- **Framework:** Node.js + Express
- **Status:** ✅ Live

---

## 📊 Database Configuration

### MongoDB Atlas (DigitalOcean)
- **Host:** `risk-zapp-db-ef1a61c6.mongo.ondigitalocean.com`
- **Database:** `admin`
- **Provider:** DigitalOcean MongoDB
- **Connection Status:** ✅ Connected
- **Connection String:** `mongodb+srv://doadmin:pzIW43D98U276d5i@Risk-Zapp-DB-19d26de0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin`

---

## 🛠️ API Endpoints

### Base URL: `https://risk-zapp-fn3s.vercel.app`

### Health & Status
```
GET /api/health
```
**Description:** Health check endpoint
**Response:** System status, database connection, timestamp

### Policy Management
```
POST /api/policies/purchase
```
**Description:** Purchase a new insurance policy
**Body:** Policy details (walletAddress, policyType, coverageAmount, etc.)

```
GET /api/policies/[walletAddress]/has-purchased
```
**Description:** Check if user has purchased any policies
**Parameters:** walletAddress (Ethereum wallet address)

```
GET /api/policies/[walletAddress]/status
```
**Description:** Get detailed policy status for user
**Parameters:** walletAddress (Ethereum wallet address)

### User Tracking
```
POST /api/tracking/interaction
```
**Description:** Track user interactions and analytics
**Body:** Interaction data (walletAddress, action, metadata)

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database Connection
MONGODB_URI=mongodb+srv://doadmin:pzIW43D98U276d5i@Risk-Zapp-DB-19d26de0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin

# Environment
NODE_ENV=production

# CORS Settings
CORS_ORIGIN=https://risk-zapp.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Port (for local development)
PORT=3001
```

### Frontend (.env)
```env
# API Base URL
VITE_API_BASE_URL=https://risk-zapp-fn3s.vercel.app
```

---

## 🏗️ Project Structure

### Backend Architecture
```
backend/
├── api/                          # Vercel Serverless Functions
│   ├── health.js                # Health check endpoint
│   ├── policies/                # Policy management endpoints
│   │   ├── purchase.js          # POST /api/policies/purchase
│   │   └── [walletAddress]/     # Dynamic wallet routes
│   │       ├── has-purchased.js # GET /api/policies/[wallet]/has-purchased
│   │       └── status.js        # GET /api/policies/[wallet]/status
│   └── tracking/                # User tracking endpoints
│       └── interaction.js       # POST /api/tracking/interaction
├── lib/                         # Shared utilities
│   ├── db.js                   # Database connection with retry logic
│   ├── cors.js                 # CORS handling
│   └── rateLimit.js            # Rate limiting middleware
├── src/                        # Application models
│   └── models/                 # Database models
│       ├── Policy.js           # Policy schema
│       ├── User.js             # User schema
│       └── UserInteraction.js  # User interaction schema
├── .env                        # Environment variables
├── package.json               # Dependencies and scripts
└── vercel.json                # Vercel deployment configuration
```

### Frontend Architecture
```
src/
├── components/                 # React components
│   ├── ui/                    # UI component library
│   ├── Dashboard.tsx          # Main dashboard
│   ├── PolicyCards.tsx       # Policy display components
│   ├── WalletConnector.tsx   # Web3 wallet integration
│   └── ...
├── services/                  # API and service layers
│   ├── api.ts                # Backend API integration
│   ├── web3.ts               # Blockchain integration
│   └── database.ts           # Local database operations
├── pages/                    # Application pages
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript type definitions
```

---

## 🧪 Testing & Verification

### Test Backend Health
```bash
curl https://risk-zapp-fn3s.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-20T16:45:00.000Z",
  "environment": "production",
  "database": "connected",
  "vercel": true
}
```

### Test Policy Purchase
```bash
curl -X POST "https://risk-zapp-fn3s.vercel.app/api/policies/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6635C0532925a3b8D39a6d5B6c1f4c9F",
    "policyName": "Health Micro Insurance",
    "policyType": "health-micro",
    "coverageAmount": 5000,
    "premiumAmount": 250,
    "totalPaid": 262.5,
    "transactionHash": "0x1234567890abcdef"
  }'
```

### Test Purchase Status
```bash
curl "https://risk-zapp-fn3s.vercel.app/api/policies/0x742d35Cc6635C0532925a3b8D39a6d5B6c1f4c9F/has-purchased"
```

---

## 🚀 Deployment Information

### Frontend Deployment (Vercel)
- **Repository:** Connected to Git repository
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 22.x
- **Auto-deploy:** ✅ Enabled on main branch

### Backend Deployment (Vercel)
- **Type:** Serverless Functions
- **Runtime:** Node.js 22.x
- **Deployment:** Vercel Serverless
- **Database:** MongoDB Atlas (DigitalOcean)
- **Environment Variables:** Configured in Vercel Dashboard

---

## 📈 Monitoring & Analytics

### Available Monitoring
- **Vercel Analytics:** Built-in performance monitoring
- **Function Logs:** `npx vercel logs --prod`
- **Database Monitoring:** MongoDB Atlas dashboard
- **User Tracking:** Custom analytics via tracking API

### Key Metrics to Monitor
- API response times
- Database connection health
- Error rates
- User interactions
- Policy purchase rates

---

## 🔒 Security Configuration

### CORS Policy
- **Allowed Origins:** `https://risk-zapp.vercel.app`
- **Methods:** GET, POST, OPTIONS
- **Headers:** Content-Type, Authorization

### Rate Limiting
- **Window:** 15 minutes (900,000ms)
- **Max Requests:** 100 per window
- **Applied to:** All API endpoints

### Database Security
- **Authentication:** Username/password + TLS
- **Connection:** Encrypted (TLS/SSL)
- **Access Control:** IP whitelist (0.0.0.0/0 for Vercel)

---

## 🛠️ Development & Maintenance

### Local Development Setup
```bash
# Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173

# Backend
cd backend
npm install
npx vercel dev
# Runs on http://localhost:3000
```

### Update Deployment
```bash
# Frontend
git push origin main  # Auto-deploys via Vercel

# Backend
cd backend
npx vercel --prod
```

### Environment Management
```bash
# Pull environment variables from Vercel
npx vercel env pull

# Add new environment variable
npx vercel env add VARIABLE_NAME

# List environment variables
npx vercel env ls
```

---

## 📞 Support & Resources

### Documentation Links
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **React/Vite:** https://vitejs.dev/guide/

### Troubleshooting
1. **Database Connection Issues:** Check environment variables in Vercel
2. **CORS Errors:** Verify frontend URL in CORS_ORIGIN
3. **API Errors:** Check Vercel function logs
4. **Frontend Issues:** Verify VITE_API_BASE_URL points to correct backend

### Emergency Contacts
- **Frontend URL:** https://risk-zapp.vercel.app/
- **Backend Health:** https://risk-zapp-fn3s.vercel.app/api/health
- **Database Status:** Monitor via MongoDB Atlas dashboard

---

## 📋 Quick Reference

### Essential URLs
| Service | URL |
|---------|-----|
| Frontend | https://risk-zapp.vercel.app/ |
| Backend API | https://risk-zapp-fn3s.vercel.app/ |
| Health Check | https://risk-zapp-fn3s.vercel.app/api/health |
| Vercel Dashboard | https://vercel.com/dashboard |

### Key Commands
```bash
# Deploy backend
npx vercel --prod

# View logs
npx vercel logs --prod

# Test health
curl https://risk-zapp-fn3s.vercel.app/api/health

# Update environment
npx vercel env add VARIABLE_NAME
```

---

**Last Updated:** September 20, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready