# Testing Guide

This document describes the testing infrastructure for GuardiaVault.

## Testing Framework

We use **Vitest** for all tests (backend, frontend, and integration). Vitest is compatible with Vite and provides excellent TypeScript support.

## Test Types

### 1. Smart Contract Tests
- **Framework**: Hardhat + Chai
- **Location**: `test/GuardiaVault.test.ts`
- **Run**: `pnpm run test:contracts`

### 2. Backend API Tests
- **Framework**: Vitest + Supertest
- **Location**: `server/**/*.test.ts`
- **Run**: `pnpm run test:backend`
- **Watch**: `pnpm run test:watch`

### 3. Frontend Component Tests
- **Framework**: Vitest + React Testing Library
- **Location**: `client/src/**/*.test.{ts,tsx}`
- **Run**: `pnpm run test:frontend`
- **Watch**: `pnpm run test:watch:frontend`

## Running Tests

### Run All Tests
```bash
pnpm run test
```

This runs:
1. Smart contract tests (Hardhat)
2. Backend API tests (Vitest)
3. Frontend component tests (Vitest)

### Run Specific Test Suites
```bash
# Smart contracts only
pnpm run test:contracts

# Backend only
pnpm run test:backend

# Frontend only
pnpm run test:frontend
```

### Watch Mode
```bash
# Backend watch mode
pnpm run test:watch

# Frontend watch mode
pnpm run test:watch:frontend
```

### Test Coverage
```bash
# All coverage
pnpm run test:coverage

# Backend coverage only
pnpm run test:coverage:backend

# Frontend coverage only
pnpm run test:coverage:frontend
```

Coverage reports are generated in:
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- Text: Console output

## Writing Tests

### Backend API Tests

Example: Testing an authentication endpoint

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';

describe('POST /api/auth/register', () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

### Frontend Component Tests

Example: Testing a React component

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Service Tests

Example: Testing Shamir Secret Sharing

```typescript
import { describe, it, expect } from 'vitest';
import { splitSecret, combineShares } from './shamir';

describe('Shamir Secret Sharing', () => {
  it('should split and reconstruct secret', () => {
    const secret = 'test recovery phrase';
    const result = splitSecret(secret, 5, 3);
    
    // Should create 5 shares
    expect(result.shares).toHaveLength(5);
    
    // Should reconstruct from any 3 shares
    const reconstructed = combineShares(result.shares.slice(0, 3));
    expect(reconstructed).toBe(secret);
  });
});
```

## Test Structure

### Naming Conventions
- Test files: `*.test.ts` or `*.test.tsx`
- Test files: `*.spec.ts` or `*.spec.tsx`
- Keep tests close to the code they test

### Test Organization
```
server/
  services/
    shamir.ts
    shamir.test.ts  # Tests for shamir service
  routes.ts
  routes.test.ts    # Tests for API routes

client/src/
  components/
    Navigation.tsx
    Navigation.test.tsx  # Tests for Navigation component
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/teardown
- Don't rely on test execution order

### 2. Mock External Dependencies
- Mock database calls
- Mock external APIs (Stripe, SendGrid, etc.)
- Mock blockchain interactions

### 3. Test Behavior, Not Implementation
- Test what the code does, not how it does it
- Focus on user-facing behavior
- Avoid testing internal implementation details

### 4. Use Descriptive Test Names
```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should register a new user with valid email and password', () => { ... });
```

### 5. Arrange-Act-Assert Pattern
```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(30);
});
```

## Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./storage', () => ({
  storage: {
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
  },
}));
```

### Mocking Environment Variables

```typescript
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost/test');
```

### Mocking Web APIs (Frontend)

```typescript
// Mock window.ethereum
global.ethereum = {
  request: vi.fn(),
  isMetaMask: true,
} as any;
```

## Coverage Goals

Target coverage percentages:
- **Overall**: 80%+
- **Critical paths**: 95%+
- **Utilities**: 90%+
- **UI components**: 70%+

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual triggers

See `.github/workflows/ci.yml` for CI configuration (coming soon).

## Troubleshooting

### Tests Fail in CI but Pass Locally
- Check environment variables
- Ensure database is properly mocked
- Verify time-dependent tests handle timezones

### Tests Are Slow
- Use `vi.hoisted()` for expensive setups
- Mock heavy dependencies
- Split large test files

### Coverage Not Generating
- Ensure `@vitest/coverage-v8` is installed
- Check `vitest.config.ts` has coverage configured
- Run with `--coverage` flag

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

