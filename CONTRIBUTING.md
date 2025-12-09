# Contributing to ParaDex Wallet

Thank you for your interest in contributing to ParaDex Wallet! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Use welcoming and inclusive language
- Be respectful of different viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+ (`npm install -g pnpm`)
- Git
- Docker (optional, for local database)

### Installation

```bash
# Clone the repository
git clone https://github.com/guardiavault-oss/Paradexx.git
cd Paradexx

# Install dependencies
pnpm install

# Copy environment variables
cp config/.env.example .env.local

# Start development server
pnpm dev
```

### Project Structure

```
paradexwallet/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── stores/             # Zustand stores
│   ├── backend/            # Backend API (Express)
│   └── tests/              # Integration tests
├── services/               # Microservices
│   ├── guardiavault/       # Guardian vault service
│   ├── mevguard/           # MEV protection service
│   └── ...
├── tests/                  # Unit tests
├── docs/                   # Documentation
├── scripts/                # Build/dev scripts
└── .github/                # CI/CD workflows
```

## Development Workflow

### Starting Development

```bash
# Start frontend dev server
pnpm dev

# Start backend (separate terminal)
pnpm start:backend

# Or use the PowerShell script to start all services
./scripts/dev.ps1
```

### Available Scripts

| Script           | Description               |
| ---------------- | ------------------------- |
| `pnpm dev`       | Start development server  |
| `pnpm build`     | Build for production      |
| `pnpm test`      | Run tests in watch mode   |
| `pnpm test:ci`   | Run tests with coverage   |
| `pnpm lint`      | Run ESLint                |
| `pnpm lint:fix`  | Fix ESLint issues         |
| `pnpm format`    | Format code with Prettier |
| `pnpm typecheck` | TypeScript type checking  |

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/modifications

Example: `feature/add-wallet-connect-v2`

## Code Style

We use ESLint and Prettier to maintain consistent code style.

### TypeScript Guidelines

```typescript
// ✅ Use explicit types for function parameters and returns
function calculateBalance(amount: bigint, decimals: number): string {
  // implementation
}

// ✅ Use interfaces for object shapes
interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

// ✅ Use `const` assertions for constant objects
const SUPPORTED_CHAINS = [1, 137, 42161] as const;

// ❌ Avoid `any` type
function process(data: any) { } // Bad

// ✅ Use generics or unknown instead
function process<T>(data: T) { } // Good
```

### Component Guidelines

```tsx
// ✅ Use functional components with explicit props types
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}
```

### Pre-commit Hooks

Pre-commit hooks are set up with Husky and lint-staged:

- ESLint checks TypeScript files
- Prettier formats code
- TypeScript type checking

Commits will fail if there are linting errors.

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests once (CI mode)
pnpm test:ci

# Run with UI
pnpm test:ui

# Run specific test file
pnpm test tests/unit/wallet.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    expect(() => functionToTest(null)).toThrow();
  });
});
```

### Test Coverage

We aim for >80% code coverage on critical paths:

- Wallet connection logic
- Transaction signing
- API service functions
- Utility functions

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`
2. **Write/update tests** for your changes
3. **Ensure all tests pass**: `pnpm test:ci`
4. **Check linting**: `pnpm lint`
5. **Type check**: `pnpm typecheck`
6. **Update documentation** if needed

### PR Template

When creating a PR, include:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe testing performed

## Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. At least one maintainer approval required
2. All CI checks must pass
3. No merge conflicts
4. Code review feedback addressed

## Reporting Issues

### Bug Reports

Include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Error messages/screenshots if applicable

### Feature Requests

Include:

- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (optional)
- Alternative solutions considered

## Questions?

- Open a GitHub Discussion for general questions
- Join our Discord community (if available)
- Check existing issues before creating new ones

Thank you for contributing! 🎉
