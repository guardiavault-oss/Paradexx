# Component Usage Audit

## ✅ Currently Used Components

1. **SessionTimeout** - Used in `App.tsx` ✅
2. **HardwareDevices** - Used in `Settings.tsx` ✅
3. **PartyHistoryDialog** - Used in `Guardians.tsx` ✅
4. **GuardianEducation** - Used in `Guardians.tsx` ✅
5. **WizardProgress** - Used in `WillWizard.tsx`, `OnboardingFlow.tsx`, `SetupRecovery.tsx` ✅
6. **YieldComparisonChart** - Used in `Dashboard.tsx` ✅
7. **YieldPerformanceShare** - Used in `Dashboard.tsx` ✅

## ❌ NOT Used Components (Need Integration)

### Critical Components:
1. **PassphraseDisplay** - ✅ Integrated in `Dashboard.tsx` (after vault creation) and `KeyFragments.tsx` (for viewing)
2. **BiometricSetup** - ✅ Used in `Settings.tsx`

### Dashboard Components (Should be in Dashboard or YieldVaults):
3. **Achievements** - ✅ Used in `Dashboard.tsx`
4. **EducationHub** - ✅ Used in `Dashboard.tsx`
5. **AIOptimizer** - Component exists, not imported anywhere
6. **StrategyOptimizer** - Component exists, not imported anywhere
7. **YieldChallenges** - Component exists, not imported anywhere
8. **YieldLeaderboard** - Component exists, not imported anywhere
9. **DemoMode** - Component exists, not imported anywhere

### Landing/Feature Components:
10. **LifelineVisual** - ✅ Used in `CheckIns.tsx`
11. **InteractiveDemo** - ✅ Used in `Landing.tsx` (lazy loaded)
12. **FeatureHint** - ✅ Used in `Dashboard.tsx`
13. **AdditionalFeaturesSection** - Component exists, check if used

### Other Components:
14. **BiometricSetup** - Standalone component, should replace inline code in Settings
15. **AnimatedBackground** - Component exists, check if used
16. **ParticleBackground** - Component exists, check if used
17. **ProductShowcase** - Component exists, check if used
18. **BenefitsGrid** - Component exists, check if used

## Integration Plan

1. **PassphraseDisplay** → Add to KeyFragments or create passphrase display modal
2. **BiometricSetup** → Replace inline WebAuthn code in Settings.tsx
3. **Dashboard Components** → Add tabs/sections to Dashboard or YieldVaults page
4. **Landing Components** → Review Landing.tsx and integrate missing sections

