/**
 * Vault Test Fixtures
 * Reusable test data for vault-related tests
 */

export interface TestVault {
  id?: string;
  userId: string;
  name: string;
  guardians: string[];
  checkInInterval: number;
  lastCheckIn?: Date;
  gracePeriodEnds?: Date | null;
  status?: 'active' | 'grace_period' | 'triggered' | 'claimed';
  createdAt?: Date;
  encryptedData?: string;
}

export const defaultTestVault: TestVault = {
  id: 'vault-test-123',
  userId: 'user-test-123',
  name: 'Test Vault',
  guardians: [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
  ],
  checkInInterval: 30,
  lastCheckIn: new Date(),
  gracePeriodEnds: null,
  status: 'active',
  createdAt: new Date('2024-01-01'),
};

export const testVaults = {
  activeVault: {
    id: 'vault-1',
    userId: 'user-1',
    name: 'Active Vault',
    guardians: [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ],
    checkInInterval: 30,
    lastCheckIn: new Date(),
    status: 'active' as const,
  },
  gracePeriodVault: {
    id: 'vault-2',
    userId: 'user-2',
    name: 'Grace Period Vault',
    guardians: [
      '0x4444444444444444444444444444444444444444',
      '0x5555555555555555555555555555555555555555',
      '0x6666666666666666666666666666666666666666',
    ],
    checkInInterval: 30,
    lastCheckIn: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    gracePeriodEnds: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'grace_period' as const,
  },
  triggeredVault: {
    id: 'vault-3',
    userId: 'user-3',
    name: 'Triggered Vault',
    guardians: [
      '0x7777777777777777777777777777777777777777',
      '0x8888888888888888888888888888888888888888',
      '0x9999999999999999999999999999999999999999',
    ],
    checkInInterval: 30,
    lastCheckIn: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    gracePeriodEnds: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'triggered' as const,
  },
};

/**
 * Create a test vault with optional overrides
 */
export function createTestVault(overrides?: Partial<TestVault>): TestVault {
  return {
    ...defaultTestVault,
    ...overrides,
    id: overrides?.id || `vault-test-${Date.now()}`,
    name: overrides?.name || `Test Vault ${Date.now()}`,
  };
}

/**
 * Create multiple test vaults
 */
export function createTestVaults(count: number, userId?: string): TestVault[] {
  return Array.from({ length: count }, (_, i) =>
    createTestVault({
      id: `vault-test-${i}-${Date.now()}`,
      name: `Test Vault ${i + 1}`,
      userId: userId || `user-test-${Date.now()}`,
    })
  );
}

/**
 * Generate random Ethereum address for testing
 */
export function generateTestEthAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Create test guardian addresses
 */
export function createTestGuardianAddresses(count: number = 3): string[] {
  return Array.from({ length: count }, () => generateTestEthAddress());
}
