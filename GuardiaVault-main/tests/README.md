# Testing Guide

This directory contains comprehensive tests for the GuardiaVault platform.

## Test Structure

```
tests/
├── contracts/          # Smart contract tests
├── backend/            # Backend service and API tests
├── frontend/           # Frontend component tests
├── integration/        # End-to-end integration tests
└── e2e/               # Full system tests
```

## Running Tests

```bash
# All tests
npm test

# By category
npm run test:contracts
npm run test:backend
npm run test:frontend
npm run test:integration

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Test Coverage Goals

- **Contracts**: 90%+ coverage
- **Backend Services**: 85%+ coverage
- **API Routes**: 80%+ coverage
- **Frontend Components**: 75%+ coverage
- **Integration Tests**: Critical paths 100%

