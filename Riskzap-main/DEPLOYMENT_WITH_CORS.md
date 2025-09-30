# 🔒 CORS Configuration Complete for risk-zapp.vercel.app

## ✅ **CORS Updated for Your Frontend**

Your backend has been updated to properly handle CORS for your deployed frontend:

### **🎯 Allowed Origins:**
- ✅ `https://risk-zapp.vercel.app` (Your production frontend)
- ✅ `http://localhost:8081` (Local development)
- ✅ `http://localhost:8082` (Local development)
- ✅ `http://localhost:5173` (Vite dev server)
- ✅ `http://localhost:3000` (Alternative dev port)

### **🔒 Security Features:**
- ✅ **Origin validation** - Only allows requests from specified domains
- ✅ **Automatic fallback** - Defaults to production URL if origin not recognized
- ✅ **Credentials support** - Allows cookies and authorization headers
- ✅ **Preflight handling** - Proper OPTIONS request handling

## 🚀 **Deployment Commands**

### **1. Deploy Backend to Vercel**
```bash
cd backend
vercel --prod
```

### **2. Set Environment Variables in Vercel Dashboard**
Go to your Vercel project settings → Environment Variables:

| Variable | Value | Scope |
|----------|-------|--------|
| `MONGODB_URI` | `mongodb+srv://shardmint:Coolestd001%23@shard-mint.ykzlw7i.mongodb.net/riskzapp?retryWrites=true&w=majority&appName=Shard-mint` | Production |
| `NODE_ENV` | `production` | Production |
| `CORS_ORIGIN` | `https://risk-zapp.vercel.app` | Production |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Production |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Production |

### **3. Update Frontend Environment**
Once backend is deployed, update your frontend environment variables:

```env
# .env (Frontend - risk-zapp.vercel.app)
VITE_API_BASE_URL=https://your-backend-name.vercel.app

# Replace 'your-backend-name' with your actual Vercel backend URL
```

## 🧪 **Testing CORS Configuration**

### **1. Test from your frontend domain**
Open browser console on `https://risk-zapp.vercel.app` and run:

```javascript
fetch('https://your-backend-url.vercel.app/health')
  .then(response => response.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(error => console.error('❌ CORS error:', error));
```

### **2. Test policy purchase**
```javascript
fetch('https://your-backend-url.vercel.app/api/policies/user/0x.../has-purchased')
  .then(response => response.json())
  .then(data => console.log('✅ Policy API working:', data))
  .catch(error => console.error('❌ Policy API error:', error));
```

### **3. Expected CORS Headers**
Your API responses should include these headers:

```
Access-Control-Allow-Origin: https://risk-zapp.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

## 🔍 **CORS Troubleshooting**

### **Common Issues:**

1. **"Access-Control-Allow-Origin" error**
   - ✅ **Fixed**: Your frontend URL is now in allowed origins
   - ✅ **Verify**: Environment variables are set correctly in Vercel

2. **Preflight request failed**
   - ✅ **Fixed**: OPTIONS requests are handled properly
   - ✅ **Check**: Ensure backend deployment is successful

3. **Credentials not allowed**
   - ✅ **Fixed**: `Access-Control-Allow-Credentials: true` is set

### **Debug Commands:**
```bash
# Test CORS headers
curl -H "Origin: https://risk-zapp.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend-url.vercel.app/api/policies/purchase -v
```

## 📋 **Deployment Checklist**

- [x] ✅ **CORS origins** updated to include `https://risk-zapp.vercel.app`
- [x] ✅ **Origin validation** implemented for security
- [x] ✅ **Preflight requests** handled properly
- [x] ✅ **Environment variables** configured for production
- [x] ✅ **Local development** still supported
- [ ] 🔄 **Deploy backend** to Vercel (`vercel --prod`)
- [ ] 🔄 **Set environment variables** in Vercel dashboard
- [ ] 🔄 **Update frontend** environment with backend URL
- [ ] 🔄 **Test CORS** from production frontend

## 🎯 **Expected API URLs (After Backend Deployment)**

Your frontend (`https://risk-zapp.vercel.app`) will call:

```
https://your-backend-name.vercel.app/health
https://your-backend-name.vercel.app/api/policies/purchase
https://your-backend-name.vercel.app/api/policies/user/:wallet/has-purchased
https://your-backend-name.vercel.app/api/policies/user/:wallet/status
https://your-backend-name.vercel.app/api/tracking/interaction
```

## 🔒 **Security Benefits**

1. **✅ Domain Restriction** - Only your frontend can access the API
2. **✅ Request Validation** - Malicious origins are blocked
3. **✅ Credential Protection** - Secure cookie/token handling
4. **✅ Method Filtering** - Only allowed HTTP methods accepted
5. **✅ Header Validation** - Restricted to necessary headers

## 🚀 **Ready to Deploy!**

Your CORS configuration is now secure and optimized for:
- **Production**: `https://risk-zapp.vercel.app`
- **Development**: `http://localhost:8081` (and other local ports)

Deploy your backend with:
```bash
cd backend
vercel --prod
```

The backend will automatically handle CORS properly for your frontend domain! 🎉