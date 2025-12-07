# Mobile App Update Plan

## Overview
Update mobile app to match all website features.

## Missing Screens to Create

### Auth Screens ✅
- [x] LoginScreen
- [x] SignupScreen

### Main Screens ✅
- [x] DashboardScreen (replace HomeScreen functionality)
- [x] CreateVaultScreen
- [x] RecoverVaultScreen

### Dashboard Sections ✅
- [x] GuardiansScreen
- [x] BeneficiariesScreen
- [x] KeyFragmentsScreen
- [x] YieldVaultsScreen
- [x] SmartWillScreen
- [x] CheckInsScreen
- [x] ClaimsScreen
- [x] LegacyMessagesScreen
- [x] HelpSupportScreen

### Recovery Screens ✅
- [x] SetupRecoveryScreen
- [x] RecoveryKeyPortalScreen
- [x] GuardianPortalScreen
- [x] AcceptInviteScreen

## Existing Screens to Update
- [x] HomeScreen - Keep as quick access
- [x] VaultStatusScreen - Enhance with full features
- [x] SettingsScreen - Already good, minor enhancements
- [x] CheckInScreen - Enhance
- [x] RecoveryScreen - Enhance
- [x] WalletConnectScreen - Enhance

## Implementation Order
1. ✅ Navigation structure
2. ✅ Auth screens (Login, Signup)
3. ✅ Dashboard screen
4. ✅ Core feature screens
5. ✅ Recovery screens
6. ✅ Enhanced existing screens

## Notes
- All screens should use React Native components
- Follow existing mobile app styling patterns
- Integrate with shared API client from `shared/` directory
- Use React Query for data fetching
- Add proper error handling and loading states

