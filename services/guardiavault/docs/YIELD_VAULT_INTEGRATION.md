# YieldVault Protocol Integration

## Overview

The YieldVault contract has been fully integrated with real DeFi protocols (Lido and Aave) replacing placeholder functions with actual protocol interactions.

## Architecture

### Adapter Pattern

The integration uses an adapter pattern to abstract protocol-specific logic:

1. **LidoAdapter** - Handles ETH staking via Lido liquid staking
2. **AaveAdapter** - Handles ERC20 token lending via Aave V3

### Contract Structure

```
YieldVault.sol (Main Contract)
├── LidoAdapter.sol (ETH Staking)
│   └── ILido.sol (Lido Interface)
└── AaveAdapter.sol (Token Lending)
    └── IAave.sol (Aave Interfaces)
```

## Features Implemented

### 1. Protocol Adapters

#### LidoAdapter
- ✅ `stakeETH()` - Stake ETH and receive stETH
- ✅ `getBalance()` - Query stETH balance
- ✅ `getETHValue()` - Convert stETH to ETH value
- ✅ `getCurrentAPY()` - Get current Lido APY (~5.2%)
- ✅ `unstake()` - Unstake stETH to ETH

#### AaveAdapter
- ✅ `supply()` - Supply tokens to Aave and receive aTokens
- ✅ `withdraw()` - Withdraw tokens from Aave
- ✅ `getBalance()` - Query aToken balance
- ✅ `getCurrentAPY()` - Get current Aave APY
- ✅ `getAToken()` - Get aToken address for an asset

### 2. YieldVault Integration

#### Staking Functions
- ✅ `_stakeNative()` - Uses LidoAdapter for ETH staking
- ✅ `_stakeERC20()` - Uses AaveAdapter for token lending
- ✅ `_unstakeFunds()` - Handles unstaking from both protocols

#### Yield Management
- ✅ `_queryProtocolValue()` - Queries actual protocol balances
  - Lido: Converts stETH balance to ETH value
  - Aave: Returns aToken balance (already includes interest)
- ✅ `_harvest()` - Calculates yield from actual protocol values
- ✅ `updateYield()` - Updates yield with current protocol values

#### View Functions
- ✅ `getEstimatedAPY()` - Queries APY from protocol adapters

### 3. Backend Service Integration

#### YieldService (`server/services/yieldService.ts`)
- ✅ `getAvailableStrategies()` - Returns Lido and Aave strategies with real APY
- ✅ `getUserPositions()` - Fetches positions from contract and queries protocol values
- ✅ `createYieldPosition()` - Generates transaction data for position creation
- ✅ `updateVaultYield()` - Updates yield by querying protocol values
- ✅ `getCurrentVaultValue()` - Queries actual protocol balances
  - Lido: Uses adapter to get ETH value of stETH
  - Aave: Gets aToken balance directly

#### API Routes (`server/routes-yield.ts`)
- ✅ `GET /api/yield/strategies` - List available yield strategies
- ✅ `GET /api/yield/positions` - Get user's yield positions
- ✅ `POST /api/yield/positions` - Create new yield position
- ✅ `POST /api/yield/positions/:vaultId/update` - Update yield for vault
- ✅ `GET /api/yield/apy/:protocol` - Get current APY for protocol

## Protocol Addresses

### Mainnet

**Lido:**
- Lido Contract: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- stETH Token: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`

**Aave V3:**
- Pool: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
- USDC: `0xA0b86A33e6441B8435b662303c4B5C5B7B8e4E8a`
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

## How It Works

### 1. Creating a Yield Position

**ETH (Lido):**
```solidity
yieldVault.deposit{value: amount}(guardiaVaultId, lidoAdapterAddress)
```
- ETH is sent to YieldVault
- YieldVault calls `lidoAdapter.stakeETH()`
- Receives stETH tokens
- stETH stored in YieldVault contract

**ERC20 (Aave):**
```solidity
yieldVault.createYieldVault(guardiaVaultId, tokenAddress, amount, aaveAdapterAddress)
```
- Tokens transferred to YieldVault
- YieldVault calls `aaveAdapter.supply()`
- Receives aTokens
- aTokens stored in YieldVault contract

### 2. Yield Calculation

The `_harvest()` function:
1. Calls `_queryProtocolValue()` to get current value from protocol
2. Compares to principal to calculate yield
3. Calculates 1% performance fee
4. Updates `yieldAccumulated` and `yieldFeeCollected`
5. Transfers fee to treasury

**Lido:**
- Queries stETH balance via adapter
- Converts stETH to ETH value (accounts for rebasing)

**Aave:**
- Queries aToken balance directly
- aToken balance already includes accrued interest

### 3. Unstaking

When vault is triggered or withdrawn:
1. `_unstakeFunds()` identifies protocol type
2. Lido: Calls `lidoAdapter.unstake(stETHBalance)`
3. Aave: Calls `aaveAdapter.withdraw(asset, aTokenBalance)`
4. Original asset returned to beneficiary

## Environment Variables

Add to `.env`:

```bash
# Contract Addresses (after deployment)
YIELD_VAULT_ADDRESS=0x...
LIDO_ADAPTER_ADDRESS=0x...
AAVE_ADAPTER_ADDRESS=0x...

# RPC URLs
SEPOLIA_RPC_URL=https://...
MAINNET_RPC_URL=https://...

# Keeper (for automated yield updates)
KEEPER_PRIVATE_KEY=0x...
KEEPER_SECRET=your-secret-for-api-auth
```

## Deployment

1. Deploy adapters first:
   ```bash
   npx hardhat deploy --tags LidoAdapter
   npx hardhat deploy --tags AaveAdapter
   ```

2. Deploy YieldVault with adapter addresses:
   ```bash
   npx hardhat deploy --tags YieldVault --constructor-args treasuryAddress
   ```

3. Initialize protocols in YieldVault (auto-done in constructor)

4. Set environment variables with deployed addresses

## Usage Example

### Frontend

```typescript
// Get available strategies
const strategies = await fetch('/api/yield/strategies').then(r => r.json());

// Create position
const txData = await fetch('/api/yield/positions', {
  method: 'POST',
  body: JSON.stringify({
    guardiaVaultId: 1,
    asset: 'ETH',
    amount: '1.0',
    protocol: 'lido'
  })
}).then(r => r.json());

// Sign and send transaction
await signer.sendTransaction(txData.txData);
```

### Backend (Cron Job)

```typescript
// Update yield for all vaults
const vaultIds = await getActiveYieldVaults();
for (const vaultId of vaultIds) {
  await yieldService.updateVaultYield(vaultId);
}
```

## Security Considerations

1. **Reentrancy Protection**: All external calls protected with `nonReentrant`
2. **Protocol Validation**: Only approved adapters can be used
3. **Access Control**: Only vault owner or GuardiaVault contract can trigger
4. **Error Handling**: Graceful fallbacks if protocol queries fail
5. **Fee Collection**: Fees automatically sent to treasury

## Testing

```bash
# Compile contracts
npm run compile

# Run tests
npm run test:contracts

# Deploy to testnet
npm run deploy:sepolia
```

## Next Steps

- [ ] Add more protocols (Compound, Yearn, etc.)
- [ ] Implement oracle-based APY updates
- [ ] Add yield optimization strategies
- [ ] Implement automatic rebalancing
- [ ] Add protocol risk monitoring

