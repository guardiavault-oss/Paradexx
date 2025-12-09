# 🚀 Quick Start: Mempool Integration

## ✅ Integration Complete!

Your MEV protection service is now integrated with your mempool monitoring system.

## Setup (2 Steps)

### Step 1: Set Environment Variable

Add to your `.env` file:

```bash
MEMPOOL_API_URL=http://localhost:8001
```

(Or whatever port/host your mempool service runs on)

### Step 2: Start Services

```bash
# Terminal 1: Start your mempool service
cd unified-mempool-system
python api/unified_api_gateway.py

# Terminal 2: Start MEV protection (auto-connects to mempool)
cd MevGuard
python -m src.mev_protection.api.mev_protection_api
```

## How It Works

1. **Your mempool service** monitors all transactions
2. **MEV protection** subscribes to your mempool service
3. **Filters** transactions for protected addresses
4. **Automatically protects** when matches found
5. **Blocks MEV bots** in real-time

## Verify Integration

Check logs for:
```
✅ Connected to mempool service at http://localhost:8001
   Service status: healthy
✅ Connected to mempool WebSocket stream (real-time)
```

## Add Protected Token

```bash
curl -X POST http://localhost:8000/api/v1/protected-addresses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYourTokenAddress",
    "address_type": "token",
    "network": "ethereum",
    "protection_level": "maximum"
  }'
```

## That's It! 🎉

Your token is now protected. All transactions involving your token are automatically:
- ✅ Monitored via your mempool service
- ✅ Protected from MEV bots
- ✅ Routed through private relays
- ✅ Blocked if MEV attack detected

---

**No duplicate monitoring - everything uses your existing mempool infrastructure!**


