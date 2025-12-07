/**
 * User Test Fixtures
 * Reusable test data for user-related tests
 */

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin' | 'guardian';
  createdAt?: Date;
}

export const defaultTestUser: TestUser = {
  id: 'user-test-123',
  email: 'test@guardiavault.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  createdAt: new Date('2024-01-01'),
};

export const testUsers = {
  user1: {
    id: 'user-1',
    email: 'user1@guardiavault.com',
    password: 'Password123!',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'user' as const,
  },
  user2: {
    id: 'user-2',
    email: 'user2@guardiavault.com',
    password: 'Password123!',
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'user' as const,
  },
  admin: {
    id: 'admin-1',
    email: 'admin@guardiavault.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
  },
  guardian1: {
    id: 'guardian-1',
    email: 'guardian1@example.com',
    password: 'Guardian123!',
    firstName: 'Guardian',
    lastName: 'One',
    role: 'guardian' as const,
  },
  guardian2: {
    id: 'guardian-2',
    email: 'guardian2@example.com',
    password: 'Guardian123!',
    firstName: 'Guardian',
    lastName: 'Two',
    role: 'guardian' as const,
  },
  guardian3: {
    id: 'guardian-3',
    email: 'guardian3@example.com',
    password: 'Guardian123!',
    firstName: 'Guardian',
    lastName: 'Three',
    role: 'guardian' as const,
  },
};

/**
 * Create a test user with optional overrides
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    ...defaultTestUser,
    ...overrides,
    email: overrides?.email || `test-${Date.now()}@guardiavault.com`,
    id: overrides?.id || `user-test-${Date.now()}`,
  };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({
      email: `test-user-${i}-${Date.now()}@guardiavault.com`,
      id: `user-test-${i}-${Date.now()}`,
    })
  );
}

/**
 * Create test guardian users
 */
export function createGuardianUsers(count: number = 3): TestUser[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({
      email: `guardian-${i}-${Date.now()}@guardiavault.com`,
      id: `guardian-test-${i}-${Date.now()}`,
      role: 'guardian',
      firstName: `Guardian`,
      lastName: `${i + 1}`,
    })
  );
}
