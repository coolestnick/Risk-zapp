import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: message || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
export const generalLimiter = createRateLimiter();

// Stricter rate limiter for tracking endpoints
export const trackingLimiter = createRateLimiter(
  60000, // 1 minute
  50,    // 50 requests per minute
  'Too many tracking requests, please slow down.'
);

export default createRateLimiter;