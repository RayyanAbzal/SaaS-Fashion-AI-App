// Circuit Breaker Pattern Implementation
// Aligned with PDF: "Circuit breakers prevent external API outages from cascading into failures"
// Based on Martin Fowler's Circuit Breaker pattern

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation, requests pass through
  OPEN = 'OPEN',          // Failing, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;       // Number of successes to close from half-open
  timeout: number;                // Time in ms before attempting recovery
  resetTimeout: number;           // Time in ms before transitioning from OPEN to HALF_OPEN
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  totalFailures: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes in half-open
  timeout: 10000,           // 10 second timeout per request
  resetTimeout: 60000,      // 60 seconds before attempting recovery
};

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private config: CircuitBreakerConfig;
  private resetTimer?: NodeJS.Timeout;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        // Circuit is open, fail fast
        if (fallback) {
          console.warn(`[Circuit Breaker] Circuit OPEN, using fallback`);
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        ),
      ]);

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      
      // Use fallback if available
      if (fallback) {
        console.warn(`[Circuit Breaker] Request failed, using fallback:`, error);
        try {
          return await fallback();
        } catch (fallbackError) {
          throw new Error(`Circuit breaker fallback also failed: ${fallbackError}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if we should attempt to reset (transition from OPEN to HALF_OPEN)
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceFailure >= this.config.resetTimeout;
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.totalFailures++;
    this.lastFailureTime = new Date();
    this.successes = 0;
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during half-open, go back to open
      this.transitionToOpen();
    } else if (this.failures >= this.config.failureThreshold) {
      // Too many failures, open the circuit
      this.transitionToOpen();
    }
  }

  /**
   * Transition to CLOSED state (normal operation)
   */
  private transitionToClosed(): void {
    console.log('[Circuit Breaker] Transitioning to CLOSED (normal operation)');
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.clearResetTimer();
  }

  /**
   * Transition to OPEN state (failing)
   */
  private transitionToOpen(): void {
    console.warn(`[Circuit Breaker] Transitioning to OPEN (service failing)`);
    this.state = CircuitState.OPEN;
    this.failures = 0; // Reset counter for next attempt
    
    // Schedule transition to half-open after reset timeout
    this.clearResetTimer();
    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transitionToHalfOpen();
      }
    }, this.config.resetTimeout);
  }

  /**
   * Transition to HALF_OPEN state (testing recovery)
   */
  private transitionToHalfOpen(): void {
    console.log('[Circuit Breaker] Transitioning to HALF_OPEN (testing recovery)');
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    this.failures = 0;
    this.clearResetTimer();
  }

  /**
   * Clear reset timer
   */
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  /**
   * Reset circuit breaker to CLOSED state (for testing/manual reset)
   */
  reset(): void {
    this.transitionToClosed();
  }

  /**
   * Check if circuit is healthy (CLOSED or HALF_OPEN)
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, serviceName) => {
      stats[serviceName] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Convenience function to execute with circuit breaker
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config);
  return breaker.execute(fn, fallback);
}

export default CircuitBreaker;

