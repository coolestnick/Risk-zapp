# RiskZap Backend API

A serverless backend API for RiskZap insurance platform, designed for Vercel deployment.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Deploy to Vercel
npm run deploy
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Documentation](https://your-backend.vercel.app/) - Live API docs after deployment

## 🛠️ Available Scripts

```bash
npm run deploy          # Deploy to production
npm run deploy:preview  # Deploy preview
npm run deploy:dev      # Run local dev server
npm run logs           # View production logs
npm run env:pull       # Pull env vars from Vercel
npm run env:add        # Add new env variable
```

## 🔗 API Endpoints

- `GET /api/health` - Health check
- `POST /api/policies/purchase` - Purchase policy
- `GET /api/policies/user/{wallet}/has-purchased` - Check purchase status
- `GET /api/policies/user/{wallet}/status` - Get user status
- `POST /api/tracking/interaction` - Track interactions

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📦 Tech Stack

- **Runtime**: Node.js 22.x
- **Database**: MongoDB with Mongoose
- **Deployment**: Vercel Serverless Functions
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Built-in protection

## 🤝 Frontend Integration

```javascript
const API_URL = 'https://your-backend.vercel.app';

// Example: Check if user has purchased
const response = await fetch(`${API_URL}/api/policies/user/${wallet}/has-purchased`);
const data = await response.json();
console.log(data.hasPurchased); // true/false
```

## 📝 License

MIT