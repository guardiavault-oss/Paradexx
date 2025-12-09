/**
 * User-friendly error messages
 * Maps error codes and status codes to helpful messages
 */

export interface ErrorContext {
  code?: string;
  status?: number;
  message?: string;
  field?: string;
}

export function getUserFriendlyError(context: ErrorContext): {
  title: string;
  message: string;
  action?: string;
} {
  const { code, status, message, field } = context;

  // Network errors
  if (code === "NETWORK_ERROR" || message?.includes("fetch")) {
    return {
      title: "Connection Problem",
      message: "Please check your internet connection and try again.",
      action: "Check Connection",
    };
  }

  // Timeout errors
  if (code === "TIMEOUT" || message?.includes("timeout")) {
    return {
      title: "Request Timed Out",
      message: "The request took too long. Please try again.",
      action: "Retry",
    };
  }

  // HTTP status codes
  if (status === 400) {
    return {
      title: "Invalid Request",
      message: message || "Please check your input and try again.",
      action: field ? `Fix ${field}` : "Fix Input",
    };
  }

  if (status === 401) {
    return {
      title: "Authentication Required",
      message: "Please log in to continue.",
      action: "Log In",
    };
  }

  if (status === 403) {
    return {
      title: "Access Denied",
      message: "You don't have permission to perform this action.",
      action: "Contact Support",
    };
  }

  if (status === 404) {
    return {
      title: "Not Found",
      message: "The requested resource was not found.",
      action: "Go to Dashboard",
    };
  }

  if (status === 409) {
    return {
      title: "Conflict",
      message: message || "This action conflicts with existing data.",
      action: "Review and Retry",
    };
  }

  if (status === 429) {
    return {
      title: "Too Many Requests",
      message: "Please wait a moment before trying again.",
      action: "Wait and Retry",
    };
  }

  if (status === 500) {
    return {
      title: "Server Error",
      message: "Something went wrong on our end. We're working on it.",
      action: "Try Again Later",
    };
  }

  if (status === 503) {
    return {
      title: "Service Unavailable",
      message: "The service is temporarily unavailable. Please try again soon.",
      action: "Retry Later",
    };
  }

  // Tier limit errors
  if (code === "TIER_LIMIT_EXCEEDED") {
    return {
      title: "Plan Limit Reached",
      message: message || "Upgrade your plan to access this feature.",
      action: "Upgrade Plan",
    };
  }

  // Generic error
  if (message) {
    return {
      title: "Error",
      message,
    };
  }

  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    action: "Retry",
  };
}

