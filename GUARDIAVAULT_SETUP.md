# GuardiaVault Integration - Quick Setup

## Prerequisites

1. GuardiaVault backend running (in `GuardiaVault-main/`)
2. Node.js 20+ and pnpm installed
3. Environment variables configured

## Setup Steps

### 1. Configure Environment

Create or update `.env` file in the wallet app root:

```env
# GuardiaVault API URL
VITE_GUARDIAVAULT_API_URL=http://localhost:5000/api

# Your existing API URL (if different)
VITE_API_URL=http://localhost:3001
```

### 2. Install Dependencies

The integration uses existing dependencies. No new packages needed.

### 3. Start GuardiaVault Backend

```bash
cd GuardiaVault-main
npm install
npm run dev
```

The backend should start on `http://localhost:5000`

### 4. Start Wallet App

```bash
npm run dev
```

### 5. Test Integration

1. Navigate to `/guardianx` in your wallet app
2. Create a vault with guardians and beneficiaries
3. Test check-in functionality
4. Test recovery flow at `/recovery`
5. Test guardian portal at `/guardian-portal?token=<token>`

## Key Files Created

### Services
- `src/services/guardiavault-api.service.ts` - API client
- `src/services/seedless-guardia-integration.service.ts` - Seedless wallet integration

### Hooks
- `src/hooks/useGuardiaVault.ts` - React hooks for GuardiaVault

### Components
- `src/components/features/GuardianXInheritanceEnhanced.tsx` - Main vault interface
- `src/components/features/CreateVaultModal.tsx` - Vault creation modal
- `src/components/features/AddBeneficiaryModal.tsx` - Add beneficiary modal
- `src/components/features/AddGuardianModal.tsx` - Invite guardian modal
- `src/components/GuardianPortalPage.tsx` - Guardian portal
- `src/pages/SeedlessRecoveryPage.tsx` - Recovery page

## Integration Points

### Replace Existing Component

In your `App.tsx` or routing file, replace:
```typescript
import { GuardianXInheritance } from './components/features/GuardianXInheritance';
```

With:
```typescript
import { GuardianXInheritanceEnhanced } from './components/features/GuardianXInheritanceEnhanced';
```

### Add Routes

```typescript
// Recovery page
<Route path="/recovery" element={<SeedlessRecoveryPage />} />

// Guardian portal (email-based access)
<Route path="/guardian-portal" element={<GuardianPortalPage />} />
```

## Authentication

GuardiaVault uses **session-based authentication** (cookies). The API client automatically handles this with `credentials: 'include'`.

To authenticate:
1. User must be logged into GuardiaVault backend
2. Session cookie is automatically sent with requests
3. No additional auth setup needed if using GuardiaVault's auth system

## Seedless Wallet Recovery Flow

1. User initiates recovery at `/recovery`
2. System finds GuardiaVault vaults for the user
3. Notifies guardians via email
4. Guardians approve via `/guardian-portal?token=<token>`
5. After 2-of-3 approvals + 7-day timelock, recovery completes
6. User receives recovered private key

## Troubleshooting

### CORS Errors
- Add your frontend URL to GuardiaVault's `ALLOWED_ORIGINS` env var
- Ensure `credentials: 'include'` is in fetch requests

### Session Issues
- Check that cookies are being sent (DevTools → Network → Headers)
- Verify `TRUST_PROXY=1` in GuardiaVault backend for production

### API Not Found
- Verify `VITE_GUARDIAVAULT_API_URL` is set correctly
- Check GuardiaVault backend is running on port 5000
- Check browser console for exact error

## Next Steps

1. ✅ API service created
2. ✅ Hooks implemented  
3. ✅ Components enhanced
4. ✅ Seedless wallet integration
5. ✅ Guardian portal created
6. ✅ Recovery page created
7. ⏳ Add routes to your router
8. ⏳ Test end-to-end flows
9. ⏳ Update UI to use enhanced components

## Support

See `GUARDIAVAULT_INTEGRATION.md` for detailed documentation.

