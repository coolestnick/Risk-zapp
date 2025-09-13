# 🚀 Vercel Deployment Guide for RiskZap Backend

## 📁 New Backend Structure (Vercel Optimized)

```
backend/
├── api/                          # Vercel API routes
│   ├── health.js                # Health check endpoint
│   ├── policies/
│   │   ├── purchase.js          # POST /api/policies/purchase
│   │   └── [walletAddress]/
│   │       ├── has-purchased.js # GET /api/policies/user/:wallet/has-purchased
│   │       └── status.js        # GET /api/policies/user/:wallet/status
│   └── tracking/
│       └── interaction.js       # POST /api/tracking/interaction
├── lib/                         # Shared utilities
│   ├── db.js                   # Database connection
│   ├── cors.js                 # CORS handling
│   └── rateLimit.js            # Rate limiting
├── src/                        # Models (unchanged)
│   └── models/
│       ├── Policy.js
│       ├── User.js
│       └── UserInteraction.js
├── vercel.json                 # Vercel configuration
└── package.json               # Updated dependencies
```

## ⚡ Key Optimizations for Vercel

### 1. **Serverless Functions**
- ✅ Each API endpoint is a separate serverless function
- ✅ Faster cold starts and better resource utilization
- ✅ Automatic scaling based on demand

### 2. **Database Connection Optimization**
- ✅ Connection reuse across function invocations
- ✅ Proper connection pooling for MongoDB
- ✅ Graceful handling of connection states

### 3. **CORS Handling**
- ✅ Built-in CORS handling for each endpoint
- ✅ Proper preflight request handling
- ✅ Environment-specific origin configuration

### 4. **Rate Limiting**
- ✅ In-memory rate limiting (suitable for serverless)
- ✅ Configurable limits per endpoint
- ✅ Automatic cleanup to prevent memory leaks

## 🛠️ Deployment Steps

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Install Dependencies**
```bash
cd backend
npm install
```

### **Step 4: Configure Environment Variables**
Create a `.env.local` file or configure in Vercel dashboard:

```env
MONGODB_URI=mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:8081
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Step 5: Deploy to Vercel**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔧 Local Development with Vercel

### **Start Vercel Dev Server**
```bash
cd backend
vercel dev
```

This will start a local server that mimics Vercel's serverless environment.

## 📊 API Endpoints (After Deployment)

### **Production URLs**
Replace `your-backend` with your actual Vercel deployment URL:

```bash
# Health check
GET https://your-backend.vercel.app/health

# Policy purchase
POST https://your-backend.vercel.app/api/policies/purchase

# Check if user has purchased
GET https://your-backend.vercel.app/api/policies/user/0x.../has-purchased

# Get user policy status
GET https://your-backend.vercel.app/api/policies/user/0x.../status

# Track interaction
POST https://your-backend.vercel.app/api/tracking/interaction
```

## 🧪 Testing the Deployment

### **1. Test Health Endpoint**
```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-13T15:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "vercel": true
}
```

### **2. Test Policy Purchase**
```bash
curl -X POST "https://your-backend.vercel.app/api/policies/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x...",
    "policyName": "Test Policy",
    "policyType": "health-micro",
    "coverageAmount": 5000,
    "premiumAmount": 250,
    "totalPaid": 262.5,
    "transactionHash": "0x..."
  }'
```

### **3. Test Purchase Status**
```bash
curl "https://your-backend.vercel.app/api/policies/user/0x.../has-purchased"
```

## 🎯 Frontend Integration

Update your frontend environment variables:

```env
# .env (Frontend)
VITE_API_BASE_URL=https://your-backend.vercel.app
```

## ⚙️ Environment Variables in Vercel

### **Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://shardmint:...` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

### **Via Vercel CLI:**
```bash
vercel env add MONGODB_URI
vercel env add NODE_ENV
vercel env add CORS_ORIGIN
```

## 🚦 Performance Considerations

### **Cold Start Optimization**
- ✅ Minimal dependencies per function
- ✅ Connection reuse across invocations
- ✅ Optimized import statements

### **Memory Usage**
- ✅ Efficient rate limiting implementation
- ✅ Automatic cleanup of old data
- ✅ Minimal memory footprint

### **Response Times**
- ✅ Database connection pooling
- ✅ Optimized queries
- ✅ Proper error handling

## 🔍 Monitoring & Debugging

### **Vercel Logs**
```bash
vercel logs
```

### **Function Analytics**
Monitor function performance in the Vercel dashboard:
- Cold start times
- Execution duration
- Error rates
- Request volume

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection string updated
- [ ] CORS origins include frontend domain
- [ ] All API endpoints tested
- [ ] Frontend environment variables updated
- [ ] Rate limiting configured appropriately
- [ ] MongoDB Atlas IP whitelist allows all IPs (0.0.0.0/0)

## 🎉 Benefits of Vercel Deployment

1. **⚡ Automatic Scaling** - Handles traffic spikes automatically
2. **🌍 Global CDN** - Fast response times worldwide  
3. **🔄 Zero Downtime** - Atomic deployments
4. **📊 Built-in Analytics** - Performance monitoring
5. **💰 Pay-per-Use** - Cost-effective for variable traffic
6. **🔒 HTTPS by Default** - Secure connections
7. **🎯 Easy Integration** - Perfect for frontend deployments

## 🆘 Troubleshooting

### **Common Issues:**

1. **Database Connection Errors**
   - Verify MongoDB URI is correct
   - Ensure IP whitelist allows all IPs

2. **CORS Errors** 
   - Update CORS_ORIGIN environment variable
   - Include your frontend domain

3. **Rate Limiting Issues**
   - Adjust rate limit values if needed
   - Monitor function logs for rate limit hits

4. **Cold Start Delays**
   - Normal for serverless functions
   - Consider upgrading to Pro plan for faster cold starts

The backend is now fully optimized for Vercel deployment with serverless functions! 🚀