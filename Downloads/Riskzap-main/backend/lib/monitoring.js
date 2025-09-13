// Crash-proof monitoring system
class HealthMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      dbConnections: 0,
      dbErrors: 0,
      uptime: Date.now(),
      lastError: null,
      lastHealthCheck: null
    };
  }

  // Track request
  recordRequest() {
    this.metrics.requestCount++;
  }

  // Track error
  recordError(error, context = 'unknown') {
    this.metrics.errorCount++;
    this.metrics.lastError = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      context,
      timestamp: new Date().toISOString()
    };
    
    // Log error safely
    try {
      console.error(`🚨 Error in ${context}:`, error);
    } catch (logError) {
      // Even error logging can fail
      console.error('Failed to log error');
    }
  }

  // Track database connection
  recordDbConnection() {
    this.metrics.dbConnections++;
  }

  // Track database error
  recordDbError(error) {
    this.metrics.dbErrors++;
    this.recordError(error, 'database');
  }

  // Get health status
  getHealthStatus() {
    const now = Date.now();
    const uptimeMs = now - this.metrics.uptime;
    const errorRate = this.metrics.requestCount > 0 ? 
      (this.metrics.errorCount / this.metrics.requestCount) : 0;

    return {
      status: errorRate < 0.1 ? 'healthy' : (errorRate < 0.5 ? 'degraded' : 'unhealthy'),
      uptime: {
        ms: uptimeMs,
        human: this.formatUptime(uptimeMs)
      },
      metrics: {
        ...this.metrics,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        dbErrorRate: this.metrics.dbConnections > 0 ? 
          `${((this.metrics.dbErrors / this.metrics.dbConnections) * 100).toFixed(2)}%` : '0%'
      },
      timestamp: new Date().toISOString()
    };
  }

  // Format uptime in human readable form
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Update last health check
  updateHealthCheck() {
    this.metrics.lastHealthCheck = new Date().toISOString();
  }

  // Reset metrics (for maintenance)
  reset() {
    const uptime = this.metrics.uptime;
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      dbConnections: 0,
      dbErrors: 0,
      uptime,
      lastError: null,
      lastHealthCheck: null
    };
  }
}

// Create global monitor instance
const monitor = new HealthMonitor();

// Safe wrapper for any async function
async function withMonitoring(fn, context = 'unknown') {
  monitor.recordRequest();
  
  try {
    const result = await fn();
    return result;
  } catch (error) {
    monitor.recordError(error, context);
    throw error;
  }
}

// Safe wrapper for database operations
async function withDbMonitoring(fn, context = 'database') {
  monitor.recordDbConnection();
  
  try {
    const result = await fn();
    return result;
  } catch (error) {
    monitor.recordDbError(error);
    throw error;
  }
}

// Express middleware for automatic monitoring
function monitoringMiddleware(req, res, next) {
  const startTime = Date.now();
  monitor.recordRequest();
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400) {
      monitor.recordError(new Error(`HTTP ${res.statusCode}`), `${req.method} ${req.path}`);
    }
  });
  
  next();
}

module.exports = {
  monitor,
  withMonitoring,
  withDbMonitoring,
  monitoringMiddleware
};