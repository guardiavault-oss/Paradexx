# APEX Sniper - Service Enhancements

## Overview
This update integrates 4 previously unexported advanced intelligence services into the APEX Sniper bot, adding sophisticated market analysis, arbitrage detection, portfolio risk management, and enhanced whale intelligence capabilities.

## New Services Integrated

### 1. Arbitrage Detector
**Module**: `services/ArbitrageDetector.ts`

**Capabilities**:
- Multi-DEX price scanning (Uniswap V2, SushiSwap)
- Cross-DEX arbitrage opportunity detection
- Automated profit calculation with gas costs
- Risk assessment (LOW/MEDIUM/HIGH)
- Real-time price monitoring across multiple DEXs

**Key Features**:
- Detects price discrepancies between DEXs
- Calculates optimal trade sizes
- Estimates net profit after gas and slippage
- Configurable minimum profit thresholds
- Auto-execution support for low-risk opportunities

**API Endpoints**:
- `GET /api/arbitrage/opportunities` - List all active arbitrage opportunities
- `GET /api/arbitrage/opportunities/:id` - Get specific opportunity details
- `GET /api/arbitrage/prices/:token` - Get token prices across all DEXs
- `POST /api/arbitrage/monitor/:token` - Add token to monitoring list
- `DELETE /api/arbitrage/monitor/:token` - Remove token from monitoring
- `GET /api/arbitrage/stats` - Get arbitrage statistics
- `GET /api/arbitrage/config` - Get current configuration
- `PUT /api/arbitrage/config` - Update configuration

### 2. Market Regime Detector
**Module**: `services/MarketRegimeDetector.ts`

**Capabilities**:
- Real-time market regime classification (TRENDING_UP, TRENDING_DOWN, RANGING, VOLATILE, ACCUMULATION, DISTRIBUTION, CAPITULATION, EUPHORIA)
- Advanced technical indicators (RSI, Moving Averages, Volatility, Momentum)
- Trading recommendations based on current regime
- Fear & Greed Index calculation
- Opportunity detection (dip buys, breakouts, etc.)

**Key Features**:
- Adaptive position sizing recommendations
- Risk-adjusted trading strategies
- Volatility spike detection
- Trend strength analysis
- Volume profile analysis

**API Endpoints**:
- `GET /api/market-regime` - Get full market analysis
- `GET /api/market-regime/current` - Get current regime and recommendation
- `POST /api/market-regime/analyze` - Force immediate analysis

**Integration**:
- **Execution Engine**: Automatically adjusts position sizes based on market regime
  - TRENDING_UP: 1.2x position size (aggressive)
  - TRENDING_DOWN: 0.5x position size (cautious)
  - VOLATILE: 0.3x position size (defensive)
  - CAPITULATION: 0.1x position size (paused)
  - EUPHORIA: 0.7x position size (cautious)
  
### 3. Portfolio Analytics
**Module**: `services/PortfolioAnalytics.ts`

**Capabilities**:
- Comprehensive portfolio metrics (Sharpe Ratio, Sortino Ratio, Win Rate, PnL)
- Real-time risk monitoring (Drawdown, VaR, Expected Shortfall)
- Circuit breaker system for loss protection
- Optimal position sizing using Kelly Criterion
- Trade performance tracking

**Key Features**:
- Automated risk alerts (drawdown warnings, concentration risk, etc.)
- Daily loss limit enforcement
- Portfolio concentration monitoring
- Equity curve tracking
- Volatility-adjusted position sizing

**API Endpoints**:
- `GET /api/portfolio/metrics` - Get comprehensive portfolio metrics
- `GET /api/portfolio/equity-curve` - Get historical equity curve
- `GET /api/portfolio/returns` - Get daily returns history
- `GET /api/portfolio/circuit-breaker` - Check circuit breaker status
- `POST /api/portfolio/circuit-breaker/reset` - Reset circuit breaker
- `GET /api/portfolio/config` - Get risk management configuration
- `PUT /api/portfolio/config` - Update risk limits
- `POST /api/portfolio/position-size` - Calculate optimal position size
- `POST /api/portfolio/can-open-position` - Check if position can be opened

**Integration**:
- **Execution Engine**: Pre-trade risk checks before every execution
  - Validates position size limits
  - Checks portfolio concentration
  - Enforces daily loss limits
  - Prevents trading when circuit breaker is active

### 4. Whale Intelligence
**Module**: `services/WhaleIntelligence.ts`

**Capabilities**:
- Advanced wallet profiling (trading style, win rate, reputation)
- Wallet clustering (coordinated groups, family wallets)
- Copy trade signal generation
- Coordinated activity detection (pumps, dumps)
- Reputation scoring system

**Key Features**:
- Wallet performance metrics (win rate, avg ROI, avg hold time)
- Trading style analysis (MOMENTUM, VALUE, SCALPER, HOLDER)
- Relationship mapping (funding sources, coordinated traders)
- Copy trade signal strength (STRONG, MODERATE, WEAK)
- Cluster discovery (DAOs, market makers, coordinated groups)

**API Endpoints**:
- `GET /api/whale-intelligence/profiles` - List all wallet profiles
- `GET /api/whale-intelligence/profiles/:address` - Analyze specific wallet
- `GET /api/whale-intelligence/top-performers` - Get top performing wallets
- `GET /api/whale-intelligence/clusters` - List wallet clusters
- `GET /api/whale-intelligence/clusters/:id` - Get cluster details
- `POST /api/whale-intelligence/clusters` - Create new cluster
- `GET /api/whale-intelligence/transactions` - Get recent whale transactions
- `PUT /api/whale-intelligence/profiles/:address/label` - Set wallet label
- `PUT /api/whale-intelligence/profiles/:address/type` - Set wallet type
- `POST /api/whale-intelligence/profiles/:address/verify` - Verify wallet

**Integration**:
- **Whale Tracker**: Automatic transaction recording and signal generation
  - Records all whale buy/sell transactions
  - Generates copy trade signals with confidence scores
  - Detects coordinated buying/selling activity
  - Auto-executes high-confidence copy trades

## Cross-Service Intelligence

### 1. Adaptive Position Sizing
The system now automatically adjusts position sizes based on:
- **Market Regime**: Increases size in trending markets, reduces in volatile markets
- **Portfolio Risk**: Enforces position size and concentration limits
- **Volatility**: Adjusts for current market volatility

### 2. Enhanced Copy Trading
Whale tracking now leverages whale intelligence for:
- **Smart Signal Filtering**: Only follows high-reputation wallets
- **Coordination Detection**: Alerts on coordinated whale activity
- **Performance-Based Decisions**: Weights signals by historical wallet performance

### 3. Risk Management Integration
All trading decisions now pass through:
- **Portfolio Risk Checks**: Validates against drawdown and concentration limits
- **Circuit Breaker**: Automatically pauses trading on excessive losses
- **Position Sizing**: Uses Kelly Criterion for optimal allocation

## Event-Driven Architecture

All services emit real-time events that are:
- Forwarded through SniperCore for centralized orchestration
- Broadcast via WebSocket to the dashboard
- Logged for historical analysis

### New Events:
- `opportunity:found` - Arbitrage opportunities detected
- `regime:changed` - Market regime transitions
- `copySignal:generated` - High-confidence copy trade signals
- `coordination:detected` - Coordinated whale activity
- `risk:alert` - Portfolio risk warnings
- `circuit:breaker` - Trading pause notifications

## Configuration

All services are configurable via API endpoints, allowing dynamic adjustment of:
- Risk limits (max drawdown, position size, concentration)
- Arbitrage thresholds (min profit, max slippage)
- Copy trade filters (min reputation, signal strength)
- Alert preferences

## Security & Safety

### Enhanced Safety Features:
1. **Multi-Layer Risk Management**
   - Market regime-based position sizing
   - Portfolio-level risk limits
   - Per-trade safety checks

2. **Automated Protection**
   - Circuit breaker on daily loss limits
   - Concentration risk monitoring
   - Drawdown alerts

3. **Whale Activity Intelligence**
   - Coordinated dump detection
   - Reputation-based filtering
   - Performance tracking

## Performance Optimizations

1. **Caching**: All services use NodeCache for efficient data retrieval
2. **Event-Driven**: Asynchronous event system prevents blocking
3. **Selective Execution**: Only high-confidence signals trigger actions
4. **Resource Management**: Periodic cleanup of stale data

## Usage Examples

### 1. Monitor Arbitrage Opportunities
```bash
# Get all active opportunities
curl http://localhost:3001/api/arbitrage/opportunities

# Add token to monitoring
curl -X POST http://localhost:3001/api/arbitrage/monitor/0x...

# Get token prices across DEXs
curl http://localhost:3001/api/arbitrage/prices/0x...
```

### 2. Check Market Regime
```bash
# Get current regime and recommendations
curl http://localhost:3001/api/market-regime/current

# Force immediate analysis
curl -X POST http://localhost:3001/api/market-regime/analyze
```

### 3. Portfolio Risk Management
```bash
# Get portfolio metrics
curl http://localhost:3001/api/portfolio/metrics

# Check if position can be opened
curl -X POST http://localhost:3001/api/portfolio/can-open-position \
  -H "Content-Type: application/json" \
  -d '{"sizeETH": 0.5, "token": "0x..."}'

# Reset circuit breaker (manual override)
curl -X POST http://localhost:3001/api/portfolio/circuit-breaker/reset
```

### 4. Whale Intelligence
```bash
# Analyze a wallet
curl http://localhost:3001/api/whale-intelligence/profiles/0x...

# Get top performing wallets
curl http://localhost:3001/api/whale-intelligence/top-performers?limit=10

# Create wallet cluster
curl -X POST http://localhost:3001/api/whale-intelligence/clusters \
  -H "Content-Type: application/json" \
  -d '{"wallets": ["0x...", "0x..."], "type": "COORDINATED", "name": "Whale Group"}'
```

## Dashboard Integration

All new services integrate seamlessly with the existing dashboard:
- Real-time arbitrage opportunities displayed
- Market regime indicator with trading recommendations
- Portfolio risk metrics and alerts
- Whale activity feed with copy trade signals

## Next Steps

Future enhancements could include:
1. Machine learning models for regime prediction
2. Cross-chain arbitrage detection
3. Advanced clustering algorithms for whale groups
4. Historical backtesting of portfolio strategies
5. Integration with additional DEXs (Uniswap V3, Curve, Balancer)

## Summary

This enhancement adds 4 powerful intelligence services with 40+ new API endpoints, providing traders with:
- ✅ Cross-DEX arbitrage opportunities
- ✅ Adaptive position sizing based on market conditions
- ✅ Comprehensive risk management and circuit breakers
- ✅ Advanced whale profiling and copy trade signals
- ✅ Real-time market regime detection
- ✅ Automated coordination detection

The services work together to create a sophisticated, AI-powered trading system that adapts to market conditions, manages risk automatically, and identifies high-probability opportunities.
