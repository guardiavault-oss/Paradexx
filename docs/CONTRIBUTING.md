# Contributing Guidelines

Thank you for contributing to RegenX! This guide will help you get started.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Testing](#testing)
5. [Pull Request Process](#pull-request-process)
6. [Commit Guidelines](#commit-guidelines)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/regenx.git
cd regenx

# Add upstream remote
git remote add upstream https://github.com/regenx/regenx.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Environment Setup

```bash
# Copy example env file
cp .env.example .env.development

# Edit with your configuration
```

### Run Development Server

```bash
npm run dev
```

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use interfaces for object shapes
- Prefer `const` over `let`

### React Components

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useWallet.ts`)
- **Utils**: camelCase (`formatBalance.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`WalletBalance`)

### File Organization

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── services/       # API services
├── utils/          # Utility functions
├── types/          # TypeScript types
└── __tests__/      # Tests
```

## Testing

### Unit Tests

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { formatBalance } from '@/utils/formatBalance';

describe('formatBalance', () => {
  it('should format balance correctly', () => {
    expect(formatBalance('1000000000000000000')).toBe('1.0 ETH');
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should render label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can connect wallet', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="connect-wallet"]');
  await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
});
```

### Test Coverage

- Aim for 70%+ coverage
- Test critical paths thoroughly
- Include edge cases

## Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Write code
   - Add tests
   - Update documentation

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use descriptive title
   - Fill out PR template
   - Link related issues

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs or debug code
- [ ] All tests passing
- [ ] No merge conflicts

### Review Process

1. Automated checks run (tests, linting)
2. Code review by maintainers
3. Address feedback
4. Approval and merge

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Examples

```
feat(wallet): add balance display

Adds real-time balance display with USD conversion.

Closes #123
```

```
fix(api): handle connection errors

Fixes issue where API errors weren't properly caught and displayed.

Fixes #456
```

## Code Review Guidelines

### For Authors

- Keep PRs focused and small
- Respond to feedback promptly
- Be open to suggestions

### For Reviewers

- Be constructive and respectful
- Explain reasoning
- Approve when ready

## Documentation

### Code Comments

```typescript
/**
 * Formats a balance value to human-readable format
 * @param balance - Balance in wei (string)
 * @param decimals - Number of decimal places (default: 18)
 * @returns Formatted balance string
 */
export function formatBalance(balance: string, decimals = 18): string {
  // Implementation
}
```

### README Updates

- Update README for new features
- Add usage examples
- Update installation steps if needed

## Questions?

- **Discord**: [Join our Discord](https://discord.gg/regenx)
- **GitHub Issues**: Open an issue
- **Email**: dev@regenx.app

Thank you for contributing! 🎉
