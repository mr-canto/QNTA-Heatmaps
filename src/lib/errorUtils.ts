/**
 * Error handling utilities for user-friendly error messages and recovery.
 */

/**
 * Convert technical error messages to user-friendly text.
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes("failed to fetch") || message.includes("network")) {
      return "Unable to connect to the server. Please check your internet connection.";
    }

    // Timeout errors
    if (message.includes("timeout")) {
      return "The request took too long. Please try again.";
    }

    // Authentication errors
    if (message.includes("jwt") || message.includes("token") || message.includes("auth")) {
      return "Your session has expired. Please sign in again.";
    }

    // Rate limiting
    if (message.includes("rate limit") || message.includes("too many requests")) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // Database errors
    if (message.includes("pgrst") || message.includes("database")) {
      return "A database error occurred. Please try again later.";
    }

    // Supabase permission errors
    if (message.includes("permission") || message.includes("denied") || message.includes("rls")) {
      return "You do not have permission to perform this action.";
    }

    // Generic API errors - extract user-friendly part
    if (error.message.includes(":")) {
      // Take the part after the colon which is usually more descriptive
      const parts = error.message.split(":");
      const lastPart = parts[parts.length - 1].trim();
      if (lastPart.length > 0 && lastPart.length < 100) {
        return lastPart;
      }
    }

    // Return the original message if it's reasonably short and clear
    if (error.message.length < 100 && !message.includes("error")) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if an error is a network connectivity issue.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("offline") ||
      message.includes("internet")
    );
  }
  return false;
}

/**
 * Check if an error is an authentication/session error.
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("jwt") ||
      message.includes("token") ||
      message.includes("auth") ||
      message.includes("session") ||
      message.includes("expired") ||
      message.includes("unauthorized")
    );
  }
  return false;
}
