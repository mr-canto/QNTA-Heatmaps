/**
 * Application Logger
 *
 * A production-ready logging utility that provides structured logging
 * with different log levels and context support.
 *
 * In development: Logs to console with formatting
 * In production: Could be extended to send to a logging service
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Determine if we're in development mode.
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Format a log entry for console output.
 */
function formatLogEntry(entry: LogEntry): string {
  const contextStr = entry.context
    ? ` | ${JSON.stringify(entry.context)}`
    : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

/**
 * Get the current timestamp in ISO format.
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log a message at the specified level.
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    context,
  };

  // In production, we suppress debug logs
  if (!isDevelopment && level === "debug") {
    return;
  }

  // Format the log entry
  const formattedMessage = formatLogEntry(entry);

  // Output to appropriate console method
  switch (level) {
    case "debug":
      // Debug only in development
      if (isDevelopment) {
        console.debug(formattedMessage);
      }
      break;
    case "info":
      // Info only in development to avoid console noise in production
      if (isDevelopment) {
        console.info(formattedMessage);
      }
      break;
    case "warn":
      // Warnings are shown in both development and production
      console.warn(formattedMessage);
      break;
    case "error":
      // Errors are always shown
      console.error(formattedMessage);
      break;
  }

  // In production, errors could be sent to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (!isDevelopment && level === 'error') {
  //   sendToErrorTrackingService(entry);
  // }
}

/**
 * Logger interface providing methods for each log level.
 */
export const logger = {
  /**
   * Log a debug message. Only visible in development.
   */
  debug: (message: string, context?: LogContext): void => {
    log("debug", message, context);
  },

  /**
   * Log an informational message. Only visible in development.
   */
  info: (message: string, context?: LogContext): void => {
    log("info", message, context);
  },

  /**
   * Log a warning message. Visible in both development and production.
   */
  warn: (message: string, context?: LogContext): void => {
    log("warn", message, context);
  },

  /**
   * Log an error message. Always visible and could be sent to error tracking.
   */
  error: (message: string, context?: LogContext): void => {
    log("error", message, context);
  },
};

export default logger;
