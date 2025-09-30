const { handleCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  res.json({
    message: 'Test route working',
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}