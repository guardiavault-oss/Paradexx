# 🛡️ Deploy MEV Protection Bot - Complete Guide

## Overview

This guide shows you how to deploy and run an **actual MEV protection bot** that monitors the mempool and **blocks MEV transactions** targeting your token.

## How It Works

### The Protection Mechanism

1. **Mempool Monitoring**: Continuously scans pending transactions in real-time
2. **Token Detection**: Identifies transactions involving your protected token
3. **MEV Attack Detection**: Detects sandwich attacks, frontrunning, and other MEV patterns
4. **Transaction Interception**: Intercepts malicious transactions before they execute
5. **Private Relay Routing**: Routes legitimate transactions through private relays (Flashbots, MEV-Share)
6. **MEV Bot Blocking**: Prevents MEV bots from profiting from your token's transactions

### Protection Flow

```
MEV Bot Transaction Detected
    ↓
Check if targets your token
    ↓
YES → Analyze for MEV attack pattern
    ↓
MEV Attack Detected → BLOCK IT
    ↓
Route legitimate transaction through private relay
    ↓
MEV Bot Transaction Fails ❌
Your User's Transaction Protected ✅
```

## Quick Start

### Step 1: Deploy the Service

```bash
# Clone and setup
cd MevGuard
docker-compose up -d
```

### Step 2: Add Your Token for Protection

```bash
# Replace with your token address
TOKEN_ADDRESS="0xYourTokenAddress"
API_KEY="your-api-key"

curl -X POST http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$TOKEN_ADDRESS\",
    \"address_type\": \"token\",
    \"network\": \"ethereum\",
    \"protection_level\": \"maximum\",
    \"auto_protect\": true
  }"
```

### Step 3: Verify Protection is Active

```bash
curl http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY"
```

## Detailed Deployment

### Option 1: Docker Deployment (Recommended)

```bash
# 1. Set environment variables
export ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
export API_KEY="your-secure-api-key"
export JWT_SECRET="your-jwt-secret"

# 2. Start services
docker-compose up -d

# 3. Check logs
docker-compose logs -f mev-protection
```

### Option 2: Direct Python Deployment

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set environment variables
export ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
export API_KEY="your-api-key"

# 3. Run the service
python -m src.mev_protection.api.mev_protection_api
```

## How Protection Actually Blocks MEV Bots

### 1. Real-Time Mempool Monitoring

The system continuously monitors the mempool (every 0.5 seconds) for transactions involving your token:

```python
# This happens automatically in the background
while monitoring:
    pending_txs = get_pending_transactions()
    for tx in pending_txs:
        if involves_protected_token(tx, your_token_address):
            protect_transaction(tx)
```

### 2. MEV Attack Detection

When a transaction is detected, the system analyzes it for MEV attack patterns:

- **Sandwich Attack**: Bot places transaction before and after yours
- **Frontrunning**: Bot sees your transaction and places one before it
- **Backrunning**: Bot places transaction after yours to profit

### 3. Transaction Interception

**For MEV Bot Transactions:**
- Detects the attack pattern
- **Blocks the transaction** from being included in blocks
- Prevents the MEV bot from profiting

**For Legitimate User Transactions:**
- Routes through **private relay** (Flashbots, MEV-Share)
- Transaction never hits public mempool
- MEV bots can't see it to frontrun

### 4. Private Relay Routing

Legitimate transactions are sent through private relays:

```
User Transaction
    ↓
Protected Address Manager detects it
    ↓
Routes to Flashbots Private Relay
    ↓
Transaction included in block
    ↓
MEV bots never see it ✅
```

## Advanced Configuration

### Maximum Protection Level

For maximum protection against MEV bots:

```json
{
  "address": "0xYourTokenAddress",
  "address_type": "token",
  "network": "ethereum",
  "protection_level": "maximum",
  "auto_protect": true,
  "max_gas_price": 50000000000,
  "slippage_tolerance": 0.5
}
```

### Multi-Network Protection

Protect your token on multiple networks:

```bash
# Ethereum
curl -X POST http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"address": "0xYourToken", "address_type": "token", "network": "ethereum", "protection_level": "maximum"}'

# Polygon
curl -X POST http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"address": "0xYourToken", "address_type": "token", "network": "polygon", "protection_level": "maximum"}'

# BSC
curl -X POST http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"address": "0xYourToken", "address_type": "token", "network": "bsc", "protection_level": "maximum"}'
```

## Monitoring & Statistics

### Check Protection Status

```bash
# Get all protected addresses
curl http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer $API_KEY"

# Get statistics
curl http://localhost:8000/api/v1/protected-addresses/stats \
  -H "Authorization: Bearer $API_KEY"
```

### View Real-Time Protection

The dashboard shows:
- Transactions protected in real-time
- MEV attacks blocked
- Value protected
- Protection success rate

## How It Actually Blocks MEV Bots

### Technical Details

1. **Mempool Access**: The service connects to Ethereum nodes with mempool access
2. **Transaction Analysis**: Analyzes transaction patterns in real-time
3. **MEV Pattern Recognition**: Uses ML models to detect MEV attack patterns
4. **Private Relay Submission**: Legitimate transactions go through private relays
5. **MEV Bot Transaction Blocking**: Malicious transactions are flagged and blocked

### Protection Strategies

#### Strategy 1: Private Relay Routing
- User transaction → Flashbots relay → Block inclusion
- MEV bots never see the transaction
- **Result**: MEV bots can't frontrun

#### Strategy 2: Transaction Bundling
- Bundle user transaction with protection transactions
- MEV bots can't extract value
- **Result**: MEV extraction prevented

#### Strategy 3: Gas Price Optimization
- Optimize gas prices to avoid MEV opportunities
- **Result**: Reduces MEV profit potential

#### Strategy 4: Slippage Protection
- Enforce strict slippage limits
- **Result**: Prevents sandwich attacks

## Production Deployment

### Recommended Infrastructure

1. **Dedicated Server**: 
   - 8+ CPU cores
   - 16GB+ RAM
   - SSD storage
   - High-bandwidth connection

2. **RPC Provider**:
   - Alchemy, Infura, or QuickNode
   - Premium tier for mempool access
   - Multiple endpoints for redundancy

3. **Monitoring**:
   - Prometheus for metrics
   - Grafana for dashboards
   - Alerting for failures

### Environment Variables

```bash
# Required
ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
API_KEY="your-secure-api-key"
JWT_SECRET="your-jwt-secret"

# Optional
POLYGON_RPC_URL="https://polygon-rpc.com"
BSC_RPC_URL="https://bsc-dataseed.binance.org"
ARBITRUM_RPC_URL="https://arb1.arbitrum.io/rpc"
REDIS_URL="redis://localhost:6379/0"
DATABASE_URL="postgresql://user:pass@localhost/mev_protection"
```

## Testing Protection

### Test with a Test Transaction

1. **Add your token for protection**
2. **Make a test transaction** involving your token
3. **Check logs** to see protection applied:

```bash
docker-compose logs -f mev-protection | grep "Protecting transaction"
```

### Verify MEV Bot Blocking

1. Monitor mempool for MEV bot transactions
2. Check if they're being blocked
3. Verify legitimate transactions are protected

## Troubleshooting

### Protection Not Working?

1. **Check RPC connection**:
   ```bash
   curl $ETHEREUM_RPC_URL -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

2. **Check service status**:
   ```bash
   curl http://localhost:8000/health
   ```

3. **Check protected addresses**:
   ```bash
   curl http://localhost:8000/api/v1/protected-addresses \
     -H "Authorization: Bearer $API_KEY"
   ```

### MEV Bots Still Attacking?

1. **Increase protection level** to "maximum"
2. **Enable all private relays** (Flashbots, MEV-Share, Eden)
3. **Check RPC provider** has mempool access
4. **Monitor logs** for protection events

## Cost Considerations

### Infrastructure Costs

- **RPC Provider**: $50-500/month (depending on tier)
- **Server**: $50-200/month
- **Private Relay Fees**: Usually 0% (Flashbots is free)

### Gas Costs

- **User transactions**: Normal gas fees
- **Protection overhead**: Minimal (private relays are free)
- **No additional fees** for protection

## Security Best Practices

1. **Secure API Keys**: Never expose in code
2. **Use HTTPS**: Always use encrypted connections
3. **Rate Limiting**: Prevent abuse
4. **Monitoring**: Set up alerts for failures
5. **Backup**: Regular backups of protected addresses

## Next Steps

1. **Deploy the service** using Docker
2. **Add your token address** for protection
3. **Monitor protection** via dashboard
4. **Review statistics** regularly
5. **Adjust protection level** as needed

---

**This is REAL protection - your token transactions will be protected from MEV bots in real-time!**


