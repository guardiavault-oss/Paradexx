# GuardiaVault Deprecated Dependencies Report

**Generated:** November 7, 2025
**Project:** GuardiaVault
**Package Manager:** pnpm

---

## Executive Summary

This report identifies critical security vulnerabilities, deprecated packages, and available updates in the GuardiaVault project. The audit revealed **1 critical** and **1 low severity** security vulnerability affecting 2,934 total dependencies.

### Critical Findings

- **CRITICAL**: CVE-2025-11953 in `@react-native-community/cli` (CVSS 9.8/10) - OS command injection vulnerability
- **LOW**: CVE-2025-57319 in `fast-redact` - Prototype pollution vulnerability
- **DEPRECATED**: `@web3modal/ethereum` and `@web3modal/react` (must migrate by Feb 17, 2025)
- **49 packages** with major version updates available
- Multiple packages with breaking changes requiring careful migration

### Recommended Action Timeline

1. **IMMEDIATE** (Within 24-48 hours): Address critical CVE-2025-11953
2. **HIGH PRIORITY** (Within 1 week): Migrate from @web3modal to @reown/appkit
3. **MEDIUM PRIORITY** (Within 1 month): Update packages with patch/minor versions
4. **LOW PRIORITY** (Within 3 months): Plan major version upgrades (React 19, etc.)

---

## 1. Critical Security Vulnerabilities

### 🔴 CRITICAL: CVE-2025-11953 - OS Command Injection in @react-native-community/cli

**Severity:** Critical (CVSS 9.8/10)
**Affected Version:** 13.6.4 (installed)
**Patched Version:** ≥17.0.1 or ≥20.0.0
**CVE ID:** CVE-2025-11953

#### Description
The Metro Development Server binds to external interfaces by default and exposes an endpoint vulnerable to OS command injection. Unauthenticated network attackers can send POST requests to execute arbitrary executables. On Windows, attackers can execute arbitrary shell commands with fully controlled arguments.

#### Dependency Path
```
@rainbow-me/rainbowkit → wagmi → @wagmi/connectors → @walletconnect/ethereum-provider
→ @reown/appkit → @walletconnect/universal-provider → react-native (peer)
→ @react-native-community/cli@13.6.4
```

#### Impact on GuardiaVault
- **INDIRECT DEPENDENCY**: This vulnerability exists in a peer dependency of `@react-three/fiber`
- **RISK LEVEL**: Medium (not actively used in production, but exists in dependency tree)
- **EXPOSURE**: Only affects development environments running Metro dev server

#### Recommended Action
```bash
# Option 1: Update the entire dependency chain (RECOMMENDED)
pnpm update @react-three/fiber@latest
pnpm update @wagmi/connectors@latest @walletconnect/ethereum-provider@latest

# Option 2: Force resolution in package.json
# Add to pnpm.overrides section:
"@react-native-community/cli": ">=20.0.0"
```

#### Temporary Workaround
If immediate update isn't feasible, restrict dev server to localhost:
```bash
# Pass --host flag when running Metro
npm start -- --host 127.0.0.1
```

---

### 🟡 LOW: CVE-2025-57319 - Prototype Pollution in fast-redact

**Severity:** Low (CVSS 0.0)
**Affected Version:** 3.5.0
**Patched Version:** No patch available
**CVE ID:** CVE-2025-57319

#### Description
Prototype pollution vulnerability in the `nestedRestore` function allows attackers to inject properties on `Object.prototype`, causing denial of service (DoS) as minimum consequence.

#### Dependency Path
```
@wagmi/connectors → @walletconnect/ethereum-provider → @reown/appkit
→ @reown/appkit-utils → @walletconnect/logger → pino → fast-redact@3.5.0
```

#### Recommended Action
**REVIEW ONLY** - No patch currently available. Monitor for updates to `pino` or `fast-redact`.

---

## 2. High-Impact Deprecations

### 🔴 CRITICAL DEPRECATION: @web3modal/* → @reown/appkit Migration

**Status:** DEPRECATED (End of support: February 17, 2025)
**Current Packages:**
- `@web3modal/ethereum@2.7.1`
- `@web3modal/react@2.7.1`

**Replacement:**
- `@reown/appkit-ethereum`
- `@reown/appkit-react`

#### Why This Matters
WalletConnect has moved the Web3Modal project to Reown and renamed it to AppKit. All `@web3modal/*` packages will cease receiving updates after February 17, 2025, including critical security patches.

#### Migration Impact
- **Breaking Changes:** API changes in wallet connection initialization
- **Code Changes Required:** Import statements, provider setup, configuration
- **Testing Required:** Full wallet connection flow testing
- **Estimated Effort:** 4-8 hours

#### Migration Steps

1. **Install new packages:**
```bash
pnpm remove @web3modal/ethereum @web3modal/react
pnpm add @reown/appkit-ethereum @reown/appkit-react
```

2. **Update imports:**
```typescript
// OLD
import { Web3Modal } from '@web3modal/react'
import { EthereumClient } from '@web3modal/ethereum'

// NEW
import { AppKit } from '@reown/appkit-react'
import { EthereumAdapter } from '@reown/appkit-ethereum'
```

3. **Update configuration:**
```typescript
// OLD
const ethereumClient = new EthereumClient(wagmiClient, chains)
<Web3Modal projectId={projectId} ethereumClient={ethereumClient} />

// NEW
const ethereumAdapter = new EthereumAdapter(wagmiClient, chains)
<AppKit projectId={projectId} adapter={ethereumAdapter} />
```

4. **Test wallet connections:**
- MetaMask connection
- WalletConnect connection
- Rainbow wallet connection
- Disconnect functionality
- Network switching

#### References
- Migration Guide: https://docs.reown.com/appkit/upgrade/from-web3modal-ios
- API Documentation: https://docs.reown.com/

---

## 3. Major Version Updates Available

### Frontend Framework Updates

#### React 18 → React 19

**Current:** `react@18.3.1`, `react-dom@18.3.1`
**Latest:** `react@19.2.0`, `react-dom@19.2.0`
**Risk Level:** 🔴 HIGH

**Breaking Changes:**
- PropTypes removed from React package (migrate to TypeScript)
- defaultProps removed from function components (use ES6 defaults)
- ref now available as prop (forwardRef deprecated)
- Stricter useEffect timing
- Server Components support (new feature)

**Dependencies Blocked:**
- `@types/react@19.2.2`
- `@types/react-dom@19.2.2`
- `@vitejs/plugin-react@5.1.0`

**Recommendation:** ⏸️ **WAIT** - Delay until all major libraries confirm React 19 support
- First upgrade to React 18.3 (already on it)
- Monitor compatibility of @radix-ui, @tanstack/react-query, framer-motion
- Target migration: Q2 2025

---

### Build & Testing Tools

#### Vitest 2.1.9 → 4.0.7

**Risk Level:** 🟠 MEDIUM-HIGH
**Breaking Changes:**
- New test file resolution
- Changed default timeout values
- Coverage reporter changes
- API changes for custom matchers

**Blocked Packages:**
- `@vitest/coverage-v8@4.0.7`
- `@vitest/ui@4.0.7`

**Recommendation:** 📋 Plan for Q1 2025
- Review breaking changes: https://vitest.dev/guide/migration.html
- Update test configurations
- Test coverage pipeline
- Estimated effort: 2-3 days

---

#### TypeScript 5.6.3 → 5.9.3

**Risk Level:** 🟢 LOW
**Breaking Changes:** Minor, mostly stricter type checking

**Recommendation:** ✅ **SAFE TO UPDATE**
```bash
pnpm update typescript@latest
```

---

### Web3 & Blockchain Libraries

#### Ethers 6.15.0 (Current) - No Update Needed

**Status:** ✅ Latest stable
**Note:** Ethers v7 is not yet released

---

#### Hardhat 2.26.5 → 3.0.12

**Risk Level:** 🔴 HIGH
**Breaking Changes:**
- New plugin system
- Configuration file changes
- Network configuration updates
- Solidity compiler changes

**Recommendation:** ⏸️ **WAIT**
- Hardhat 3.x is major rewrite
- Wait for ecosystem plugin updates
- Review migration guide
- Test thoroughly in separate branch
- Target: Q2 2025

---

### UI & Animation Libraries

#### Framer Motion 11.18.2 → 12.23.24

**Risk Level:** 🟠 MEDIUM
**Breaking Changes:**
- Animation API changes
- Layout animation updates
- TypeScript type changes

**Recommendation:** 📋 Plan migration
- Review changelog: https://www.framer.com/motion/changelog
- Test all animations
- Update custom variants
- Estimated effort: 1-2 days

---

#### Three.js 0.169.0 → 0.181.0

**Risk Level:** 🟢 LOW-MEDIUM
**Changes:** Performance improvements, new features, minor API updates

**Recommendation:** ✅ **SAFE TO UPDATE** (test 3D components)
```bash
pnpm update three@latest @types/three@latest
```

---

### Database & ORM

#### Drizzle ORM 0.39.3 → 0.44.7

**Risk Level:** 🟢 LOW
**Changes:** New features, performance improvements

**Recommendation:** ✅ **SAFE TO UPDATE**
```bash
pnpm update drizzle-orm@latest drizzle-zod@latest drizzle-kit@latest
```

**Post-update:**
- Re-generate migrations if schema changed
- Test database queries
- Update type definitions

---

### Developer Experience Tools

#### Sentry 8.55.0 → 10.23.0

**Risk Level:** 🟠 MEDIUM
**Breaking Changes:**
- SDK initialization changes
- Integration API updates
- Configuration format changes

**Recommendation:** 📋 Plan for January 2025
- Review migration guide
- Update error tracking setup
- Test error reporting
- Estimated effort: 4-6 hours

---

## 4. Low-Risk Updates (Patch/Minor Versions)

These updates are safe to apply with minimal testing:

### Immediate Updates (No Breaking Changes)

```bash
# UI Components - Patch updates
pnpm update @replit/vite-plugin-cartographer@0.4.2
pnpm update @tailwindcss/vite@4.1.17
pnpm update sharp@0.34.5

# Icon Library - Minor update
pnpm update lucide-react@latest  # 0.453.0 → 0.552.0

# Type Definitions
pnpm update @types/handlebars@4.0.40

# Testing
pnpm update lighthouse@latest  # 12.8.2 → 13.0.1
```

### Safe Library Updates

```bash
# Date utilities
pnpm update date-fns@latest  # 3.6.0 → 4.1.0 (may have minor API changes)

# Accessibility
pnpm update pa11y-ci@latest  # 3.1.0 → 4.0.1

# 3D Graphics
pnpm update @react-three/drei@latest  # 9.122.0 → 10.7.6
pnpm update @react-three/fiber@latest  # 8.18.0 → 9.4.0

# Charts
pnpm update recharts@latest  # 2.15.4 → 3.3.0 (test chart components)
```

---

## 5. Breaking Change Risk Assessment

### 🔴 High Risk (Major Version Jumps with Breaking Changes)

| Package | Current | Latest | Breaking Changes | Est. Effort |
|---------|---------|--------|------------------|-------------|
| react, react-dom | 18.3.1 | 19.2.0 | PropTypes, defaultProps, ref handling | 1-2 weeks |
| vitest | 2.1.9 | 4.0.7 | Config changes, API updates | 2-3 days |
| hardhat | 2.26.5 | 3.0.12 | Plugin system, config format | 1 week |
| @sentry/* | 8.55.0 | 10.23.0 | SDK initialization, integrations | 4-6 hours |
| express | 4.21.2 | 5.1.0 | Middleware changes, async errors | 2-3 days |
| zod | 3.25.76 | 4.1.12 | Validation API changes | 1-2 days |
| tailwindcss | 3.4.18 | 4.1.17 | Config format, JIT engine | 1 week |

### 🟠 Medium Risk (Minor Breaking Changes or Large Updates)

| Package | Current | Latest | Concerns | Est. Effort |
|---------|---------|--------|----------|-------------|
| framer-motion | 11.18.2 | 12.23.24 | Animation API | 1-2 days |
| @neondatabase/serverless | 0.10.4 | 1.0.2 | Stable release changes | 4 hours |
| @hookform/resolvers | 3.10.0 | 5.2.2 | Resolver API | 4 hours |
| recharts | 2.15.4 | 3.3.0 | Chart API | 1 day |

### 🟢 Low Risk (Patch/Minor Updates)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| typescript | 5.6.3 | 5.9.3 | Stricter checks |
| lucide-react | 0.453.0 | 0.552.0 | Icon additions |
| drizzle-orm | 0.39.3 | 0.44.7 | Features only |
| three | 0.169.0 | 0.181.0 | Minor updates |

---

## 6. Recommended Upgrade Path

### Phase 1: Critical Security & Deprecations (Week 1)

**Priority:** 🔴 CRITICAL

1. **Fix CVE-2025-11953** (Day 1)
```bash
# Add to package.json pnpm.overrides
"@react-native-community/cli": ">=20.0.0"

pnpm install
pnpm audit  # Verify fix
```

2. **Migrate @web3modal → @reown/appkit** (Days 2-3)
```bash
pnpm remove @web3modal/ethereum @web3modal/react
pnpm add @reown/appkit-ethereum @reown/appkit-react

# Update all wallet connection code
# Test all wallet providers
# Verify on testnet
```

3. **Test & Deploy** (Day 4)
```bash
npm run test:all
npm run build
npm run test:e2e
```

### Phase 2: Low-Risk Updates (Week 2)

**Priority:** 🟢 LOW RISK

```bash
# Update safe packages
pnpm update typescript@latest
pnpm update drizzle-orm@latest drizzle-zod@latest drizzle-kit@latest
pnpm update three@latest @types/three@latest
pnpm update lucide-react@latest
pnpm update @tailwindcss/vite@latest
pnpm update sharp@latest
pnpm update lighthouse@latest

# Test
npm run test:all
npm run build
```

### Phase 3: Medium-Risk Updates (Weeks 3-4)

**Priority:** 🟠 MEDIUM

1. **Update Drizzle dependencies**
```bash
pnpm update drizzle-orm@latest drizzle-zod@latest drizzle-kit@latest
npm run db:generate  # Regenerate if needed
npm run test:backend
```

2. **Update 3D libraries**
```bash
pnpm update @react-three/drei@latest @react-three/fiber@latest
# Test 3D components thoroughly
```

3. **Update testing tools**
```bash
pnpm update lighthouse@latest pa11y-ci@latest
npm run test:performance
npm run test:a11y
```

### Phase 4: Planning for Major Upgrades (Q1 2025)

**Priority:** 📋 PLANNING

1. **React 19 Migration** (Target: March 2025)
   - Wait for ecosystem readiness
   - Update to React 18.3 first (already done ✓)
   - Create migration branch
   - Use React codemods
   - Test extensively

2. **Vitest 4.x Migration** (Target: February 2025)
   - Review breaking changes
   - Update test configs
   - Update custom matchers
   - Test coverage pipeline

3. **Hardhat 3.x Migration** (Target: April 2025)
   - Wait for plugin updates
   - Review migration guide
   - Test on separate branch
   - Update deployment scripts

4. **Tailwind CSS 4.x Migration** (Target: May 2025)
   - Significant config changes
   - New JIT engine
   - Review component styles
   - Test responsive design

---

## 7. Step-by-Step Upgrade Guide

### Pre-Upgrade Checklist

- [ ] Backup current `package.json` and lock file
- [ ] Ensure all tests pass: `npm run test:all`
- [ ] Create feature branch: `git checkout -b deps/security-updates`
- [ ] Document current versions
- [ ] Notify team of potential downtime

### Critical Security Fix (IMMEDIATE)

```bash
# 1. Add override to package.json
# In pnpm.overrides section, add:
{
  "pnpm": {
    "overrides": {
      "@react-native-community/cli": ">=20.0.0",
      // ... existing overrides
    }
  }
}

# 2. Install
pnpm install

# 3. Verify fix
pnpm audit

# Expected: Critical vulnerabilities: 0

# 4. Test
npm run test:backend
npm run test:frontend
npm run build

# 5. Commit
git add package.json pnpm-lock.yaml
git commit -m "fix: resolve CVE-2025-11953 in @react-native-community/cli"
```

### @web3modal Migration (HIGH PRIORITY)

```bash
# 1. Remove old packages
pnpm remove @web3modal/ethereum @web3modal/react

# 2. Install new packages
pnpm add @reown/appkit-ethereum @reown/appkit-react

# 3. Update code (example locations to check)
# - client/src/components/WalletConnect.tsx
# - client/src/lib/web3.ts
# - client/src/providers/Web3Provider.tsx

# 4. Update imports
find client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@web3modal\/react/@reown\/appkit-react/g'
find client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@web3modal\/ethereum/@reown\/appkit-ethereum/g'

# 5. Update API calls (manual - review each file)
# - Web3Modal → AppKit
# - EthereumClient → EthereumAdapter
# - Modal config changes

# 6. Test wallet connections
npm run dev
# Test in browser:
# - Connect MetaMask
# - Connect via WalletConnect
# - Switch networks
# - Disconnect wallet

# 7. Run tests
npm run test:frontend
npm run test:integration
npm run test:e2e

# 8. Commit
git add .
git commit -m "feat: migrate from @web3modal to @reown/appkit"
```

### Safe Library Updates

```bash
# 1. Update low-risk packages
pnpm update typescript@latest
pnpm update drizzle-orm@latest drizzle-kit@latest
pnpm update three@latest @types/three@latest
pnpm update lucide-react@latest
pnpm update @tailwindcss/vite@latest

# 2. Rebuild
npm run build

# 3. Test
npm run test:all

# 4. Check bundle size
npm run build:analyze

# 5. Commit
git add package.json pnpm-lock.yaml
git commit -m "chore: update safe dependencies"
```

### Post-Upgrade Validation

```bash
# 1. Run all tests
npm run test:all

# 2. Run security audit
pnpm audit
npm run test:security

# 3. Check build
npm run build
npm run check

# 4. Run E2E tests
npm run test:e2e

# 5. Check performance
npm run test:performance

# 6. Check accessibility
npm run test:a11y

# 7. Manual testing checklist
# - [ ] Login/logout flow
# - [ ] Wallet connection
# - [ ] Smart contract interactions
# - [ ] Form submissions
# - [ ] File uploads
# - [ ] 3D vault visualization
# - [ ] Mobile responsiveness
```

---

## 8. Monitoring & Maintenance

### Regular Dependency Audits

Add to your workflow:

```bash
# Weekly security check
pnpm audit

# Monthly dependency review
pnpm outdated

# Quarterly major version review
# Review this document and update roadmap
```

### Automated Alerts

Consider setting up:
- Dependabot/Renovate for automated PR creation
- GitHub Security Advisories
- npm/pnpm audit in CI/CD pipeline

### Package.json Scripts

Add these helpful scripts:

```json
{
  "scripts": {
    "deps:check": "pnpm outdated",
    "deps:audit": "pnpm audit",
    "deps:update:safe": "pnpm update --latest --filter './packages/**'",
    "deps:report": "echo 'See DEPRECATED_DEPENDENCIES.md for full report'"
  }
}
```

---

## 9. Additional Considerations

### Node.js Version

**Current Requirement:** `>=20.0.0`
**Recommendation:** Use Node.js 20 LTS (20.11.0 or later)

```bash
node --version  # Verify v20.x.x
```

### Package Manager

**Current:** pnpm
**Lock File:** pnpm-lock.yaml
**Recommendation:** Continue using pnpm for monorepo support

### TypeScript Configuration

After updates, verify TypeScript compilation:

```bash
npm run check  # tsc --noEmit
```

### Environment Variables

After dependency updates, verify:
- `.env.example` is up to date
- All required env vars are documented
- No new env vars required by updated packages

---

## 10. References & Resources

### Security Vulnerabilities

- **CVE-2025-11953:** https://nvd.nist.gov/vuln/detail/CVE-2025-11953
- **JFrog Blog:** https://jfrog.com/blog/cve-2025-11953-critical-react-native-community-cli-vulnerability
- **CVE-2025-57319:** https://github.com/advisories/GHSA-ffrw-9mx8-89p8

### Migration Guides

- **@web3modal → @reown/appkit:** https://docs.reown.com/appkit/upgrade/from-web3modal-ios
- **React 19 Upgrade:** https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **Vitest Migration:** https://vitest.dev/guide/migration.html
- **Hardhat 3.x:** https://hardhat.org/hardhat-runner/docs/migrating-from-hardhat-2

### Package Documentation

- **pnpm:** https://pnpm.io/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Vite:** https://vitejs.dev/
- **Wagmi:** https://wagmi.sh/

---

## Summary & Next Steps

### Immediate Actions Required (This Week)

1. ✅ **Fix CVE-2025-11953** - Add pnpm override for @react-native-community/cli
2. ✅ **Migrate @web3modal** - Switch to @reown/appkit before Feb 17, 2025
3. ✅ **Test thoroughly** - Run full test suite after changes

### Short-term (This Month)

1. Update safe dependencies (TypeScript, Drizzle, Three.js, etc.)
2. Plan Vitest 4.x migration
3. Review React 19 compatibility of dependencies

### Long-term (Q1-Q2 2025)

1. React 19 migration (March 2025)
2. Hardhat 3.x migration (April 2025)
3. Tailwind CSS 4.x migration (May 2025)
4. Continuous monitoring and updates

### Key Metrics

- **Total Dependencies:** 2,934
- **Critical Vulnerabilities:** 1 (must fix immediately)
- **Low Vulnerabilities:** 1 (monitor)
- **Deprecated Packages:** 2 (migrate by Feb 17, 2025)
- **Major Updates Available:** 49
- **Estimated Total Effort:** 3-4 weeks (phased approach)

---

**Report Prepared By:** Claude Code
**Last Updated:** November 7, 2025
**Next Review:** December 7, 2025
