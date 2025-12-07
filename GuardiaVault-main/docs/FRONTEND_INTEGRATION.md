# Frontend Integration Guide

## ✅ What's Been Set Up

I've created a complete frontend integration layer for your GuardiaVault smart contracts!

### Files Created:

1. **`client/src/lib/contracts/config.ts`** - Contract addresses and network configuration
2. **`client/src/lib/contracts/guardiaVault.ts`** - Contract interaction functions
3. **`client/src/hooks/useGuardiaVault.ts`** - React hooks for easy contract usage
4. **`client/.env`** - Environment variables with local contract address
5. **`ignition/modules/GuardiaVault.ts`** - Modern Hardhat Ignition deployment module

## 🎯 How to Use in Your React Components

### Example: Create a Vault

```typescript
import { useGuardiaVault } from "@/hooks/useGuardiaVault";
import { daysToSeconds } from "@/lib/contracts/guardiaVault";

function CreateVaultButton() {
  const { createVault, loading } = useGuardiaVault();

  const handleCreateVault = async () => {
    try {
      await createVault(
        daysToSeconds(30),  // Check-in every 30 days
        daysToSeconds(7),   // 7 day grace period
        ["0x123..."],       // Beneficiary addresses
        "ipfs://..."        // Metadata hash
      );
      // Success! Toast notification is shown automatically
    } catch (error) {
      // Error! Toast notification shown automatically
      console.error(error);
    }
  };

  return (
    <button onClick={handleCreateVault} disabled={loading}>
      {loading ? "Creating..." : "Create Vault"}
    </button>
  );
}
```

### Example: Perform Check-In

```typescript
import { useGuardiaVault } from "@/hooks/useGuardiaVault";

function CheckInButton({ vaultId }: { vaultId: number }) {
  const { checkIn, loading } = useGuardiaVault();

  const handleCheckIn = async () => {
    try {
      await checkIn(vaultId);
      // Success toast shown automatically
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={handleCheckIn} disabled={loading}>
      {loading ? "Checking in..." : "Check In"}
    </button>
  );
}
```

### Example: Fetch Vault Details

```typescript
import { useGuardiaVault } from "@/hooks/useGuardiaVault";
import { useEffect, useState } from "react";
import { VaultData } from "@/lib/contracts/guardiaVault";

function VaultDetails({ vaultId }: { vaultId: number }) {
  const { fetchVaultDetails, loading } = useGuardiaVault();
  const [vault, setVault] = useState<VaultData | null>(null);

  useEffect(() => {
    const loadVault = async () => {
      const data = await fetchVaultDetails(vaultId);
      setVault(data);
    };
    loadVault();
  }, [vaultId]);

  if (loading) return <div>Loading...</div>;
  if (!vault) return <div>Vault not found</div>;

  return (
    <div>
      <h2>Vault #{vaultId}</h2>
      <p>Owner: {vault.owner}</p>
      <p>Status: {vault.status}</p>
      <p>Beneficiaries: {vault.beneficiaries.length}</p>
    </div>
  );
}
```

## 🪝 Available Hooks

The `useGuardiaVault()` hook provides:

```typescript
const {
  loading,              // Boolean: true when transaction is pending
  createVault,          // Create a new vault
  checkIn,              // Perform check-in
  fetchVaultDetails,    // Get vault data
  fetchVaultStatus,     // Get vault status
  addBeneficiary,       // Add beneficiary
  addGuardian,          // Add guardian
  claimVault,           // Claim vault (for beneficiaries)
} = useGuardiaVault();
```

## 🔧 Helper Functions

```typescript
import { 
  daysToSeconds,
  secondsToDays,
  getVaultStatusString 
} from "@/lib/contracts/guardiaVault";

// Convert days to seconds for contract calls
const interval = daysToSeconds(30); // 30 days

// Convert seconds to days for display
const days = secondsToDays(vault.checkInInterval);

// Get human-readable status
const statusText = getVaultStatusString(vault.status);
```

## 🌐 Network Configuration

Currently configured for **local Hardhat network**:
- Chain ID: 31337
- Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### To Switch to Sepolia Testnet:

1. Update `client/.env`:
```env
VITE_GUARDIA_VAULT_ADDRESS=<your_deployed_address>
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

2. Deploy to Sepolia:
```bash
pnpm run deploy:sepolia
```

3. Update the contract address in `.env` with the new deployment address

## 🎨 Building UI Components

### Recommended Pages/Components to Build:

1. **Dashboard** (`/dashboard`)
   - List user's vaults
   - Show vault status (Active/Warning/Triggered)
   - Quick check-in buttons

2. **Create Vault Form** (`/vault/create`)
   - Check-in interval selector
   - Grace period selector
   - Beneficiary address inputs
   - Metadata/notes input

3. **Vault Details** (`/vault/:id`)
   - Vault information
   - Check-in history
   - Beneficiary list
   - Guardian list
   - Status timeline

4. **Beneficiary Panel** (`/beneficiary`)
   - Vaults where user is beneficiary
   - Claimable vaults
   - Claim interface

5. **Guardian Panel** (`/guardian`)
   - Vaults where user is guardian
   - Attestation interface

## 🔐 Wallet Integration

The hooks automatically use MetaMask or other injected wallets. Make sure users connect their wallet first!

Example wallet connection:
```typescript
const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  try {
    await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
  } catch (error) {
    console.error("User rejected connection");
  }
};
```

## 📝 Type Safety

All contract interactions are fully typed with TypeScript! Your IDE will provide autocompletion and type checking.

## 🧪 Testing

To test with a local Hardhat network:

1. Start a local node (in a separate terminal):
```bash
pnpm run node:local
```

2. Deploy contracts to the local node:
```bash
pnpm run deploy:local
```

3. Connect MetaMask to `localhost:8545` with Chain ID `31337`

4. Import a Hardhat test account into MetaMask

## 🎉 Ready to Go!

Your smart contracts are now fully integrated with the frontend. You can start building UI components that interact with the blockchain!

**Next steps:**
1. Build the vault creation form
2. Create the dashboard to display vaults
3. Add check-in functionality
4. Build beneficiary/guardian panels
5. Deploy to testnet when ready

---

**Questions?** Check the example code above or refer to `useGuardiaVault.ts` for all available functions!
