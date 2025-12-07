# Contributing to Paradox Wallet

Thank you for your interest in contributing to Paradox! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/paradox-wallet.git
   cd paradox-wallet
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   cd src/backend && pnpm install && cd ../..
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   cp src/backend/.env.example src/backend/.env
   ```
5. **Start development servers**:
   ```bash
   ./start-platform.ps1
   ```

## 📝 Development Guidelines

### Code Style

- **TypeScript/React**: Follow the existing patterns in `src/components/`
- **Python**: Follow PEP 8 guidelines
- **Use the design system**: Import tokens from `src/styles/tokens/`
- **Component structure**: Use functional components with hooks

### Design System

Always use design system tokens instead of hardcoded values:

```typescript
// ❌ Bad
<div style={{ color: '#ff3333' }}>

// ✅ Good
import { colors } from '@/styles/tokens';
<div style={{ color: colors.brand.degen }}>
```

See [Design System Docs](docs/design/DESIGN-SYSTEM.md) for details.

### Commit Messages

Use conventional commits:

```
feat: add whale tracker widget
fix: resolve MEV protection timeout
docs: update API documentation
style: format dashboard components
refactor: simplify auth context
test: add bridge integration tests
chore: update dependencies
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific component
pnpm test ComponentName

# Test API endpoints
python scripts/test-all-api-endpoints.py
```

## 📚 Documentation

- Update relevant docs in `docs/` when adding features
- Add JSDoc comments to complex functions
- Update `README.md` if changing setup process

## 🔍 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** and commit:
   ```bash
   git commit -m "feat: add amazing feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```

4. **Open a Pull Request** with:
   - Clear description of changes
   - Screenshots/videos for UI changes
   - Test results
   - Related issue numbers

5. **Wait for review** — maintainers will review and provide feedback

## 🐛 Bug Reports

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Environment details (OS, browser, versions)

## 💡 Feature Requests

Open an issue with:
- Use case description
- Proposed solution
- Alternative solutions considered
- Mockups/wireframes (if UI-related)

## 🎨 Design Contributions

- Follow the existing Degen/Regen theme system
- Use glassmorphism patterns
- Maintain accessibility standards (WCAG 2.1 AA)
- Test on mobile and desktop

## 🔐 Security

**Do NOT** open public issues for security vulnerabilities.
Email security@paradox.io instead.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution helps make Paradox better for everyone. We appreciate your time and effort!


