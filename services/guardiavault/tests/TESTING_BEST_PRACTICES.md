# Testing Best Practices for GuardiaVault

This document outlines best practices for writing and maintaining tests in the GuardiaVault project.

## General Principles

### 1. Test Pyramid

Follow the test pyramid approach:
- **70% Unit Tests** - Fast, isolated, focused on single functions
- **20% Integration Tests** - Test component interactions
- **10% E2E Tests** - Test complete user journeys

### 2. AAA Pattern

Structure all tests using the Arrange-Act-Assert pattern:

```typescript
it('should calculate total with discount', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const discount = 0.1; // 10%

  // Act
  const total = calculateTotal(items, discount);

  // Assert
  expect(total).toBe(270);
});
```

### 3. Test Independence

- Tests should not depend on each other
- Each test should set up its own data
- Clean up after each test
- Tests should pass regardless of execution order

```typescript
beforeEach(() => {
  // Set up fresh state for each test
  vi.clearAllMocks();
  resetDatabase();
});

afterEach(() => {
  // Clean up
  clearTestData();
});
```

### 4. Descriptive Test Names

Use clear, descriptive names that explain what the test does:

```typescript
// ❌ Bad
it('test1', () => { ... });

// ✅ Good
it('should reject login with invalid password', () => { ... });
```

### 5. Test One Thing

Each test should verify a single behavior:

```typescript
// ❌ Bad - Testing multiple things
it('should handle user creation and login', () => {
  createUser();
  loginUser();
  // ...
});

// ✅ Good - Separate tests
it('should create user successfully', () => { ... });
it('should login with valid credentials', () => { ... });
```

## Unit Testing

### Mocking Best Practices

Mock external dependencies, not internal logic:

```typescript
// ✅ Good - Mock external service
vi.mock('@/lib/stripe', () => ({
  createPayment: vi.fn().mockResolvedValue({ id: 'payment_123' }),
}));

// ❌ Bad - Don't mock the function you're testing
vi.mock('@/services/vaultService', () => ({
  createVault: vi.fn().mockResolvedValue({ id: 'vault_123' }),
}));
```

### Testing Async Code

Always use async/await for async operations:

```typescript
it('should fetch user data', async () => {
  const user = await fetchUser('user-123');
  expect(user).toBeDefined();
});
```

### Edge Cases

Test edge cases and error conditions:

```typescript
describe('VaultService', () => {
  it('should handle empty guardian list', () => { ... });
  it('should handle duplicate guardians', () => { ... });
  it('should handle network timeout', () => { ... });
  it('should handle invalid vault ID', () => { ... });
});
```

## Integration Testing

### Database Testing

Use transactions for faster cleanup:

```typescript
beforeEach(async () => {
  await db.transaction(async (trx) => {
    // Run test in transaction
    // Automatically rolled back after test
  });
});
```

### API Testing

Test both success and failure cases:

```typescript
describe('POST /api/vaults', () => {
  it('should create vault with valid data', async () => {
    const response = await request(app)
      .post('/api/vaults')
      .send(validVaultData)
      .expect(201);
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/vaults')
      .send(invalidVaultData)
      .expect(400);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/vaults')
      .send(validVaultData)
      .expect(401);
  });
});
```

## E2E Testing

### Page Object Pattern

Use page objects to reduce duplication:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('test@example.com', 'password');
  // ...
});
```

### Avoid Hardcoded Waits

Use Playwright's auto-waiting features:

```typescript
// ❌ Bad
await page.click('button');
await page.waitForTimeout(5000);

// ✅ Good
await page.click('button');
await page.waitForSelector('.success-message');
```

### Test Data Cleanup

Clean up test data after E2E tests:

```typescript
test.afterEach(async () => {
  await cleanupTestUser();
  await cleanupTestVaults();
});
```

## Smart Contract Testing

### Gas Optimization

Test gas consumption:

```typescript
it('should optimize gas for vault creation', async () => {
  const tx = await vault.createVault(...args);
  const receipt = await tx.wait();
  expect(receipt.gasUsed).toBeLessThan(500000);
});
```

### Event Testing

Verify contract events:

```typescript
it('should emit VaultCreated event', async () => {
  await expect(vault.createVault(...args))
    .to.emit(vault, 'VaultCreated')
    .withArgs(vaultId, owner, guardians);
});
```

### Revert Testing

Test require/revert conditions:

```typescript
it('should revert with insufficient guardians', async () => {
  await expect(
    vault.createVault(name, [guardian1]) // Only 1 guardian
  ).to.be.revertedWith('Minimum 3 guardians required');
});
```

## Load Testing

### Realistic Scenarios

Model real user behavior:

```typescript
export default function () {
  // Think time
  sleep(Math.random() * 3 + 1);

  // User actions
  login();
  sleep(2);
  viewDashboard();
  sleep(3);
  checkIn();
  sleep(1);
  logout();
}
```

### Gradual Ramp-up

Don't spike traffic immediately:

```yaml
phases:
  - duration: 120
    arrivalRate: 10
    rampTo: 100 # Gradual increase
  - duration: 300
    arrivalRate: 100 # Sustained load
```

## Security Testing

### Test Security Controls

Verify security measures work:

```typescript
it('should enforce rate limiting', async () => {
  const requests = Array(100).fill(null).map(() =>
    request(app).post('/api/auth/login').send(credentials)
  );

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429);

  expect(rateLimited.length).toBeGreaterThan(0);
});
```

### Test Authentication

Verify protected routes:

```typescript
it('should reject unauthenticated requests', async () => {
  await request(app)
    .get('/api/vaults')
    .expect(401);
});
```

## Code Coverage

### Coverage Goals

Aim for these coverage targets:
- Smart Contracts: 90%+
- Backend Services: 85%+
- API Routes: 80%+
- Frontend Components: 75%+

### Coverage != Quality

High coverage doesn't guarantee quality:

```typescript
// ❌ Bad - High coverage, poor test
it('should create vault', () => {
  createVault(); // No assertions!
});

// ✅ Good - Meaningful assertions
it('should create vault with valid data', () => {
  const vault = createVault(data);
  expect(vault.id).toBeDefined();
  expect(vault.guardians).toHaveLength(3);
});
```

## Continuous Improvement

### Review Test Failures

When tests fail:
1. Understand why (real bug or flaky test?)
2. Fix the root cause
3. Add tests to prevent regression

### Refactor Tests

Keep tests maintainable:
- Extract common setup to fixtures
- Use helper functions for repetitive code
- Remove obsolete tests

### Monitor Test Performance

- Keep test suite fast (< 10 minutes)
- Identify and optimize slow tests
- Run unit tests most frequently
- Run E2E tests less frequently

## Common Pitfalls

### ❌ Don't

- Test implementation details
- Write tests that depend on execution order
- Mock everything (defeats the purpose)
- Ignore flaky tests
- Write tests that take too long
- Test third-party libraries
- Hardcode test data

### ✅ Do

- Test behavior and outcomes
- Keep tests independent
- Mock external dependencies only
- Fix flaky tests immediately
- Keep tests fast
- Trust library tests
- Use factories and fixtures

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [K6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)

---

**Remember**: Good tests give you confidence to refactor and ship faster!
