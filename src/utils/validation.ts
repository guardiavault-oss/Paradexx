/**
 * Validation Utilities
 */

import { errorHelpers } from './errorHandler';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate ENS name
 */
export function isValidENS(name: string): boolean {
  return /^[a-z0-9-]+\.eth$/.test(name);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?1?\d{10}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate amount (positive number)
 */
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

/**
 * Validate private key
 */
export function isValidPrivateKey(key: string): boolean {
  return /^(0x)?[a-fA-F0-9]{64}$/.test(key);
}

/**
 * Validate seed phrase (12 or 24 words)
 */
export function isValidSeedPhrase(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string
): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  // Calculate strength
  if (errors.length === 0) {
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }

  return {
    valid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Validate data against schema
 */
export function validate(data: any, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors: string[] = [];

    for (const rule of rules) {
      if (!rule.validate(value)) {
        fieldErrors.push(rule.message);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation rules
 */
export const rules = {
  required: (message: string = 'This field is required'): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  email: (message: string = 'Invalid email address'): ValidationRule<string> => ({
    validate: isValidEmail,
    message,
  }),

  address: (message: string = 'Invalid Ethereum address'): ValidationRule<string> => ({
    validate: isValidAddress,
    message,
  }),

  txHash: (message: string = 'Invalid transaction hash'): ValidationRule<string> => ({
    validate: isValidTxHash,
    message,
  }),

  url: (message: string = 'Invalid URL'): ValidationRule<string> => ({
    validate: isValidURL,
    message,
  }),

  phone: (message: string = 'Invalid phone number'): ValidationRule<string> => ({
    validate: isValidPhone,
    message,
  }),

  amount: (message: string = 'Invalid amount'): ValidationRule<string | number> => ({
    validate: isValidAmount,
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),

  custom: <T>(
    validator: (value: T) => boolean,
    message: string
  ): ValidationRule<T> => ({
    validate: validator,
    message,
  }),
};

/**
 * Sanitize input
 */
export function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Sanitize address (normalize to checksum)
 */
export function sanitizeAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw errorHelpers.validationError('Invalid Ethereum address');
  }
  return address.toLowerCase();
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

/**
 * Assert validation
 */
export function assertValid(data: any, schema: ValidationSchema): void {
  const result = validate(data, schema);
  if (!result.valid) {
    throw errorHelpers.validationError(
      'Validation failed',
      {
        errors: result.errors,
        formatted: formatValidationErrors(result.errors),
      }
    );
  }
}

/**
 * Example schemas
 */
export const schemas = {
  walletConnection: {
    address: [rules.required(), rules.address()],
    network: [rules.required()],
  },

  transaction: {
    to: [rules.required(), rules.address()],
    amount: [rules.required(), rules.amount()],
  },

  profile: {
    email: [rules.email()],
    username: [rules.required(), rules.minLength(3), rules.maxLength(20)],
  },

  guardian: {
    address: [rules.required(), rules.address()],
    name: [rules.required(), rules.minLength(2), rules.maxLength(50)],
  },
};
