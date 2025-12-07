import { Switch, Route } from "wouter";
import React, { useEffect, lazy, Suspense } from "react";

// CRITICAL: Ensure React is available globally IMMEDIATELY after import
// This must happen before ANY other imports that might use React.createContext
// Modules like useWallet.tsx call createContext at the top level, so React must be available
if (typeof window !== 'undefined') {
  (window as any).React = React;
  // Ensure all critical React methods are available immediately
  if (React.createContext && !(window as any).React.createContext) {
    (window as any).React.createContext = React.createContext;
  }
  if (React.useContext && !(window as any).React.useContext) {
    (window as any).React.useContext = React.useContext;
  }
  if (React.createElement && !(window as any).React.createElement) {
    (window as any).React.createElement = React.createElement;
  }
}

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

// Import providers directly (not lazy) - they're needed for the whole app
// Lazy loading was causing initialization delays and blocking the app
// These imports happen AFTER React is set globally, so createContext will work
import { WalletProvider } from "./hooks/useWallet";
import { WagmiProvider } from "./lib/wagmi";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkStatus } from "./components/NetworkStatus";
import { SessionTimeout } from "./components/SessionTimeout";
import { SkipLink } from "./components/SkipLink";
import InstallPrompt from "./components/InstallPrompt";

// Lazy load the shader component - only load when needed
// Three.js is dynamically imported inside, reducing initial bundle by ~600KB
const InteractiveNebulaShader = lazy(() => import("./components/ui/liquid-shader").then(module => ({ default: module.InteractiveNebulaShader })));

// Lazy load all pages - split into route-based chunks
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateVault = lazy(() => import("./pages/CreateVault"));
const RecoverVault = lazy(() => import("./pages/RecoverVault"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Settings = lazy(() => import("./pages/Settings"));
const Guardians = lazy(() => import("./pages/Guardians"));
const Beneficiaries = lazy(() => import("./pages/Beneficiaries"));
const KeyFragments = lazy(() => import("./pages/KeyFragments"));
const CheckIns = lazy(() => import("./pages/CheckIns"));
const Claims = lazy(() => import("./pages/Claims"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const LegacyMessages = lazy(() => import("./pages/LegacyMessages"));
const SetupRecovery = lazy(() => import("./pages/SetupRecovery"));
const RecoveryKeyPortal = lazy(() => import("./pages/RecoveryKeyPortal"));
const GuardianPortal = lazy(() => import("./pages/GuardianPortal"));
const LostBitcoinRecovery = lazy(() => import("./pages/LostBitcoinRecovery"));
const YieldVaults = lazy(() => import("./pages/YieldVaults"));
const DAOVerification = lazy(() => import("./pages/DAOVerification"));
const SmartWillBuilder = lazy(() => import("./pages/SmartWillBuilder"));
const WillWizard = lazy(() => import("./pages/WillWizard"));
const OperatorDashboard = lazy(() => import("./pages/OperatorDashboard"));
const MultiSigRecovery = lazy(() => import("./pages/MultiSigRecovery"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Legal = lazy(() => import("./pages/Legal"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const RiskDisclosure = lazy(() => import("./pages/legal/RiskDisclosure"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const SecurityPolicy = lazy(() => import("./pages/legal/SecurityPolicy"));
const AccessibilityPolicy = lazy(() => import("./pages/legal/AccessibilityPolicy"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const NotFound = lazy(() => import("./pages/not-found"));
const OnboardingFlow = lazy(() => import("./components/onboarding/OnboardingFlow"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Helper to create lazy route components with Suspense
const lazyRoute = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return () => (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={lazyRoute(Landing)} />
      <Route path="/onboarding" component={lazyRoute(OnboardingFlow)} />
      <Route path="/login" component={lazyRoute(Login)} />
      <Route path="/signup" component={lazyRoute(Signup)} />
      <Route path="/pricing" component={lazyRoute(Pricing)} />
      <Route path="/checkout" component={lazyRoute(Checkout)} />
      <Route path="/dashboard" component={lazyRoute(Dashboard)} />
      <Route path="/dashboard/settings" component={lazyRoute(Settings)} />
      <Route path="/dashboard/support" component={lazyRoute(HelpSupport)} />
      <Route path="/support" component={lazyRoute(HelpSupport)} />
      <Route path="/dashboard/guardians" component={lazyRoute(Guardians)} />
      <Route path="/dashboard/beneficiaries" component={lazyRoute(Beneficiaries)} />
      <Route path="/dashboard/fragments" component={lazyRoute(KeyFragments)} />
      <Route path="/dashboard/checkins" component={lazyRoute(CheckIns)} />
      <Route path="/dashboard/claims" component={lazyRoute(Claims)} />
      <Route path="/dashboard/legacy-messages" component={lazyRoute(LegacyMessages)} />
      <Route path="/accept-invite" component={lazyRoute(AcceptInvite)} />
      <Route path="/create-vault" component={lazyRoute(CreateVault)} />
      <Route path="/recover" component={lazyRoute(RecoverVault)} />
      <Route path="/setup-recovery" component={lazyRoute(SetupRecovery)} />
      <Route path="/recovery-key-portal" component={lazyRoute(RecoveryKeyPortal)} />
      <Route path="/recovery-portal/:token" component={lazyRoute(RecoveryKeyPortal)} />
      <Route path="/guardian-portal" component={lazyRoute(GuardianPortal)} />
      <Route path="/lost-bitcoin-recovery" component={lazyRoute(LostBitcoinRecovery)} />
      <Route path="/recover-bitcoin" component={lazyRoute(LostBitcoinRecovery)} />
      <Route path="/dashboard/yield-vaults" component={lazyRoute(YieldVaults)} />
      <Route path="/dashboard/dao-verification" component={lazyRoute(DAOVerification)} />
      <Route path="/dashboard/smart-will" component={lazyRoute(SmartWillBuilder)} />
      <Route path="/will-wizard" component={lazyRoute(WillWizard)} />
      <Route path="/dashboard/will-wizard" component={lazyRoute(WillWizard)} />
      <Route path="/dashboard/operator" component={lazyRoute(OperatorDashboard)} />
      <Route path="/dashboard/multisig-recovery" component={lazyRoute(MultiSigRecovery)} />
      <Route path="/legal" component={lazyRoute(Legal)} />
      <Route path="/legal/privacy" component={lazyRoute(PrivacyPolicy)} />
      <Route path="/legal/terms" component={lazyRoute(TermsOfService)} />
      <Route path="/legal/disclaimer" component={lazyRoute(Disclaimer)} />
      <Route path="/legal/risks" component={lazyRoute(RiskDisclosure)} />
      <Route path="/legal/refund" component={lazyRoute(RefundPolicy)} />
      <Route path="/legal/cookies" component={lazyRoute(CookiePolicy)} />
      <Route path="/legal/security" component={lazyRoute(SecurityPolicy)} />
      <Route path="/legal/accessibility" component={lazyRoute(AccessibilityPolicy)} />
      <Route component={lazyRoute(NotFound)} />
    </Switch>
  );
}

function App() {
  // Initialize PWA in background (non-blocking)
  useEffect(() => {
    import("./utils/pwa").then(({ registerServiceWorker, setupInstallPrompt }) => {
      registerServiceWorker();
      setupInstallPrompt();
    });
  }, []);

  // Don't load shader globally - individual pages can load it if needed
  // This reduces initial bundle size significantly
  const shouldLoadShader = false;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <WagmiProvider>
              <WalletProvider>
                <div className="relative z-0 min-h-screen bg-slate-950">
                  {/* Global Skip Link - visible on keyboard focus */}
                  <SkipLink />
                  <NetworkStatus />
                  <SessionTimeout timeoutMinutes={30} warningMinutes={5} />
                  <Toaster />
                  <InstallPrompt />
                  <Router />
                </div>
              </WalletProvider>
            </WagmiProvider>
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
