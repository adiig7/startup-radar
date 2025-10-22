// Enhanced logging utility controlled by IS_LOGGING_ENABLED environment variable

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isEnabled: boolean;
  private namespace: string;

  constructor(namespace: string = 'App') {
    this.namespace = namespace;
    this.isEnabled = process.env.IS_LOGGING_ENABLED === 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`;

    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message}\n${JSON.stringify(context, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  private shouldLog(): boolean {
    // Always log errors, regardless of IS_LOGGING_ENABLED
    return this.isEnabled;
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog()) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog()) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    // Always log errors
    const errorContext = {
      ...context,
      ...(error && {
        errorMessage: error.message || String(error),
        errorStack: error.stack,
        errorName: error.name,
      }),
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog()) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Create a child logger with extended namespace
  child(childNamespace: string): Logger {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }
}

// Export factory function for creating loggers
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

// Export default logger
export const logger = new Logger('SignalScout');
