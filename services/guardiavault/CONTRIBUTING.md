# Contributing to GuardiaVault

Thank you for your interest in contributing! This document provides guidelines for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Set up environment: `cp env.example .env`
5. Start development: `npm run dev`

## Code Style

- **TypeScript**: Use strict mode, prefer type inference where possible
- **React**: Functional components with hooks
- **Formatting**: Prettier (run `npm run format` before committing)
- **Linting**: ESLint (run `npm run lint` before committing)

## Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Aim for 80%+ code coverage

## Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Maintenance

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Add/update tests
4. Update documentation
5. Ensure CI passes
6. Submit PR with clear description

## Project Structure

- `client/` - Web frontend
- `mobile/` - React Native app
- `server/` - Backend API
- `contracts/` - Smart contracts
- `shared/` - Shared code
- `tests/` - Test files
- `docs/` - Documentation

## Questions?

Open an issue or contact the maintainers.

