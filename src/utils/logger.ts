/**
 * Structured logging utility
 * Provides consistent log formatting across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service?: string;
  sessionId?: string;
  videoId?: string;
  clipName?: string;
  duration?: number;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Format a structured log entry
 */
function formatLog(log: StructuredLog): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (easy to parse)
    return JSON.stringify(log);
  }

  // Human-readable format for development
  const prefix = `[${log.timestamp}] ${log.level.toUpperCase().padEnd(5)}`;
  let output = `${prefix} ${log.message}`;

  if (log.context) {
    const contextStr = Object.entries(log.context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    if (contextStr) {
      output += ` | ${contextStr}`;
    }
  }

  if (log.error) {
    output += ` | error=${log.error.message}`;
  }

  return output;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      };
    }

    const formatted = formatLog(logEntry);

    switch (level) {
      case 'debug':
        if (process.env.LOG_LEVEL === 'debug') {
          console.debug(formatted);
        }
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }
}

// Export default logger instance
export const logger = new Logger({ service: 'whop-clipping-agency' });

// Export for creating child loggers
export { Logger };
export type { LogContext, LogLevel };
