/**
 * Environment Variable Validation
 * 
 * CRITICAL SECURITY: This validator ensures all required secrets are set
 * and fails fast with clear error messages if any are missing.
 * 
 * NO FALLBACK VALUES - The application will crash immediately if secrets are missing.
 */

import { logError, logInfo } from "../services/logger";

interface EnvValidationRule {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * Validation rules for environment variables
 */
const validationRules: EnvValidationRule[] = [
  {
    name: "NODE_ENV",
    required: true,
    validate: (value) => ["development", "staging", "production", "test"].includes(value),
    errorMessage: "NODE_ENV must be one of: development, staging, production, test",
  },
  {
    name: "SESSION_SECRET",
    required: true, // ALWAYS required - no fallback allowed
    validate: (value) => {
      // Must be at least 32 characters
      if (value.length < 32) {
        return false;
      }
      // Must not be a default/fallback value
      const forbiddenValues = [
        "dev-secret-change-in-production-PLEASE-CHANGE-THIS",
        "guardiavault-dev-secret-change-in-production",
        "fallback-secret-change-in-production",
        "change-me-in-production",
        "test-secret",
        "development-secret",
      ];
      if (forbiddenValues.includes(value)) {
        return false;
      }
      return true;
    },
    errorMessage: "SESSION_SECRET must be at least 32 characters and not a default/fallback value",
  },
  {
    name: "WIZARD_ENCRYPTION_KEY",
    required: true, // ALWAYS required - no fallback allowed
    validate: (value) => {
      // Must be 64 hex characters (32 bytes)
      if (!/^[0-9a-fA-F]{64}$/i.test(value)) {
        return false;
      }
      // Must not contain placeholder text
      if (value.toLowerCase().includes("change") || value.toLowerCase().includes("default")) {
        return false;
      }
      return true;
    },
    errorMessage: "WIZARD_ENCRYPTION_KEY must be 64 hex characters (32 bytes) and not contain placeholder text",
  },
  {
    name: "ENCRYPTION_KEY",
    required: process.env.NODE_ENV === "production",
    validate: (value) => {
      if (process.env.NODE_ENV === "production") {
        // Must be 64 hex characters (32 bytes)
        if (!/^[0-9a-fA-F]{64}$/i.test(value)) {
          return false;
        }
        // Must not contain placeholder text
        if (value.toLowerCase().includes("change") || value.toLowerCase().includes("default")) {
          return false;
        }
      }
      return true;
    },
    errorMessage: "ENCRYPTION_KEY must be 64 hex characters and not contain placeholder text in production",
  },
  {
    name: "SSN_SALT",
    required: process.env.NODE_ENV === "production",
    validate: (value) => {
      if (process.env.NODE_ENV === "production") {
        if (value.length < 16) {
          return false;
        }
        if (value.toLowerCase().includes("change") || value.toLowerCase().includes("default")) {
          return false;
        }
      }
      return true;
    },
    errorMessage: "SSN_SALT must be at least 16 characters and not contain placeholder text in production",
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
    errorMessage: "DATABASE_URL must start with 'postgresql://' or 'postgres://'",
  },
  {
    name: "PORT",
    required: false,
    validate: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    errorMessage: "PORT must be a valid port number (1-65535)",
  },
  {
    name: "DEMO_PASSWORD",
    required: false, // Only required if demo account is enabled
    validate: (value) => {
      // If DEMO_ACCOUNT_ENABLED is true, password must be set
      if (process.env.DEMO_ACCOUNT_ENABLED === "true") {
        if (!value || value.length < 8) {
          return false;
        }
      }
      return true;
    },
    errorMessage: "DEMO_PASSWORD must be at least 8 characters when DEMO_ACCOUNT_ENABLED=true",
    warningMessage: "DEMO_PASSWORD is not set - demo account will be disabled",
  },
];

/**
 * Validate all environment variables
 * Throws error if validation fails - FAILS FAST with no fallbacks
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  logInfo("🔒 Validating environment variables (FAIL-FAST mode - no fallbacks allowed)...", {});

  for (const rule of validationRules) {
    const value = process.env[rule.name];

    // Check if required
    if (rule.required && !value) {
      errors.push(
        `❌ ${rule.name} is REQUIRED but not set. Application will not start without this secret.`
      );
      continue;
    }

    // Skip validation if not set and not required
    if (!value) {
      if (rule.warningMessage) {
        warnings.push(`⚠️  ${rule.name}: ${rule.warningMessage}`);
      }
      continue;
    }

    // Run custom validation
    if (rule.validate && !rule.validate(value)) {
      errors.push(
        `❌ ${rule.name} validation failed: ${rule.errorMessage || "Invalid value"}`
      );
    }
  }

  // Check for demo account in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.DEMO_ACCOUNT_ENABLED === "true") {
      errors.push(
        "❌ DEMO_ACCOUNT_ENABLED cannot be 'true' in production. Set DEMO_ACCOUNT_ENABLED=false or remove it."
      );
    }
  }

  // Log warnings (non-blocking)
  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(warning);
    });
  }

  // Throw errors (blocking) - FAIL FAST
  if (errors.length > 0) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║  CRITICAL SECURITY ERROR: Missing Required Environment Variables║
╚════════════════════════════════════════════════════════════════╝

${errors.join("\n\n")}

🔒 SECURITY POLICY: This application requires all secrets to be set.
   NO FALLBACK VALUES are allowed for security reasons.

📝 ACTION REQUIRED:
   1. Set all required environment variables
   2. Generate secure secrets (use: pnpm run generate:secrets)
   3. Never use default/fallback values in production

💡 TIP: See env.example for all required variables
`;
    
    console.error(errorMessage);
    logError(new Error("Environment validation failed - FAIL FAST"), {
      errors,
      warnings,
      nodeEnv: process.env.NODE_ENV,
    });
    
    // CRASH IMMEDIATELY - No fallbacks allowed
    process.exit(1);
  }

  logInfo("✅ Environment variables validated successfully - all secrets are set", {});
}

/**
 * Get a validated environment variable or throw error
 * NO FALLBACKS - Will crash if not set
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    const error = `CRITICAL: Environment variable ${name} is required but not set. Application cannot start.`;
    console.error(`❌ ${error}`);
    logError(new Error(error), { envVar: name });
    process.exit(1);
  }

  return value;
}

/**
 * Get an optional environment variable with default
 * Use only for non-security related variables
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

/**
 * Check if demo account should be enabled
 * Demo account is NEVER enabled in production
 */
export function isDemoAccountEnabled(): boolean {
  // Allow demo account in production if explicitly enabled via environment variable
  // This is useful for testing and demos, but should be used with caution
  if (process.env.NODE_ENV === "production") {
    // Only enable if explicitly set to true AND DEMO_PASSWORD is provided
    return process.env.DEMO_ACCOUNT_ENABLED === "true" && !!process.env.DEMO_PASSWORD;
  }
  return getEnvBoolean("DEMO_ACCOUNT_ENABLED", false);
}

/**
 * Get demo account password from environment
 * Returns undefined if demo account is disabled
 */
export function getDemoPassword(): string | undefined {
  if (!isDemoAccountEnabled()) {
    return undefined;
  }
  return process.env.DEMO_PASSWORD;
}

