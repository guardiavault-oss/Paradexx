# Design Consistency Guide

## Premium Design Pattern
All pages should follow this exact pattern from Dashboard.tsx and CheckIns.tsx:

### Required Structure:
```tsx
<SidebarProvider>
  <EnhancedAppSidebar />
  <SidebarInset>
    <div className="flex items-center gap-2">
      <SidebarTrigger className="-ml-1" />
    </div>
    <DashboardHeader />
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Mesh Gradient Background */}
      <div className="mesh-gradient" />
      <div className="noise-overlay" />
      
      {/* Animated Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div ... />
        <motion.div ... />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button className="mb-6 glass px-4 py-2 rounded-xl">
        
        {/* Title */}
        <h1 className="text-5xl font-bold display-font heading-glow mb-3">
        
        {/* Content */}
      </div>
    </div>
  </SidebarInset>
</SidebarProvider>
```

## Pages Status:

### ✅ Pages with Consistent Design:
1. Dashboard.tsx
2. CheckIns.tsx
3. Guardians.tsx
4. Beneficiaries.tsx
5. Claims.tsx
6. CreateVault.tsx
7. LegacyMessages.tsx
8. HelpSupport.tsx
9. YieldVaults.tsx
10. RecoverVault.tsx
11. Settings.tsx
12. KeyFragments.tsx
13. DAOVerification.tsx
14. SmartWillBuilder.tsx
15. WillWizard.tsx
16. SetupRecovery.tsx
17. MultiSigRecovery.tsx
18. LostBitcoinRecovery.tsx

### ❌ Pages that need updating:
1. OperatorDashboard.tsx - Needs full premium design
2. GuardianPortal.tsx - May need update
3. RecoveryKeyPortal.tsx - May need update
4. SimplifiedRecovery.tsx - Has different intentional design (empathy-driven)

### 🚫 Pages that should NOT have this design:
1. Landing.tsx - Marketing page
2. Login.tsx - Auth page  
3. Signup.tsx - Auth page
4. Pricing.tsx - Marketing page
5. Legal pages - Simple pages
6. AcceptInvite.tsx - Public page
7. Checkout.tsx - Payment flow

## Key Design Elements:

### Background:
- `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`

### Mesh Effects:
- `<div className="mesh-gradient" />`
- `<div className="noise-overlay" />`

### Animated Orbs:
- Two motion divs with radial gradients
- Different colors per page for variety
- Smooth infinite animations

### Typography:
- Headings: `text-5xl font-bold display-font heading-glow`
- Subtitles: `text-slate-400 text-lg`

### Cards:
- Use `glass-card` class for glassmorphism effect
- Hover effects with `hover:shadow-2xl hover:shadow-cyan-500/10`

### Back Button:
- `glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white`

### Container:
- `relative z-10 container max-w-6xl mx-auto px-6 py-8`

## Color Palette for Orbs:
Each page can have unique orb colors while maintaining consistency:
- Blue: `rgba(59, 130, 246, 0.15)`
- Green: `rgba(34, 197, 94, 0.15)`
- Purple: `rgba(139, 92, 246, 0.15)`
- Pink: `rgba(236, 72, 153, 0.15)`
- Cyan: `rgba(6, 182, 212, 0.15)`
- Orange: `rgba(251, 146, 60, 0.15)`
