# 🚀 APEX SNIPER

<div align="center">

![Apex Sniper](https://img.shields.io/badge/Apex-Sniper-00D9FF?style=for-the-badge&logo=ethereum&logoColor=white)
![Version](https://img.shields.io/badge/version-2.0.0-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**🏆 World-Class Ethereum Sniper Bot for Real Token Launches**

*Block-0 sniping • Multi-RPC failover • Deployer tracking • MEV protection • Zero mocks*

[Features](#features) • [Installation](#installation) • [Configuration](#configuration) • [Usage](#usage) • [API](#api)

</div>

---

## ⚡ What's New in v2.0

### 🎯 Real Launch Capabilities
- **Block-0 Sniping** - Pre-signed transactions for instant execution at the moment of launch
- **Multi-RPC Failover** - Automatic failover across 6+ RPC endpoints for maximum uptime
- **Deployer Tracking** - Monitor specific deployers and auto-snipe their new tokens
- **Advanced Gas Optimization** - Dynamic gas estimation with historical analysis

### 🚀 Enhanced Performance
- **Parallel Execution** - Send transactions to multiple endpoints simultaneously
- **WebSocket Priority** - Real-time block and pending tx monitoring
- **Latency Optimization** - Sub-100ms detection to execution

---

## ⚡ Features

### Core Sniping Capabilities
- **🎯 Block-0 Sniping** - Pre-sign transactions for instant execution when liquidity is added
- **🔥 Deployer Tracking** - Watch deployers and auto-snipe their new tokens
- **🚀 Liquidity Launch Sniping** - Detect and snipe new liquidity pools instantly
- **📊 Limit Order Sniping** - Set buy orders at target prices
- **🐋 Whale Copy Trading** - Mirror trades from successful wallets
- **👁️ Smart Money Tracking** - Follow profitable traders automatically

### High Availability
- **🔄 Multi-RPC Failover** - Automatic switching between RPC endpoints
- **📡 Parallel Broadcasting** - Send transactions to multiple nodes
- **⚡ Health Monitoring** - Real-time RPC latency and health tracking
- **🌐 Built-in Endpoints** - Pre-configured public RPC endpoints

### MEV Protection
- **🔒 Flashbots Integration** - Private bundle submission for frontrun protection
- **🛡️ MEV Blocker Support** - Multiple protection strategies
- **⚡ Multi-builder Submission** - Submit to multiple block builders for better inclusion

### Safety & Analysis
- **🍯 Honeypot Detection** - Multi-source honeypot analysis
- **📈 Tax Analysis** - Real-time buy/sell tax detection
- **🔍 Contract Analysis** - Detect blacklists, pausable contracts, mint functions
- **💧 Liquidity Analysis** - Check lock status and LP holder distribution
- **👤 Owner Analysis** - Track deployer history and holdings

### Advanced Gas System
- **📊 Historical Analysis** - Gas prediction based on block history
- **⚡ Aggressive Mode** - Outbid competitors with dynamic pricing
- **🎯 Sniper Presets** - Optimized gas settings for different urgency levels
- **📈 Trend Prediction** - Anticipate gas price movements

### Position Management
- **📊 Auto Take-Profit** - Set multiple TP targets with percentage sells
- **🛑 Stop-Loss Protection** - Automatic position exit on loss threshold
- **📈 Trailing Stop** - Dynamic stop that follows price upward
- **💰 Real-time PnL** - Track unrealized and realized profits

### Dashboard & Monitoring
- **🖥️ Real-time Dashboard** - Premium glassmorphic UI
- **📱 WebSocket Updates** - Live position and order updates
- **📊 Performance Stats** - Win rate, PnL, latency metrics
- **🔔 Alert System** - Real-time notifications for whale movements

---

## 🛠️ Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- Ethereum RPC endpoint (Infura, Alchemy, or private node)
- Flashbots auth key (optional but recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/apex-sniper.git
cd apex-sniper

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f apex-sniper
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Network Configuration
CHAIN_ID=1                                    # 1 for mainnet, 11155111 for Sepolia
RPC_URL=https://eth.llamarpc.com              # HTTP RPC endpoint
WS_RPC_URL=wss://eth.llamarpc.com             # WebSocket RPC endpoint
PRIVATE_RPC_URL=https://rpc.mevblocker.io     # Optional: MEV-protected RPC

# API Keys
FLASHBOTS_AUTH_KEY=your-flashbots-key         # From Flashbots
ETHERSCAN_API_KEY=your-etherscan-key          # For contract verification checks

# Wallet Configuration
WALLET_1_NAME=Main Sniper                     # Wallet display name
WALLET_1_KEY=0x...                            # Private key (64 hex chars)

# Feature Flags
FLASHBOTS_ENABLED=true                        # Use Flashbots for transactions
WHALE_TRACKING_ENABLED=true                   # Enable whale tracking
AUTO_SELL_ENABLED=true                        # Enable auto take-profit/stop-loss

# Trading Defaults
DEFAULT_SLIPPAGE=10                           # Default slippage percentage
DEFAULT_GAS_MULTIPLIER=1.2                    # Gas price multiplier
MAX_GAS_PRICE=100000000000                    # Max gas in wei (100 gwei)
```

---

## 🎮 Usage

### Web Dashboard

Access the dashboard at `http://localhost:3000` after starting the server.

**Dashboard Features:**
- Start/Stop sniper
- Configure snipe settings
- Manual buy/sell
- View open positions
- Monitor whale activity
- Real-time alerts

### API Endpoints

#### System Control
```bash
# Get system status
curl http://localhost:3001/api/status

# Start sniper
curl -X POST http://localhost:3001/api/start

# Stop sniper
curl -X POST http://localhost:3001/api/stop
```

#### Manual Trading
```bash
# Buy token
curl -X POST http://localhost:3001/api/buy \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0x...",
    "amountEth": "0.1",
    "walletId": "wallet-1",
    "slippage": 10
  }'

# Sell token
curl -X POST http://localhost:3001/api/sell \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0x...",
    "amount": "100",
    "walletId": "wallet-1",
    "isPercent": true
  }'
```

#### Token Analysis
```bash
# Full safety analysis
curl http://localhost:3001/api/analyze/0xTokenAddress

# Quick honeypot check
curl http://localhost:3001/api/analyze/0xTokenAddress/quick
```

#### Snipe Configurations
```bash
# Create liquidity launch snipe
curl -X POST http://localhost:3001/api/configs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LIQUIDITY_LAUNCH",
    "targetToken": "0x...",
    "walletIds": ["wallet-1"],
    "amountEth": "0.5",
    "maxBuyTax": 10,
    "maxSellTax": 15,
    "autoSellEnabled": true,
    "takeProfitPercentages": [50, 100, 200],
    "stopLossPercentage": 30
  }'

# List all configs
curl http://localhost:3001/api/configs
```

#### Whale Tracking
```bash
# Add tracked wallet
curl -X POST http://localhost:3001/api/whales \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "label": "Top Trader",
    "copyTradeEnabled": true,
    "copyTradePercentage": 10
  }'

# Get whale transactions
curl http://localhost:3001/api/whales/transactions
```

#### Deployer Tracking (NEW)
```bash
# Add deployer to watch
curl -X POST http://localhost:3001/api/deployers \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "label": "Known Dev",
    "autoSnipe": true,
    "autoSnipeAmount": "0.5"
  }'

# Get deployer history
curl http://localhost:3001/api/deployers/0x.../tokens
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APEX SNIPER v2.0                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │   Multi-RPC    │───▶│    Mempool     │───▶│   Block-0      │             │
│  │   Provider     │    │    Monitor     │    │   Sniper       │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
│         │                     │                     │                        │
│         ▼                     ▼                     ▼                        │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │     Gas        │    │    Token       │    │   Deployer     │             │
│  │   Optimizer    │◀──▶│   Analyzer     │◀──▶│   Tracker      │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
│         │                     │                     │                        │
│         ▼                     ▼                     ▼                        │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │   Flashbots    │    │    Sniper      │    │    Whale       │             │
│  │   Provider     │◀──▶│    Core        │◀──▶│   Tracker      │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
│         │                     │                     │                        │
│         ▼                     ▼                     ▼                        │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │   Execution    │    │   Position     │    │     API        │             │
│  │    Engine      │    │   Manager      │    │    Server      │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
│                                                      │                       │
│                                                      ▼                       │
│                                              ┌────────────────┐              │
│                                              │   Dashboard    │              │
│                                              │   (React)      │              │
│                                              └────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Components

| Component | Description |
|-----------|-------------|
| **Multi-RPC Provider** | Manages multiple RPC endpoints with automatic failover and health monitoring |
| **Block-0 Sniper** | Pre-signs transactions for instant execution when liquidity is added |
| **Gas Optimizer** | Dynamic gas estimation with historical analysis and prediction |
| **Deployer Tracker** | Monitors token deployers for early detection of new launches |

---

## 🔒 Security Best Practices

1. **Never share your private keys** - Store them securely in `.env`
2. **Use dedicated wallets** - Don't use wallets with large holdings
3. **Start with small amounts** - Test with small ETH amounts first
4. **Enable safety checks** - Always use honeypot detection
5. **Set stop losses** - Protect against sudden dumps
6. **Monitor gas prices** - High gas can eat into profits
7. **Use Flashbots** - Protect against frontrunning

---

## 📈 Performance Optimization

### Latency Optimization
- Use dedicated/private RPC nodes
- Run close to Ethereum nodes (AWS/GCP us-east)
- Enable WebSocket connections for real-time data
- Use Flashbots for guaranteed inclusion

### Gas Optimization
- Use supporting fee-on-transfer functions
- Set appropriate gas multipliers
- Monitor network congestion

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK.** This software is provided "as is" without warranty of any kind. Trading cryptocurrencies involves substantial risk of loss. The developers are not responsible for any financial losses incurred through the use of this software.

- Always do your own research before trading
- Never invest more than you can afford to lose
- This is not financial advice

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 💜 for the degen community**

[Report Bug](https://github.com/yourusername/apex-sniper/issues) • [Request Feature](https://github.com/yourusername/apex-sniper/issues)

</div>
