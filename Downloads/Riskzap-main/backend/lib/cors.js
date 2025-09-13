const defaultOrigins = 'https://risk-zapp.vercel.app,http://localhost:8081,http://localhost:8082,http://localhost:5173,http://localhost:3000';

export function setCorsHeaders(res, origin) {
  const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins).split(',').map(o => o.trim());
  
  // Check if the request origin is in our allowed list
  const requestOrigin = origin || allowedOrigins[0]; // Default to production URL
  const isAllowed = allowedOrigins.includes(requestOrigin);
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    // Default to production URL if origin not allowed
    res.setHeader('Access-Control-Allow-Origin', 'https://risk-zapp.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return res;
}

export function handleCors(req, res) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indicates this was a preflight request
  }
  
  return false; // Not a preflight request
}

// List of allowed origins for verification
export const allowedOrigins = [
  'https://risk-zapp.vercel.app',  // Production frontend
  'http://localhost:8081',         // Local development
  'http://localhost:8082',         // Local development  
  'http://localhost:5173',         // Vite dev server
  'http://localhost:3000'          // Alternative dev port
];