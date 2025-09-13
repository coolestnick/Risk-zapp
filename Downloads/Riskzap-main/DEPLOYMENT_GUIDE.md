# 🚀 RiskZap Deployment Guide

## Current Status ✅

- **Backend**: Running on http://localhost:3001 (MongoDB connected)
- **Frontend**: Running on http://localhost:8082 (Fixed ethers.js compatibility)
- **Database**: MongoDB Atlas (`riskzapp` database)
- **Tracking**: Fully functional user interaction system

## Testing Your Setup

### 1. Open the Test Page
```bash
open test-tracking.html
# or navigate to: file:///Users/nickkz/Downloads/Riskzap-main/test-tracking.html
```

### 2. Test Backend Health
- Click "Check Backend Health"
- Should show: `"status": "OK"` and `"database": "connected"`

### 3. Test User Tracking
- Enter a wallet address (or use the default)
- Click "Test Track Interaction"
- Should show success message with interaction ID

### 4. Access the Frontend
- Open: http://localhost:8082
- Connect your wallet (MetaMask recommended)
- All interactions will be automatically tracked

## 🌐 Deploy to Vercel

### Backend Deployment

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

3. **Deploy to Vercel**:
```bash
vercel --prod
```

4. **Set Environment Variables** in Vercel Dashboard:
```env
MONGODB_URI=mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:8082
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. **Note the deployed backend URL** (e.g., `https://your-backend.vercel.app`)

### Frontend Deployment

1. **Update environment variables**:
```env
# Update .env file
VITE_API_BASE_URL=https://your-backend.vercel.app
```

2. **Deploy from root directory**:
```bash
cd ..  # back to root
vercel --prod
```

3. **Update CORS in backend** - Add your frontend URL to `CORS_ORIGIN`

## 🔧 Environment Configuration

### Development
```env
# Backend
MONGODB_URI=mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:8082,http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_BASE_URL=http://localhost:3001
```

### Production
```env
# Backend (Vercel)
MONGODB_URI=mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app

# Frontend (Vercel)
VITE_API_BASE_URL=https://your-backend.vercel.app
```

## 📊 Monitoring Deployment

### Backend Health Check
```bash
# Development
curl http://localhost:3001/health

# Production
curl https://your-backend.vercel.app/health
```

### Test API Endpoints
```bash
# Test interaction tracking
curl -X POST https://your-backend.vercel.app/api/tracking/interaction \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "interactionType": "visit_page",
    "metadata": {"page": "home"}
  }'
```

## 🔐 Security Checklist

- [x] Rate limiting configured
- [x] CORS properly set
- [x] Environment variables secured
- [x] MongoDB Atlas IP whitelist (0.0.0.0/0 for global access)
- [x] Helmet security headers
- [x] Input validation on all endpoints

## 🐛 Troubleshooting

### Common Issues

1. **Frontend not loading**
   - Check if both servers are running
   - Verify port numbers (8082 for frontend, 3001 for backend)
   - Clear browser cache and reload

2. **Ethers.js errors**
   - ✅ Fixed: Using ethers v5 syntax (`providers.Web3Provider`)
   - Ensure MetaMask is installed

3. **CORS errors**
   - Verify frontend URL in backend CORS_ORIGIN
   - Check protocol (http vs https)

4. **Database connection issues**
   - Verify MongoDB connection string
   - Check IP whitelist in Atlas
   - Confirm credentials

5. **Tracking not working**
   - Check browser network tab for API calls
   - Verify backend health endpoint
   - Check console for JavaScript errors

### Debug Commands

```bash
# Check processes
lsof -i :3001  # Backend
lsof -i :8082  # Frontend

# Test backend directly
curl -v http://localhost:3001/health

# Check logs
# Backend logs appear in terminal where you started the server
# Frontend logs appear in browser console
```

## 📱 Mobile Testing

The frontend is responsive and works on mobile devices. Test with:
- Chrome mobile
- Safari mobile  
- MetaMask mobile browser

## 🔄 Updates & Maintenance

### To update the application:

1. **Pull latest changes**
2. **Update dependencies**:
```bash
npm install  # Frontend
cd backend && npm install  # Backend
```
3. **Restart servers**
4. **Run tests** (use test-tracking.html)

### Database Maintenance

- Monitor MongoDB Atlas usage
- Check collection sizes periodically
- Consider data archiving for old interactions

## 📈 Analytics Dashboard

Access user analytics via API:
- User analytics: `GET /api/analytics/user/:walletAddress`
- Platform analytics: `GET /api/analytics/platform`
- Interaction history: `GET /api/tracking/user/:walletAddress/history`

## 🎯 Next Steps

1. **Deploy to production** using the steps above
2. **Set up monitoring** (consider adding error tracking)
3. **Add analytics dashboard** to the frontend
4. **Implement user notifications** for important events
5. **Add more interaction types** as needed

## 🔗 Useful Links

- Frontend: http://localhost:8082
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health  
- Test Page: file:///Users/nickkz/Downloads/Riskzap-main/test-tracking.html
- MongoDB Atlas: https://cloud.mongodb.com
- Vercel Dashboard: https://vercel.com/dashboard