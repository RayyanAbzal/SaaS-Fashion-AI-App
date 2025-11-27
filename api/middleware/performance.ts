import { VercelRequest, VercelResponse } from '@vercel/node';

export const performanceMiddleware = (
  req: VercelRequest,
  res: VercelResponse,
  next?: Function
) => {
  const start = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Override res.end to track performance
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB

    // Log request performance
    const logData = {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      memory: `${memoryUsed.toFixed(2)}MB`,
      statusCode: res.statusCode
    };

    if (duration > 1000) {
      console.warn('⚠️  Slow request:', logData);
    } else {
      console.log('✅ Request:', logData);
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  if (next) next();
};

