/**
 * Environment Variable Validator
 * Validates required environment variables on startup
 * Fails fast with clear error messages if required vars are missing
 */

import { logError, logInfo } from "../services/logger";

interface EnvValidationRule {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
  message?: string;
}

const validationRules: EnvValidationRule[] = [
  {
    name: "NODE_ENV",
    required: true,
    validate: (value) => ["development", "staging", "production", "test"].includes(value),
    message: "NODE_ENV must be one of: development, staging, production, test",
  },
  {
    name: "SESSION_SECRET",
    required: process.env.NODE_ENV === "production",
    validate: (value) => {
      if (process.env.NODE_ENV === "production") {
        // In production, must be a strong secret (at least 32 characters)
        return value.length >= 32 && value !== "dev-secret-change-in-production-PLEASE-CHANGE-THIS";
      }
      return true;
    },
    message: "SESSION_SECRET must be at least 32 characters and not the default value in production",
  },
  {
    name: "ENCRYPTION_KEY",
    required: process.env.NODE_ENV === "production",
    validate: (value) => {
      if (process.env.NODE_ENV === "production") {
        // Must be 64 hex characters (32 bytes)
        return /^[0-9a-fA-F]{64}$/.test(value) && !value.includes("CHANGE_THIS");
      }
      return true;
    },
    message: "ENCRYPTION_KEY must be 64 hex characters and not contain 'CHANGE_THIS' in production",
  },
  {
    name: "SSN_SALT",
    required: process.env.NODE_ENV === "production",
    validate: (value) => {
      if (process.env.NODE_ENV === "production") {
        return !value.includes("CHANGE_THIS") && value.length >= 16;
      }
      return true;
    },
    message: "SSN_SALT must be at least 16 characters and not contain 'CHANGE_THIS' in production",
  },
  {
    name: "DATABASE_URL",
    required: false, // Optional - falls back to in-memory storage
    validate: (value) => {
      if (value) {
        return value.startsWith("postgresql://") || value.startsWith("postgres://");
      }
      return true;
    },
    message: "DATABASE_URL must start with 'postgresql://' or 'postgres://'",
  },
  {
    name: "PORT",
    required: false,
    validate: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    message: "PORT must be a valid port number (1-65535)",
  },
];

/**
 * Validate all environment variables
 * Throws error if validation fails
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  logInfo("Validating environment variables...", {});

  for (const rule of validationRules) {
    const value = process.env[rule.name];

    // Check if required
    if (rule.required && !value) {
      errors.push(`❌ ${rule.name} is required but not set`);
      continue;
    }

    // Skip validation if not set and not required
    if (!value) {
      if (!rule.required) {
        warnings.push(`⚠️  ${rule.name} is not set (optional)`);
      }
      continue;
    }

    // Run custom validation
    if (rule.validate && !rule.validate(value)) {
      errors.push(
        `❌ ${rule.name} validation failed: ${rule.message || "Invalid value"}`
      );
    }
  }

  // Log warnings (non-blocking)
  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(warning);
    });
  }

  // Throw errors (blocking)
  if (errors.length > 0) {
    const errorMessage = `\n❌ Environment validation failed:\n${errors.join("\n")}\n`;
    console.error(errorMessage);
    logError(new Error("Environment validation failed"), {
      errors,
      warnings,
    });
    throw new Error("Environment validation failed. See errors above.");
  }

  logInfo("✅ Environment variables validated successfully", {});
}

/**
 * Get a validated environment variable or throw error
 */
export function getEnv(name: string, required = true): string {
  const value = process.env[name];

  if (required && !value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }

  return value || "";
}

/**
 * Get a validated environment variable with default
 */
export function getEnvWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Get a boolean environment variable
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get a number environment variable
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

