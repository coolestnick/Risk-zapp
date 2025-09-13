# RiskZap - Full Stack DeFi Insurance Platform

## Overview

RiskZap is a complete DeFi insurance platform built on the Shardeum network. This full-stack application includes:

- **Frontend**: React + TypeScript + Vite with Web3 integration
- **Backend**: Node.js + Express + MongoDB with user tracking
- **Smart Contracts**: Solidity contracts deployed on Shardeum
- **Database**: MongoDB Atlas for user interaction tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- MongoDB Atlas account
- MetaMask or Web3 wallet
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Riskzap-main
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend (.env)
```env
# Frontend Environment Variables
VITE_COMPANY_WALLET=0x8a97f55b6D61faA30fB6b33D602dBB0714822D80
VITE_DEMO_MODE=false
VITE_SHM_TOKEN_ADDRESS=0xaa2b86e1f9de4cbdeaf177e61ce0e2fc091f9f9e
VITE_SHM_TOKEN_DECIMALS=18
VITE_SHM_CHAIN_ID=8080
VITE_POLICY_CONTRACT=0x055682a1a8fa88ed10a56724d29bcd44215e04d5

# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Supabase Configuration (Legacy)
VITE_SUPABASE_URL=https://fmmiqlflfguqimxejeyf.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-key>

# Network Configuration
SHARDEUM_RPC_URL=https://api-unstable.shardeum.org
```

#### Backend (backend/.env)
```env
MONGODB_URI=mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:8082,http://localhost:5173,http://localhost:3000,http://localhost:8081

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Start Development Servers

#### Option 1: Use the convenience script
```bash
./start-dev.sh
```

#### Option 2: Start manually
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📊 User Tracking Features

### Automatic Tracking
The platform automatically tracks user interactions:

- Wallet connections
- Page visits
- Policy views
- Purchase transactions
- Dashboard usage
- Analytics views

### API Endpoints

#### Tracking
- `POST /api/tracking/interaction` - Track single interaction
- `POST /api/tracking/interactions/batch` - Batch track interactions
- `GET /api/tracking/user/:walletAddress/history` - Get user interaction history

#### Analytics
- `GET /api/analytics/user/:walletAddress` - Get user analytics
- `GET /api/analytics/platform` - Get platform analytics

### Data Models

#### User Interaction
```javascript
{
  walletAddress: String,
  interactionType: String, // enum: connect_wallet, view_policies, purchase_policy, etc.
  policyId: String,
  transactionHash: String,
  amount: Number,
  tokenSymbol: String,
  metadata: Object,
  userAgent: String,
  ipAddress: String,
  sessionId: String,
  timestamp: Date
}
```

#### User Profile
```javascript
{
  walletAddress: String,
  firstInteraction: Date,
  lastInteraction: Date,
  totalInteractions: Number,
  hasPurchased: Boolean,
  totalPurchases: Number,
  totalSpent: Number,
  activePolicies: Number
}
```

## 🔧 Frontend Integration

### Using the Tracking Service

```typescript
import { useTracking } from '@/hooks/useTracking';

function MyComponent() {
  const { trackInteraction, trackPolicyPurchase, getUserAnalytics } = useTracking({
    walletAddress: '0x...',
    autoTrackPageViews: true
  });

  const handlePurchase = async () => {
    await trackPolicyPurchase(policyId, amount, txHash);
  };

  const handleViewAnalytics = async () => {
    const analytics = await getUserAnalytics();
    console.log('User analytics:', analytics);
  };
}
```

### Direct Service Usage

```typescript
import trackingService from '@/services/trackingService';

// Track custom interaction
await trackingService.trackInteraction({
  walletAddress: '0x...',
  interactionType: 'custom_action',
  metadata: { customData: 'value' }
});
```

## 🚢 Deployment

### Backend Deployment (Vercel)

1. **Deploy to Vercel**:
```bash
cd backend
vercel --prod
```

2. **Set Environment Variables** in Vercel dashboard:
- `MONGODB_URI`
- `NODE_ENV=production`
- `CORS_ORIGIN` (add your frontend domain)

### Frontend Deployment (Vercel)

1. **Update API URL** in frontend `.env`:
```env
VITE_API_BASE_URL=https://your-backend.vercel.app
```

2. **Deploy**:
```bash
vercel --prod
```

### MongoDB Atlas Setup

1. Create MongoDB Atlas cluster
2. Create database user
3. Configure IP whitelist (0.0.0.0/0 for global access)
4. Update connection string in backend `.env`

## 📁 Project Structure

```
Riskzap-main/
├── src/                          # Frontend source
│   ├── components/               # React components
│   ├── services/                 # API services
│   │   └── trackingService.ts    # User tracking service
│   ├── hooks/                    # React hooks
│   │   └── useTracking.ts        # Tracking hook
│   └── pages/                    # Application pages
├── backend/                      # Backend API
│   ├── src/
│   │   ├── config/               # Configuration
│   │   ├── models/               # MongoDB models
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Express middleware
│   │   └── server.js             # Main server file
│   ├── package.json
│   ├── vercel.json               # Vercel config
│   └── .env                      # Backend environment
├── contracts/                    # Smart contracts
├── hardhat-project/              # Hardhat configuration
└── start-dev.sh                  # Development script
```

## 🔍 Monitoring & Analytics

### Health Checks
- Backend health: `GET /health`
- Database connection status
- API response times

### User Analytics
- Total unique users
- Active users (24h)
- Conversion rate (users who purchased)
- Interaction patterns
- Popular features

### Platform Metrics
- Daily/weekly user activity
- Transaction volume
- Policy purchases
- User retention

## 🛠️ Development Tools

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Security Features

- Rate limiting on API endpoints
- CORS configuration
- Input validation
- MongoDB injection protection
- Helmet security headers

## 📝 API Documentation

### Rate Limits
- General API: 100 requests per 15 minutes
- Tracking endpoints: 50 requests per minute

### Error Responses
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

### Success Responses
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string
   - Verify IP whitelist
   - Confirm credentials

2. **CORS Errors**
   - Add frontend domain to CORS_ORIGIN
   - Check protocol (http/https)

3. **Tracking Not Working**
   - Verify backend is running
   - Check browser network tab
   - Confirm wallet connection

### Debug Mode

Set `NODE_ENV=development` for detailed error logs.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API logs
3. Check MongoDB connection
4. Verify environment variables

## 🔄 Updates

To update the platform:
1. Pull latest changes
2. Run `npm install` in both directories
3. Restart servers
4. Check for database migrations