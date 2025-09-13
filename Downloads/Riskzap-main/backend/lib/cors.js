export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:8081,http://localhost:8082,http://localhost:5173,http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

export function setCorsHeaders(res) {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081,http://localhost:8082,http://localhost:5173,http://localhost:3000').split(',');
  
  // In production, you might want to check the origin
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // Use first origin as default
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return res;
}

export function handleCors(req, res) {
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indicates this was a preflight request
  }
  
  return false; // Not a preflight request
}