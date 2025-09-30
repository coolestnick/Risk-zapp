// Simple in-memory rate limiting for Vercel
// Note: In production, you might want to use Redis or a database for persistence
const requests = new Map();

function rateLimit(options = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    keyGenerator = (req) => req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    // Get current requests for this key
    const userRequests = requests.get(key) || [];

    if (userRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
}

// Cleanup old entries periodically (for memory management)
setInterval(() => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
  const cutoff = now - windowMs;

  for (const [key, times] of requests.entries()) {
    const validTimes = times.filter(time => time > cutoff);
    if (validTimes.length === 0) {
      requests.delete(key);
    } else {
      requests.set(key, validTimes);
    }
  }
}, 300000); // Cleanup every 5 minutes

module.exports = { rateLimit };