# GuardiaVault Integration Guide

This document describes the complete integration of GuardiaVault with the Paradex Wallet app.

## Overview

The integration enables:
- **Inheritance Vaults**: Create and manage digital inheritance vaults with guardians and beneficiaries
- **Seedless Wallet Recovery**: Recover seedless wallets using GuardiaVault's 2-of-3 guardian system
- **Guardian Portal**: Email-based guardian access for approving recovery requests
- **Check-In System**: Dead man's switch with configurable intervals

## Architecture

### Services

1. **`guardiavault-api.service.ts`**: Complete API client for GuardiaVault backend
   - Vault management
   - Guardian and beneficiary management
   - Check-in system
   - Recovery system
   - Fragment management (Shamir Secret Sharing)

2. **`seedless-guardia-integration.service.ts`**: Bridges seedless wallet with GuardiaVault
   - Initiates recovery using GuardiaVault guardians
   - Completes recovery after guardian approval
   - Creates seedless wallets with GuardiaVault guardians

### Hooks

**`useGuardiaVault.ts`**: React hooks for GuardiaVault integration
- `useVaults()`: Fetch all vaults
- `useVault(vaultId)`: Fetch single vault
- `useCreateVault()`: Create new vault
- `useGuardians(vaultId)`: Fetch guardians
- `useInviteGuardian()`: Invite guardian
- `useBeneficiaries(vaultId)`: Fetch beneficiaries
- `useAddBeneficiary()`: Add beneficiary
- `useCheckIn()`: Perform check-in
- `useCheckInStatus(vaultId)`: Get check-in status
- `useCreateRecovery()`: Create recovery request
- `useRecoveryMetrics()`: Get recovery metrics

### Components

1. **`GuardianXInheritanceEnhanced.tsx`**: Main inheritance vault interface
   - Displays vault status
   - Manages beneficiaries and guardians
   - Check-in functionality
   - Vault creation

2. **`CreateVaultModal.tsx`**: Modal for creating new vaults
   - Configure check-in intervals
   - Add guardians and beneficiaries
   - Set allocation percentages

3. **`AddBeneficiaryModal.tsx`**: Modal for adding beneficiaries

4. **`AddGuardianModal.tsx`**: Modal for inviting guardians

5. **`SeedlessRecoveryPage.tsx`**: Recovery page for seedless wallets
   - Initiate recovery request
   - Monitor guardian approvals
   - Complete recovery after timelock

6. **`GuardianPortalPage.tsx`**: Email-based guardian portal
   - Accept guardian invitations
   - Approve/reject recovery requests
   - View vault information

## API Endpoints

All endpoints are prefixed with `/api` and use session-based authentication (cookies).

### Vault Management
- `GET /api/vaults` - List all vaults
- `POST /api/vaults` - Create vault
- `GET /api/vaults/:id` - Get vault details
- `PUT /api/vaults/:id` - Update vault
- `DELETE /api/vaults/:id` - Delete vault

### Guardians
- `GET /api/vaults/:vaultId/guardians` - List guardians
- `POST /api/vaults/:vaultId/guardians/invite` - Invite guardian
- `POST /api/vaults/:vaultId/guardians/:id/remove` - Remove guardian

### Beneficiaries
- `GET /api/vaults/:vaultId/beneficiaries` - List beneficiaries
- `POST /api/vaults/:vaultId/beneficiaries` - Add beneficiary
- `PUT /api/vaults/:vaultId/beneficiaries/:id` - Update beneficiary
- `DELETE /api/vaults/:vaultId/beneficiaries/:id` - Delete beneficiary

### Check-In
- `POST /api/vaults/:vaultId/checkin` - Perform check-in
- `GET /api/vaults/:vaultId/checkin/status` - Get check-in status
- `GET /api/vaults/:vaultId/checkin/history` - Get check-in history

### Recovery
- `POST /api/recovery/create` - Create recovery request
- `GET /api/recovery/verify-token/:token` - Verify recovery token
- `POST /api/recovery/mark-attested/:recoveryId` - Mark guardian as attested
- `GET /api/recovery/metrics` - Get recovery metrics

### Guardian Portal
- `GET /api/guardian-portal/invite/:token` - Get invite info
- `POST /api/guardian-portal/accept` - Accept invitation
- `POST /api/guardian-portal/attest` - Approve/reject recovery
- `GET /api/guardian-portal/status/:token` - Get guardian status

## Environment Configuration

Add to your `.env` file:

```env
# GuardiaVault API URL
VITE_GUARDIAVAULT_API_URL=http://localhost:5000/api

# Or for production:
# VITE_GUARDIAVAULT_API_URL=https://api.guardiavault.com/api
```

## Authentication

GuardiaVault uses **session-based authentication** (Express sessions with cookies). The API client automatically includes cookies with `credentials: 'include'`.

For token-based authentication (if needed), you can also use Bearer tokens by setting:
```typescript
localStorage.setItem('guardiavault_token', 'your-token');
```

## Seedless Wallet Integration

### Creating a Seedless Wallet with GuardiaVault Guardians

```typescript
import { seedlessGuardiaIntegration } from './services/seedless-guardia-integration.service';

// Create seedless wallet using GuardiaVault vault guardians
const result = await seedlessGuardiaIntegration.createSeedlessWalletWithGuardiaVault(
  userId,
  vaultId
);
```

### Recovering a Seedless Wallet

```typescript
// Step 1: Initiate recovery
const recovery = await seedlessGuardiaIntegration.initiateSeedlessRecovery({
  userEmail: 'user@example.com',
  reason: 'Lost device access',
});

// Step 2: Wait for guardian approval (poll status)
const status = await seedlessGuardiaIntegration.getRecoveryStatus(recovery.recoveryId);

// Step 3: Complete recovery after timelock
const result = await seedlessGuardiaIntegration.completeSeedlessRecovery(
  recovery.recoveryId,
  recoveryToken
);
```

## Usage Examples

### Creating a Vault

```typescript
import { useCreateVault } from './hooks/useGuardiaVault';

function MyComponent() {
  const createVault = useCreateVault();

  const handleCreate = async () => {
    await createVault.mutateAsync({
      name: "My Inheritance Vault",
      checkInIntervalDays: 90,
      gracePeriodDays: 14,
      guardians: [
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Smith", email: "jane@example.com" },
        { name: "Bob Wilson", email: "bob@example.com" },
      ],
      beneficiaries: [
        { name: "Alice Doe", email: "alice@example.com", allocation: 50 },
        { name: "Charlie Doe", email: "charlie@example.com", allocation: 50 },
      ],
    });
  };
}
```

### Performing Check-In

```typescript
import { useCheckIn } from './hooks/useGuardiaVault';

function CheckInButton({ vaultId }: { vaultId: string }) {
  const checkIn = useCheckIn();

  return (
    <button onClick={() => checkIn.mutate({ vaultId })}>
      Check In
    </button>
  );
}
```

### Inviting a Guardian

```typescript
import { useInviteGuardian } from './hooks/useGuardiaVault';

function InviteGuardian({ vaultId }: { vaultId: string }) {
  const invite = useInviteGuardian();

  const handleInvite = async () => {
    await invite.mutateAsync({
      vaultId,
      params: {
        name: "New Guardian",
        email: "guardian@example.com",
      },
    });
  };
}
```

## Routing

Add routes to your router:

```typescript
import { GuardianXInheritanceEnhanced } from './components/features/GuardianXInheritanceEnhanced';
import { SeedlessRecoveryPage } from './pages/SeedlessRecoveryPage';
import { GuardianPortalPage } from './components/GuardianPortalPage';

// In your router:
<Route path="/guardianx" element={<GuardianXInheritanceEnhanced type="regen" onClose={() => navigate(-1)} />} />
<Route path="/recovery" element={<SeedlessRecoveryPage />} />
<Route path="/guardian-portal" element={<GuardianPortalPage />} />
```

## Security Considerations

1. **Session Cookies**: GuardiaVault uses secure, httpOnly cookies for authentication
2. **CORS**: Ensure CORS is configured to allow your frontend domain
3. **HTTPS**: Always use HTTPS in production
4. **Recovery Tokens**: Recovery tokens should be stored securely and not logged
5. **Private Keys**: Never store private keys in localStorage - use secure storage

## Testing

1. Start GuardiaVault backend: `cd GuardiaVault-main && npm run dev`
2. Start wallet app: `npm run dev`
3. Navigate to `/guardianx` to test vault creation
4. Test recovery flow at `/recovery`
5. Test guardian portal at `/guardian-portal?token=<invite-token>`

## Troubleshooting

### CORS Issues
- Ensure GuardiaVault backend has your frontend URL in `ALLOWED_ORIGINS`
- Check that `credentials: 'include'` is set in fetch requests

### Session Issues
- Verify cookies are being sent (check browser DevTools)
- Ensure `TRUST_PROXY=1` is set in GuardiaVault backend for production

### API Errors
- Check GuardiaVault backend logs
- Verify API URL is correct in environment variables
- Ensure user is authenticated (session exists)

## Next Steps

1. ✅ API service created
2. ✅ React hooks implemented
3. ✅ Components enhanced
4. ✅ Seedless wallet integration
5. ⏳ Guardian portal component
6. ⏳ Vault management page
7. ⏳ Recovery page
8. ⏳ Environment configuration

## Support

For issues or questions:
- Check GuardiaVault documentation: `GuardiaVault-main/README.md`
- Review API documentation: `http://localhost:5000/api-docs`
- Check backend logs for errors

