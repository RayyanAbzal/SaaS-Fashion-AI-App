import { supabase, isSupabaseConfigured } from './supabase';

export interface DatabaseHealth {
  isConnected: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

class DatabaseHealthService {
  private static lastHealthCheck: DatabaseHealth | null = null;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Check database connection health
   */
  static async checkHealth(): Promise<DatabaseHealth> {
    if (!isSupabaseConfigured()) {
      return {
        isConnected: false,
        responseTime: 0,
        lastChecked: new Date(),
        error: 'Supabase not configured',
      };
    }

    const startTime = Date.now();
    
    try {
      // Simple query to check connection - use auth.users which always exists
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        ),
      ]);

      const responseTime = Date.now() - startTime;

      // Auth check doesn't require error to mean connection failed
      // If we get a response (even if no user), connection is working
      const health: DatabaseHealth = {
        isConnected: !error || error.message.includes('JWT') || error.message.includes('session'),
        responseTime,
        lastChecked: new Date(),
        error: error ? error.message : undefined,
      };
      this.lastHealthCheck = health;
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const health: DatabaseHealth = {
        isConnected: false,
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.lastHealthCheck = health;
      return health;
    }
  }

  /**
   * Get last health check result
   */
  static getLastHealthCheck(): DatabaseHealth | null {
    return this.lastHealthCheck;
  }

  /**
   * Check if database is healthy (connected and responsive)
   */
  static async isHealthy(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.isConnected && health.responseTime < 3000; // Healthy if < 3s response
  }

  /**
   * Start periodic health checks
   */
  static startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check immediately
    this.checkHealth();

    // Then check periodically
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  static stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Wait for database to be healthy with retries
   */
  static async waitForHealthy(
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const isHealthy = await this.isHealthy();
      if (isHealthy) {
        return true;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  }
}

export default DatabaseHealthService;

