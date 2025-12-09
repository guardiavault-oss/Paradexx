# CI/CD Setup Guide

This document describes the CI/CD pipeline configuration for GuardiaVault.

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**

1. **TypeScript Check**
   - Validates TypeScript code
   - Fails if there are type errors

2. **Lint**
   - Runs ESLint on all `.ts` and `.tsx` files
   - Checks code formatting with Prettier
   - Ensures code style consistency

3. **Backend Tests**
   - Runs Vitest backend test suite
   - Tests API routes and services

4. **Frontend Tests**
   - Runs Vitest frontend test suite
   - Tests React components

5. **Smart Contract Tests**
   - Runs Hardhat contract tests
   - Validates Solidity contracts

6. **Build Check**
   - Verifies production build succeeds
   - Catches build-time errors early

### Release Workflow (`.github/workflows/release.yml`)

Runs when tags matching `v*` are pushed (e.g., `v1.0.0`).

**Current Features:**
- Placeholder for release automation
- Extracts version from tag

**Future Enhancements:**
- Automatic deployment to staging/production
- GitHub release creation
- Docker image building
- Contract verification on Etherscan

## Local Development

### Running Linting

```bash
# Check for linting errors
pnpm run lint

# Auto-fix linting errors
pnpm run lint:fix
```

### Code Formatting

```bash
# Format all code
pnpm run format

# Check formatting without making changes
pnpm run format:check
```

### Pre-commit Hooks (Recommended)

Consider adding pre-commit hooks using Husky:

```bash
pnpm add -D husky lint-staged

# Initialize Husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

## Configuration Files

### ESLint (`eslint.config.js`)

- TypeScript support
- React and React Hooks rules
- Recommended rule sets
- Custom rules for GuardiaVault

### Prettier (`.prettierrc.json`)

- Consistent code formatting
- Single quotes
- 2-space indentation
- 100 character line width

## CI Status Badges

Add these to your README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
```

## Troubleshooting

### CI Fails But Works Locally

1. **Check Node.js version**: CI uses Node 18, ensure local matches
2. **Check pnpm version**: CI uses pnpm 8
3. **Check environment variables**: Some may be set in CI but not locally
4. **Clear cache**: Try clearing pnpm cache: `pnpm store prune`

### Linting Errors

- Run `pnpm run lint:fix` to auto-fix most issues
- Review ESLint configuration in `eslint.config.js`
- Some rules may need adjustment for your codebase

### Formatting Issues

- Run `pnpm run format` to format all files
- Ensure `.prettierignore` excludes build artifacts
- Check `.prettierrc.json` for formatting preferences

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   pnpm run test
   pnpm run lint
   pnpm run format:check
   ```

2. **Keep CI fast**
   - Run only necessary checks
   - Use caching where possible
   - Parallelize jobs

3. **Fix CI failures immediately**
   - Don't merge with failing CI
   - Keep main branch always green

4. **Use status checks**
   - Require CI to pass before merging
   - Protect main branch

## Extending CI/CD

### Add Docker Build

```yaml
# In ci.yml
docker-build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Build Docker image
      run: docker build -t guardiavault:${{ github.sha }} .
```

### Add Deployment

```yaml
# In release.yml
deploy:
  needs: [build]
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: |
        # Your deployment commands
```

### Add Security Scanning

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run security audit
      run: pnpm audit --audit-level high
```

---

**Last Updated**: 2025-01-02  
**Status**: ✅ CI/CD Pipeline Active

