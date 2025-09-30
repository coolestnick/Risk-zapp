# 🚀 RiskZap Backend Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **MongoDB Atlas**: Database URL ready

## 🛠️ Quick Deployment Steps

### 1️⃣ **Clone & Setup**
```bash
# Clone the repository
git clone [your-repo-url]
cd backend

# Install dependencies
npm install
```

### 2️⃣ **Environment Setup**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
# MONGODB_URI=your_mongodb_connection_string
# CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### 3️⃣ **Deploy to Vercel**
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod --yes
```

### 4️⃣ **Set Environment Variables in Vercel Dashboard**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `NODE_ENV` | Environment type | `production` |
| `CORS_ORIGIN` | Allowed origins (use * for all) | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### 5️⃣ **Redeploy After Setting Variables**
```bash
vercel --prod --yes
```

## 🔗 API Endpoints

After deployment, your API will be available at:
- `https://your-project.vercel.app/`

### Available Endpoints:
- `GET /api/health` - Health check
- `POST /api/policies/purchase` - Purchase policy
- `GET /api/policies/user/{wallet}/has-purchased` - Check purchase status
- `GET /api/policies/user/{wallet}/status` - Get full user status
- `POST /api/tracking/interaction` - Track interactions

## 🧪 Testing Your Deployment

### Test Health Endpoint:
```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "vercel": true
}
```

### Test Policy Status:
```bash
curl https://your-project.vercel.app/api/policies/user/0x123.../has-purchased
```

## 📁 Project Structure

```
backend/
├── api/                        # Serverless functions
│   ├── health.js              # Health check endpoint
│   ├── policies/              # Policy management
│   │   ├── purchase.js        
│   │   └── [walletAddress]/   
│   │       ├── has-purchased.js
│   │       └── status.js      
│   └── tracking/              # User tracking
│       └── interaction.js     
├── lib/                       # Shared utilities
│   ├── db.js                 # Database connection
│   ├── cors.js               # CORS configuration
│   └── rateLimit.js          # Rate limiting
├── src/models/               # Database models
│   ├── Policy.js            
│   ├── User.js              
│   └── UserInteraction.js   
├── public/                   # Static files
│   └── index.html           # API documentation
├── .env.example             # Environment template
├── .vercelignore           # Deployment ignore file
├── package.json            # Dependencies
└── vercel.json            # Vercel configuration
```

## 🔧 Deployment Scripts

Add these to your `package.json`:
```json
{
  "scripts": {
    "deploy": "vercel --prod",
    "deploy:preview": "vercel",
    "logs": "vercel logs --prod",
    "env:pull": "vercel env pull",
    "env:add": "vercel env add"
  }
}
```

## 🚨 Troubleshooting

### MongoDB Connection Issues
- Ensure IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
- Check connection string format and credentials
- Verify database name in connection string

### CORS Errors
- Add your frontend URL to `CORS_ORIGIN` environment variable
- Include protocol (https://) in the URL
- Separate multiple origins with commas

### Deployment Failures
- Check `vercel.json` syntax
- Ensure Node.js version is `22.x` in `package.json`
- Run `rm -rf .vercel` and redeploy

### API Not Working
- Check environment variables are set in Vercel dashboard
- Verify MongoDB connection string
- Check Vercel function logs: `vercel logs --prod`

## 🔄 Updating Your Deployment

1. Make changes to your code
2. Commit to git (optional but recommended)
3. Run: `vercel --prod --yes`

## 🎯 Frontend Integration

Update your frontend `.env`:
```env
VITE_API_BASE_URL=https://your-backend.vercel.app
```

Example frontend API call:
```javascript
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/purchase`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(policyData)
});
```

## 📊 Monitoring

- **Logs**: `vercel logs --prod`
- **Functions**: Check Vercel dashboard → Functions tab
- **Analytics**: Available in Vercel dashboard

## 🔐 Security Best Practices

1. Never commit `.env` file
2. Use environment variables for all secrets
3. Enable rate limiting (already configured)
4. Regularly update dependencies
5. Monitor function logs for suspicious activity

## 🆘 Need Help?

- Check Vercel docs: https://vercel.com/docs
- View function logs: `vercel logs --prod`
- Test endpoints with curl or Postman
- Verify environment variables are set correctly

---

Ready to deploy? Run: `vercel --prod --yes` 🚀