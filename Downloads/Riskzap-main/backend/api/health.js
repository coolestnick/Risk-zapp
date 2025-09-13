const { connectToDatabase } = require('../lib/db');
const { handleCors } = require('../lib/cors');
const { monitor, withDbMonitoring } = require('../lib/monitoring');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  let healthStatus = 'OK';
  let dbStatus = 'disconnected';
  let dbError = null;
  let autoRestartAttempted = false;

  try {
    // Update health check time
    monitor.updateHealthCheck();
    
    // Test database connection with monitoring
    await withDbMonitoring(async () => {
      await connectToDatabase();
      dbStatus = 'connected';
    });

  } catch (error) {
    console.error('Health check - database connection failed:', error);
    dbError = error.message;
    healthStatus = 'DEGRADED';
    
    // Auto-restart attempt for database issues
    try {
      console.log('🔄 Attempting auto-restart of database connection...');
      
      // Force disconnect and reconnect
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      // Retry connection
      await withDbMonitoring(async () => {
        await connectToDatabase(1); // Single retry
        dbStatus = 'connected (auto-restarted)';
        healthStatus = 'OK';
        autoRestartAttempted = true;
      });
      
    } catch (restartError) {
      console.error('Auto-restart failed:', restartError);
      healthStatus = 'ERROR';
    }
  }

  // Get comprehensive health data
  const monitorData = monitor.getHealthStatus();
  
  // Determine overall status
  const status = healthStatus === 'OK' ? 200 : (healthStatus === 'DEGRADED' ? 503 : 500);
  
  res.status(status).json({
    status: healthStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    vercel: true,
    autoRestart: autoRestartAttempted,
    monitoring: {
      uptime: monitorData.uptime.human,
      requests: monitorData.metrics.requestCount,
      errors: monitorData.metrics.errorCount,
      errorRate: monitorData.metrics.errorRate,
      dbConnections: monitorData.metrics.dbConnections,
      dbErrorRate: monitorData.metrics.dbErrorRate,
      lastHealthCheck: monitorData.metrics.lastHealthCheck
    },
    error: dbError,
    selfHealing: {
      enabled: true,
      restartOnFailure: true,
      monitoringActive: true
    }
  });
}