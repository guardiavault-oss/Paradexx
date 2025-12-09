# PowerShell script to restore App.tsx
$appContent = @'
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/hooks/useWallet";
import { WagmiProvider } from "@/lib/wagmi";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import CreateVault from "@/pages/CreateVault";
import RecoverVault from "@/pages/RecoverVault";
import Checkout from "@/pages/Checkout";
import Settings from "@/pages/Settings";
import Guardians from "@/pages/Guardians";
import Beneficiaries from "@/pages/Beneficiaries";
import KeyFragments from "@/pages/KeyFragments";
import CheckIns from "@/pages/CheckIns";
import Claims from "@/pages/Claims";
import AcceptInvite from "@/pages/AcceptInvite";
import LegacyMessages from "@/pages/LegacyMessages";
import SecurityDashboard from "@/pages/SecurityDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/settings" component={Settings} />
      <Route path="/dashboard/guardians" component={Guardians} />
      <Route path="/dashboard/beneficiaries" component={Beneficiaries} />
      <Route path="/dashboard/fragments" component={KeyFragments} />
      <Route path="/dashboard/checkins" component={CheckIns} />
      <Route path="/dashboard/claims" component={Claims} />
      <Route path="/dashboard/legacy-messages" component={LegacyMessages} />
      <Route path="/dashboard/security" component={SecurityDashboard} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/create-vault" component={CreateVault} />
      <Route path="/recover" component={RecoverVault} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WagmiProvider>
          <WalletProvider>
            <InteractiveNebulaShader className="fixed inset-0 -z-10" />
            <div className="relative z-0 min-h-screen bg-background">
              <Toaster />
              <Router />
            </div>
          </WalletProvider>
        </WagmiProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
'@

$appPath = "client\src\App.tsx"
$fullPath = Join-Path $PSScriptRoot $appPath

Write-Host "Restoring App.tsx..."
Set-Content -Path $fullPath -Value $appContent -Encoding UTF8 -Force

Write-Host "Verifying..."
$verify = Get-Content $fullPath -Raw
if ($verify -match "export default App") {
    Write-Host "✅ App.tsx restored successfully!"
    Write-Host "File size: $($verify.Length) characters"
    Write-Host "Has default export: YES"
} else {
    Write-Host "❌ Failed to restore App.tsx"
    exit 1
}

