/**
 * Logger Utility
 * Structured logging for analytics, debugging, and monitoring
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private module: string;
  private logs: LogEntry[] = [];

  constructor(module: string) {
    this.module = module;
  }

  /**
   * Log informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      metadata,
    };

    this.logs.push(entry);

    // In production, this would send to a logging service (e.g., Winston, Bunyan, Datadog)
    // For now, we format for console output
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.module}]`;
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}${metadataStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}${metadataStr}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}${metadataStr}`);
        break;
      default:
        console.log(`${prefix} ${message}${metadataStr}`);
    }
  }

  /**
   * Get all logs for this module
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getStats(): Record<LogLevel, number> {
    return this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);
  }
}

/**
 * Create a logger instance for a module
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}
