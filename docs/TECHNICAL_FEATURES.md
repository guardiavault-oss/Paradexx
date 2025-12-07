# GuardiaVault Technical Features Documentation

> Complete technical specification of ReGen (Protection) and DeGen (Trading) feature sets

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [ReGen Mode - Protection Features](#regen-mode---protection-features)
3. [DeGen Mode - Trading Features](#degen-mode---trading-features)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [External Integrations](#external-integrations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      GuardiaVault Platform                       │
├─────────────────────────────┬───────────────────────────────────┤
│         ReGen Mode          │           DeGen Mode              │
│    (Protection & Safety)    │      (Trading & Profits)          │
├─────────────────────────────┼───────────────────────────────────┤
│ • Wallet Guard              │ • Meme Scanner                    │
│ • MEV Guard                 │ • Sniper Bot                      │
│ • Guardian System           │ • Smart Stop-Loss                 │
│ • Inheritance Vault         │ • Gains Lock                      │
│ • Transaction Simulation    │ • Recovery Fund                   │
│ • Threat Detection          │ • Degen Score                     │
│                             │ • Whale Tracker                   │
│                             │ • Airdrop Hunter                  │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Shared Layer    │
                    ├───────────────────┤
                    │ • Authentication  │
                    │ • Database (SQL)  │
                    │ • WebSocket       │
                    │ • Queue System    │
                    │ • External APIs   │
                    └───────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (dev) / PostgreSQL (prod), Prisma ORM |
| Real-time | WebSocket, Server-Sent Events |
| Queue | Bull Queue with Redis |
| External APIs | DEXScreener, Honeypot.is, GoPlusLabs, Moralis, Etherscan |

---

## ReGen Mode - Protection Features

### 1. Wallet Guard

**Purpose:** Real-time wallet monitoring, threat detection, and automated protection actions.

#### Service: `wallet-guard.service.ts`

```typescript
interface WalletGuardService {
  // Core Methods
  initialize(): Promise<void>
  startMonitoring(config: MonitoringConfig): Promise<WalletInfo>
  stopMonitoring(address: string, network: string): boolean
  
  // Threat Detection
  detectThreats(address: string, network: string): Promise<ThreatInfo[]>
  calculateRiskScore(address: string, network: string): Promise<number>
  
  // Transaction Simulation
  simulateTransaction(address: string, tx: Transaction, network: string): Promise<SimulationResult>
  
  // Protection Actions
  applyProtection(address: string, action: ProtectionActionType, network: string, metadata?: any): Promise<ProtectionAction>
  
  // Analytics
  getAnalytics(address: string, network: string, timeframe: string): Promise<WalletAnalytics>
  getWalletStatus(address: string, network?: string): Promise<WalletInfo | null>
  getMonitoredWallets(): WalletInfo[]
  getProtectionHistory(address?: string): ProtectionAction[]
}
```

#### Security Levels

| Level | Risk Threshold | Auto-Protect | Actions |
|-------|---------------|--------------|---------|
| LOW | 70+ | No | Alert only |
| MEDIUM | 50+ | Optional | Alert + Suggest |
| HIGH | 30+ | Yes | Auto-block suspicious |
| CRITICAL | Any | Yes | Immediate lockdown |

#### Threat Types

```typescript
enum ThreatType {
  PHISHING = 'phishing',           // Known phishing address interaction
  SUSPICIOUS_CONTRACT = 'suspicious_contract',
  KNOWN_SCAMMER = 'known_scammer',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  DRAINER_CONTRACT = 'drainer_contract',
  APPROVAL_EXPLOIT = 'approval_exploit',
  FLASH_LOAN_ATTACK = 'flash_loan_attack',
  SANDWICH_ATTACK = 'sandwich_attack'
}
```

#### Protection Actions

```typescript
enum ProtectionActionType {
  BLOCK_TRANSACTION = 'block_transaction',
  REVOKE_APPROVAL = 'revoke_approval',
  EMERGENCY_TRANSFER = 'emergency_transfer',
  FREEZE_WALLET = 'freeze_wallet',
  ALERT_GUARDIANS = 'alert_guardians',
  WHITELIST_ADDRESS = 'whitelist_address',
  BLACKLIST_ADDRESS = 'blacklist_address'
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet-guard/health` | Service health check |
| POST | `/api/wallet-guard/monitor` | Start monitoring wallet |
| GET | `/api/wallet-guard/status/:address` | Get wallet status |
| POST | `/api/wallet-guard/simulate` | Simulate transaction |
| POST | `/api/wallet-guard/protect` | Apply protection action |
| GET | `/api/wallet-guard/analytics` | Get wallet analytics |
| POST | `/api/wallet-guard/stop` | Stop monitoring |
| GET | `/api/wallet-guard/monitored` | List monitored wallets |
| GET | `/api/wallet-guard/history` | Protection action history |

---

### 2. MEV Guard

**Purpose:** Protect transactions from MEV (Maximal Extractable Value) attacks including sandwich attacks, frontrunning, and backrunning.

#### Service: `mev-guard.service.ts`

```typescript
interface MEVGuardService {
  // Transaction Protection
  protectTransaction(params: ProtectTransactionParams): Promise<ProtectedTransaction>
  
  // MEV Analysis
  analyzeMevExposure(params: AnalyzeParams): Promise<MEVExposureAnalysis>
  detectSandwichAttack(txHash: string, chainId: number): Promise<SandwichDetection>
  
  // Mempool Monitoring
  getMempoolStats(): MempoolStats
  
  // Health Check
  checkHealth(): Promise<HealthStatus>
}
```

#### Protection Methods

| Method | Description | Gas Overhead | Privacy Level |
|--------|-------------|--------------|---------------|
| **Flashbots** | Direct to block builders | Low | High |
| **Private Mempool** | Skip public mempool | Medium | Very High |
| **MEV Blocker** | Rebate MEV to user | Low | Medium |
| **Time Delay** | Random delay submission | None | Low |

#### MEV Exposure Analysis

```typescript
interface MEVExposureAnalysis {
  exposureLevel: 'low' | 'medium' | 'high' | 'critical'
  exposureScore: number                    // 0-100
  potentialMevLoss: string                 // Estimated USD loss
  vulnerabilities: {
    sandwichRisk: number
    frontrunRisk: number
    backrunRisk: number
    liquidationRisk: number
  }
  recommendations: string[]
  suggestedProtection: ProtectionMethod
}
```

#### Sandwich Attack Detection

```typescript
interface SandwichDetection {
  detected: boolean
  attackerAddress?: string
  frontrunTx?: string
  backrunTx?: string
  victimLoss?: string
  attackerProfit?: string
  blockNumber?: number
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mev-guard/status` | Service status |
| POST | `/api/mev-guard/protect` | Protect a transaction |
| POST | `/api/mev-guard/analyze` | Analyze MEV exposure |
| POST | `/api/mev-guard/detect-sandwich` | Detect sandwich attack |
| GET | `/api/mev-guard/mempool-stats` | Get mempool statistics |

---

### 3. Guardian System (Social Recovery)

**Purpose:** Decentralized social recovery using trusted contacts as guardians who can help recover wallet access.

#### Database Schema

```prisma
model Guardian {
  id            String    @id @default(cuid())
  userId        String
  email         String
  name          String
  phone         String?
  relationship  String?
  
  // Security
  inviteToken   String    @unique
  encryptedShard String?  // Encrypted key shard
  shardIndex    Int
  
  // Status
  status        String    @default("pending") // pending, active, revoked
  acceptedAt    DateTime?
  lastVerified  DateTime?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id])
}
```

#### Recovery Flow

```
1. User Initiates Recovery Request
         │
         ▼
2. System Notifies All Guardians (email/SMS)
         │
         ▼
3. Guardians Verify Identity (video call, security questions)
         │
         ▼
4. Guardians Approve/Reject (M of N threshold)
         │
         ▼
5. If Approved: Guardians Submit Key Shards
         │
         ▼
6. System Reconstructs Access (Shamir's Secret Sharing)
         │
         ▼
7. User Regains Wallet Access
```

#### Guardian Thresholds

| Total Guardians | Required for Recovery | Security Level |
|-----------------|----------------------|----------------|
| 3 | 2 | Basic |
| 5 | 3 | Standard |
| 7 | 4 | High |
| 9 | 5 | Maximum |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guardians` | List user's guardians |
| POST | `/api/guardians/invite` | Invite new guardian |
| POST | `/api/guardians/accept/:token` | Accept guardian invite |
| DELETE | `/api/guardians/:id` | Remove guardian |
| POST | `/api/guardians/recovery/initiate` | Start recovery process |
| POST | `/api/guardians/recovery/approve/:requestId` | Approve recovery |
| GET | `/api/guardians/recovery/status/:requestId` | Recovery status |

---

### 4. Inheritance Vault

**Purpose:** Automated crypto inheritance system with inactivity detection and beneficiary management.

#### Database Schema

```prisma
model Beneficiary {
  id                      String    @id @default(cuid())
  userId                  String
  email                   String
  name                    String
  relationship            String?
  percentage              Int       // Inheritance percentage (0-100)
  
  // Verification
  requiresDeathCertificate Boolean  @default(true)
  manualVerification       Boolean  @default(false)
  
  // Status
  isActive                Boolean   @default(true)
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  user                    User      @relation(fields: [userId], references: [id])
}
```

#### Inactivity Detection

```typescript
interface InactivityConfig {
  checkInterval: number           // Days between checks
  warningThreshold: number        // Days before first warning
  finalThreshold: number          // Days before inheritance triggers
  verificationMethods: string[]   // ['email', 'sms', 'app_notification']
  requireMultipleFailures: number // Number of failed checks required
}

// Default Configuration
const DEFAULT_CONFIG: InactivityConfig = {
  checkInterval: 30,              // Check monthly
  warningThreshold: 180,          // 6 months warning
  finalThreshold: 365,            // 1 year final
  verificationMethods: ['email', 'sms', 'app_notification'],
  requireMultipleFailures: 3
}
```

#### Inheritance Flow

```
1. User Sets Up Beneficiaries
         │
         ▼
2. System Monitors Activity (transactions, logins)
         │
         ▼
3. Inactivity Detected → Warning Sent
         │
         ▼
4. No Response → Multiple Verification Attempts
         │
         ▼
5. All Attempts Failed → Inheritance Process Starts
         │
         ▼
6. Beneficiaries Notified + Identity Verification
         │
         ▼
7. Optional: Death Certificate Upload
         │
         ▼
8. Assets Distributed Per Allocation
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inheritance/beneficiaries` | List beneficiaries |
| POST | `/api/inheritance/beneficiaries` | Add beneficiary |
| PUT | `/api/inheritance/beneficiaries/:id` | Update beneficiary |
| DELETE | `/api/inheritance/beneficiaries/:id` | Remove beneficiary |
| GET | `/api/inheritance/config` | Get inheritance config |
| PUT | `/api/inheritance/config` | Update config |
| POST | `/api/inheritance/verify-activity` | Manual activity verification |

---

## DeGen Mode - Trading Features

### 1. Meme Scanner

**Purpose:** Real-time discovery and analysis of trending meme tokens across multiple chains and DEXs.

#### Service: `meme-scanner.service.ts`

```typescript
interface MemeScannerService {
  // Token Discovery
  fetchTrending(): Promise<TrendingData>
  scanToken(address: string, chainId: number): Promise<TokenScanResult>
  
  // Analysis
  analyzeToken(address: string, chainId: number): Promise<TokenAnalysis>
  checkHoneypot(address: string, chainId: number): Promise<HoneypotResult>
  
  // Alerts
  setAlert(params: AlertParams): Promise<Alert>
  getAlerts(): Alert[]
}
```

#### Token Scoring System

```typescript
interface TokenScore {
  safetyScore: number      // 0-100: Contract safety
  trendScore: number       // 0-100: Social/volume trends
  socialScore: number      // 0-100: Community engagement
  overallScore: number     // Weighted average
  
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'avoid'
  
  risks: string[]          // Identified risks
  opportunities: string[]  // Potential opportunities
}
```

#### Scoring Weights

| Factor | Weight | Source |
|--------|--------|--------|
| Liquidity | 25% | DEXScreener |
| Volume | 20% | DEXScreener |
| Honeypot Check | 20% | Honeypot.is |
| Contract Audit | 15% | GoPlusLabs |
| Social Metrics | 10% | Twitter/Telegram |
| Price Action | 10% | DEXScreener |

#### Signal Detection

```typescript
enum TokenSignal {
  HIGH_VOLUME = '🔥 High Volume',
  GOOD_LIQUIDITY = '💧 Good Liquidity',
  NEW_LISTING = '🆕 New Listing',
  WHALE_ACCUMULATION = '🐋 Whale Accumulation',
  SOCIAL_TRENDING = '📈 Social Trending',
  SELL_PRESSURE = '🔴 Sell Pressure',
  BUY_PRESSURE = '🟢 Buy Pressure',
  HONEYPOT_WARNING = '⚠️ Honeypot Risk',
  RUG_PULL_RISK = '🚨 Rug Pull Risk'
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/degenx/meme-scanner/trending` | Get trending tokens |
| POST | `/api/degenx/meme-scanner/scan` | Scan specific token |
| POST | `/api/degenx/meme-scanner/analyze` | Full token analysis |
| POST | `/api/degenx/meme-scanner/honeypot` | Honeypot check |
| POST | `/api/degenx/meme-scanner/alerts` | Set price alert |

---

### 2. Sniper Bot

**Purpose:** Automated token purchase at launch with configurable parameters for gas, slippage, and position sizing.

#### Service: `sniper-bot.service.ts`

```typescript
interface SniperBotService {
  // Configuration
  createConfig(params: SniperConfig): Promise<SniperSession>
  updateConfig(sessionId: string, params: Partial<SniperConfig>): Promise<SniperSession>
  
  // Execution
  startSession(sessionId: string): Promise<void>
  stopSession(sessionId: string): Promise<void>
  
  // Monitoring
  getSessionStatus(sessionId: string): SniperSessionStatus
  getExecutionHistory(sessionId: string): SniperExecution[]
}
```

#### Sniper Configuration

```typescript
interface SniperConfig {
  // Target
  tokenAddress: string
  chainId: number
  
  // Position
  buyAmount: string              // Amount in native token (ETH/BNB)
  maxBuyTax: number              // Max acceptable buy tax %
  maxSellTax: number             // Max acceptable sell tax %
  
  // Execution
  gasMultiplier: number          // Gas price multiplier (1.0 - 5.0)
  maxGasPrice: string            // Max gas price in gwei
  slippageTolerance: number      // Slippage % (1-50)
  
  // Safety
  antiRugEnabled: boolean        // Enable anti-rug checks
  minLiquidity: string           // Minimum liquidity required
  maxWalletPercent: number       // Max % of supply to buy
  
  // Timing
  launchBlock?: number           // Target launch block
  delayBlocks: number            // Blocks to wait after launch
}
```

#### Execution Modes

| Mode | Description | Speed | Risk |
|------|-------------|-------|------|
| **Instant** | First block after liquidity | Fastest | Highest |
| **Safe** | Wait for initial dump | Medium | Medium |
| **Delayed** | Wait N blocks | Slowest | Lowest |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/degenx/sniper/config` | Create sniper config |
| PUT | `/api/degenx/sniper/config/:id` | Update config |
| POST | `/api/degenx/sniper/start/:id` | Start sniper session |
| POST | `/api/degenx/sniper/stop/:id` | Stop session |
| GET | `/api/degenx/sniper/status/:id` | Get session status |
| GET | `/api/degenx/sniper/history/:id` | Execution history |

---

### 3. Smart Stop-Loss

**Purpose:** ML-powered dump detection with automatic sell execution to protect profits.

#### Service: `smart-stop-loss.service.ts`

```typescript
interface SmartStopLossService {
  // Rule Management
  createRule(userId: string, params: StopLossParams): Promise<StopLossRule>
  updateRule(ruleId: string, params: Partial<StopLossParams>): Promise<StopLossRule>
  deleteRule(ruleId: string): Promise<void>
  getUserRules(userId: string): StopLossRule[]
  
  // Analysis
  analyzeAnyToken(address: string, chainId: number): Promise<DumpAnalysis>
  getDumpScore(ruleId: string): number
  
  // Statistics
  getUserStats(userId: string): StopLossStats
}
```

#### Stop-Loss Modes

```typescript
type StopLossMode = 'conservative' | 'balanced' | 'aggressive'

const MODE_CONFIG = {
  conservative: {
    baseThreshold: 10,      // 10% drop triggers
    dumpScoreWeight: 0.3,   // Low weight on AI signals
    confirmationBlocks: 5   // Wait for confirmation
  },
  balanced: {
    baseThreshold: 15,
    dumpScoreWeight: 0.5,
    confirmationBlocks: 3
  },
  aggressive: {
    baseThreshold: 20,
    dumpScoreWeight: 0.7,
    confirmationBlocks: 1
  }
}
```

#### Dump Detection Signals

```typescript
interface DumpSignals {
  volumeAnomaly: number      // Unusual sell volume (0-100)
  sellPressure: number       // Buy/sell ratio indicator (0-100)
  liquidityRisk: number      // Liquidity removal risk (0-100)
  priceAction: number        // Rapid price decline (0-100)
  whaleActivity: number      // Large holder movements (0-100)
}

interface DumpAnalysis {
  dumpScore: number          // Overall score (0-100)
  signals: DumpSignals
  recommendation: 'hold' | 'watch' | 'sell_partial' | 'sell_all'
  confidence: number         // 0-100%
  alerts: string[]
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/degenx/stop-loss/rules` | Create stop-loss rule |
| GET | `/api/degenx/stop-loss/rules` | Get user's rules |
| PUT | `/api/degenx/stop-loss/rules/:id` | Update rule |
| DELETE | `/api/degenx/stop-loss/rules/:id` | Delete rule |
| POST | `/api/degenx/stop-loss/analyze` | Analyze token for dump |
| GET | `/api/degenx/stop-loss/stats` | User statistics |

---

### 4. Gains Lock

**Purpose:** Automated profit-taking at predefined price targets with optional trailing stops.

#### Service: `gains-lock.service.ts`

```typescript
interface GainsLockService {
  // Rule Management
  createRule(userId: string, params: GainsLockParams): Promise<GainsLockRule>
  updateRule(ruleId: string, params: Partial<GainsLockParams>): Promise<GainsLockRule>
  deleteRule(ruleId: string): Promise<void>
  getUserRules(userId: string): GainsLockRule[]
  
  // Price Monitoring
  checkTargets(ruleId: string): Promise<TargetCheckResult>
  
  // Statistics
  getUserStats(userId: string): GainsLockStats
}
```

#### Target Configuration

```typescript
interface GainTarget {
  id: string
  percent: number           // Price increase % to trigger
  sellPercent: number       // % of position to sell
  triggered: boolean
  triggeredAt?: Date
  executionPrice?: number
  executionTxHash?: string
}

// Example: 3-tier profit taking
const EXAMPLE_TARGETS: GainTarget[] = [
  { percent: 50, sellPercent: 25 },    // At 50% gain, sell 25%
  { percent: 100, sellPercent: 25 },   // At 100% gain, sell 25%
  { percent: 200, sellPercent: 50 }    // At 200% gain, sell remaining
]
```

#### Trailing Stop Feature

```typescript
interface TrailingConfig {
  enabled: boolean
  trailingPercent: number    // Distance from peak (e.g., 10%)
  activationPercent: number  // Min gain before trailing activates
}

// Example: Trailing stop at 10% below peak, activates at 50% gain
// If price goes: $1 → $2 (100% gain) → $1.80 (-10% from peak) → SELL
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/degenx/gains-lock/rules` | Create gains lock rule |
| GET | `/api/degenx/gains-lock/rules` | Get user's rules |
| PUT | `/api/degenx/gains-lock/rules/:id` | Update rule |
| DELETE | `/api/degenx/gains-lock/rules/:id` | Delete rule |
| GET | `/api/degenx/gains-lock/stats` | User statistics |

---

### 5. Recovery Fund

**Purpose:** Community insurance pool for rug pull protection with tiered coverage.

#### Service: `recovery-fund.service.ts`

```typescript
interface RecoveryFundService {
  // Membership
  joinFund(userId: string, tier: CoverageTier): Promise<FundMember>
  upgradeTier(userId: string, newTier: CoverageTier): Promise<FundMember>
  getMemberStatus(userId: string): FundMember | null
  
  // Claims
  submitClaim(params: ClaimParams): Promise<Claim>
  getClaimStatus(claimId: string): Claim
  getUserClaims(userId: string): Claim[]
  
  // Fund Info
  getFundStats(): FundStats
  getCoverageInfo(): CoverageTier[]
}
```

#### Coverage Tiers

```typescript
interface CoverageTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  coverage: number       // Max coverage in USD
  monthlyFee: number     // Monthly fee in USD
  waitingPeriod: number  // Days before coverage active
  claimLimit: number     // Claims per year
}

const COVERAGE_TIERS: CoverageTier[] = [
  { tier: 'bronze', coverage: 1000, monthlyFee: 5, waitingPeriod: 7, claimLimit: 2 },
  { tier: 'silver', coverage: 5000, monthlyFee: 15, waitingPeriod: 5, claimLimit: 3 },
  { tier: 'gold', coverage: 10000, monthlyFee: 35, waitingPeriod: 3, claimLimit: 5 },
  { tier: 'platinum', coverage: 25000, monthlyFee: 75, waitingPeriod: 1, claimLimit: 10 }
]
```

#### Claim Verification Process

```typescript
interface ClaimVerification {
  // Automated Checks
  honeypotVerified: boolean      // Honeypot.is check
  rugPullConfirmed: boolean      // GoPlusLabs verification
  liquidityRemoved: boolean      // On-chain liquidity check
  contractVerified: boolean      // Contract analysis
  
  // Manual Review (if needed)
  manualReviewRequired: boolean
  reviewerNotes?: string
  
  // Result
  approved: boolean
  payoutAmount: string
  rejectionReason?: string
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/degenx/recovery-fund/join` | Join the fund |
| PUT | `/api/degenx/recovery-fund/upgrade` | Upgrade tier |
| GET | `/api/degenx/recovery-fund/status` | Member status |
| POST | `/api/degenx/recovery-fund/claim` | Submit claim |
| GET | `/api/degenx/recovery-fund/claims` | User's claims |
| GET | `/api/degenx/recovery-fund/stats` | Fund statistics |

---

### 6. Degen Score

**Purpose:** Gamified trading performance tracking with badges, leaderboards, and statistics.

#### Service: `degen-score.service.ts`

```typescript
interface DegenScoreService {
  // Score Management
  getScore(userId: string): DegenScore | null
  calculateScore(userId: string): DegenScore
  
  // Trading
  recordTrade(userId: string, trade: TradeRecord): Trade
  getTradeHistory(userId: string, limit?: number): Trade[]
  
  // Badges
  checkBadges(userId: string): Badge[]
  getAvailableBadges(): Badge[]
  
  // Leaderboard
  getLeaderboard(timeframe?: string, limit?: number): LeaderboardEntry[]
}
```

#### Score Calculation

```typescript
interface ScoreBreakdown {
  winRateScore: number        // Based on win/loss ratio (0-100)
  pnlScore: number            // Based on total PnL (0-100)
  volumeScore: number         // Based on trading volume (0-100)
  riskScore: number           // Risk management score (0-100)
  consistencyScore: number    // Trading consistency (0-100)
  achievementScore: number    // Badges earned (0-100)
}

// Weights for final score
const SCORE_WEIGHTS = {
  winRate: 0.25,
  pnl: 0.25,
  volume: 0.15,
  risk: 0.15,
  consistency: 0.10,
  achievements: 0.10
}
```

#### Degen Levels

| Level | Score Range | Title |
|-------|-------------|-------|
| 1 | 0-20 | Paper Hands |
| 2 | 21-40 | Normie |
| 3 | 41-60 | Degen Apprentice |
| 4 | 61-80 | Degen Chad |
| 5 | 81-90 | Galaxy Brain |
| 6 | 91-100 | Legendary Degen |

#### Available Badges

```typescript
const BADGES: Badge[] = [
  // Trading Milestones
  { id: 'first_trade', name: 'First Blood', icon: '🩸', rarity: 'common' },
  { id: 'ten_trades', name: 'Getting Started', icon: '🎯', rarity: 'common' },
  { id: 'hundred_trades', name: 'Veteran', icon: '⭐', rarity: 'rare' },
  { id: 'thousand_trades', name: 'Trading Machine', icon: '🤖', rarity: 'legendary' },
  
  // Profit Milestones
  { id: 'first_profit', name: 'Winner', icon: '🏆', rarity: 'common' },
  { id: 'double_up', name: '2x Club', icon: '✌️', rarity: 'rare' },
  { id: 'ten_x', name: '10x Legend', icon: '🔟', rarity: 'epic' },
  { id: 'hundred_x', name: 'Hundredaire', icon: '💯', rarity: 'legendary' },
  
  // Streaks
  { id: 'three_streak', name: 'Hot Hands', icon: '🔥', rarity: 'common' },
  { id: 'five_streak', name: 'On Fire', icon: '🌟', rarity: 'rare' },
  { id: 'ten_streak', name: 'Unstoppable', icon: '💎', rarity: 'epic' },
  
  // Special
  { id: 'diamond_hands', name: 'Diamond Hands', icon: '💎', rarity: 'epic' },
  { id: 'rug_survivor', name: 'Rug Survivor', icon: '🛡️', rarity: 'rare' },
  { id: 'whale_spotter', name: 'Whale Spotter', icon: '🐋', rarity: 'rare' }
]
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/degenx/score` | Get user's degen score |
| GET | `/api/degenx/score/history` | Score history |
| GET | `/api/degenx/score/badges` | User's badges |
| GET | `/api/degenx/score/leaderboard` | Global leaderboard |
| POST | `/api/degenx/score/record-trade` | Record a trade |

---

### 7. Whale Tracker

**Purpose:** Monitor large wallet movements and generate copy-trading signals.

#### Service: `whale-tracker.service.ts`

```typescript
interface WhaleTrackerService {
  // Whale Monitoring
  trackWallet(address: string, chainId: number): Promise<Whale>
  getTrackedWhales(): Whale[]
  
  // Alerts
  getAlerts(limit?: number): WhaleAlert[]
  
  // Copy Trading
  getCopySignals(options?: CopySignalOptions): CopyTradingSignal[]
  
  // Analysis
  getWhaleHoldings(address: string): WhaleHolding[]
}
```

#### Whale Classification

```typescript
interface Whale {
  address: string
  label?: string                  // Known identity
  classification: WhaleType
  totalValue: string              // Portfolio value in USD
  winRate: number                 // Historical win rate
  avgReturn: number               // Average trade return
  trackedSince: Date
}

enum WhaleType {
  SMART_MONEY = 'smart_money',    // Consistently profitable
  INSIDER = 'insider',            // Early access patterns
  MARKET_MAKER = 'market_maker',  // Provides liquidity
  WHALE = 'whale',                // Large holder
  INFLUENCER = 'influencer'       // Known figure
}
```

#### Copy Trading Signals

```typescript
interface CopyTradingSignal {
  id: string
  whale: {
    address: string
    label?: string
    winRate: number
  }
  action: 'buy' | 'sell'
  token: {
    address: string
    symbol: string
    name: string
  }
  amount: string
  confidence: number             // 0-100
  suggestedAction: string
  timestamp: Date
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whales/tracked` | List tracked whales |
| POST | `/api/whales/track` | Start tracking whale |
| GET | `/api/whales/alerts` | Recent whale alerts |
| GET | `/api/whales/signals` | Copy trading signals |
| GET | `/api/whales/:address/holdings` | Whale's holdings |

---

### 8. Airdrop Hunter

**Purpose:** Track and qualify for upcoming airdrops with automated farming suggestions.

#### Service: `airdrop-hunter.service.ts`

```typescript
interface AirdropHunterService {
  // Airdrop Discovery
  getActiveAirdrops(): Promise<Airdrop[]>
  getUpcomingAirdrops(): Promise<Airdrop[]>
  
  // Eligibility
  checkEligibility(userId: string, airdropId: string): Promise<EligibilityCheck>
  
  // Farming
  getFarmingOpportunities(): Promise<FarmingOpportunity[]>
  
  // Claims
  getClaimHistory(userId: string): ClaimRecord[]
}
```

#### Airdrop Types

```typescript
interface Airdrop {
  id: string
  name: string
  protocol: string
  chain: string
  
  // Value
  estimatedValue: string         // Estimated USD value
  totalAllocation: string        // Total tokens allocated
  
  // Timeline
  snapshotDate?: Date
  claimStart?: Date
  claimEnd?: Date
  
  // Requirements
  requirements: AirdropRequirement[]
  
  // Status
  status: 'upcoming' | 'active' | 'ended'
  confidence: number             // How likely (0-100)
}

interface AirdropRequirement {
  type: 'transaction' | 'volume' | 'time' | 'nft' | 'token_hold'
  description: string
  threshold?: string
  completed?: boolean
}
```

#### Farming Opportunities

```typescript
interface FarmingOpportunity {
  protocol: string
  chain: string
  action: string                 // What to do
  estimatedApr: number           // If yield farming
  airdropPotential: number       // 0-100 likelihood
  riskLevel: 'low' | 'medium' | 'high'
  gasEstimate: string
  instructions: string[]
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/airdrops/active` | Active airdrops |
| GET | `/api/airdrops/upcoming` | Upcoming airdrops |
| GET | `/api/airdrops/:id/eligibility` | Check eligibility |
| GET | `/api/airdrops/farming` | Farming opportunities |
| GET | `/api/airdrops/claims` | Claim history |

---

## API Reference

### Authentication

All protected endpoints require a Bearer token:

```http
Authorization: Bearer <session_token>
```

### Standard Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-03T00:00:00.000Z"
}

// Error
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Rate Limits

| Tier | Requests/min | Burst |
|------|--------------|-------|
| Free | 30 | 5 |
| Basic | 60 | 10 |
| Pro | 120 | 20 |
| Enterprise | Unlimited | 50 |

### Test Endpoints (Development)

All test endpoints are available at `/api/test/*` without authentication:

```
/api/test/db/status
/api/test/db/create-test-user
/api/test/status/all

/api/test/regen/wallet-guard/scan
/api/test/regen/guardians/add
/api/test/regen/guardians/:userId
/api/test/regen/mev-guard/analyze
/api/test/regen/inheritance/create

/api/test/degen/meme-scanner/trending
/api/test/degen/analyze-token
/api/test/degen/whale-tracker/activity
/api/test/degen/gains-lock/create
/api/test/degen/stop-loss/create
/api/test/degen/recovery-fund/info
/api/test/degen/score/record-trade
/api/test/degen/score/:userId
```

---

## External Integrations

### Price & Market Data

| Provider | Purpose | Rate Limit |
|----------|---------|------------|
| DEXScreener | Token prices, pairs, trending | 300/min |
| CoinGecko | Market data, historical | 50/min |
| DefiLlama | TVL, protocol data | 100/min |

### Security Analysis

| Provider | Purpose | Rate Limit |
|----------|---------|------------|
| Honeypot.is | Honeypot detection | 100/min |
| GoPlusLabs | Contract security audit | 100/min |
| GoPlus Token Security | Token analysis | 100/min |

### Blockchain Data

| Provider | Purpose | Chains |
|----------|---------|--------|
| Etherscan | Ethereum data | ETH |
| BscScan | BSC data | BSC |
| Moralis | Multi-chain data | All |
| Alchemy | Node access | ETH, Polygon, etc. |

### MEV Protection

| Provider | Purpose |
|----------|---------|
| Flashbots | Private transactions |
| MEV Blocker | MEV protection + rebates |
| Bloxroute | Private mempool |

---

## Database Schema Summary

### Core Tables

```
User
├── Session
├── Wallet
├── Guardian
├── Beneficiary
├── Transaction
├── PriceAlert
└── AddressBookEntry

YieldVault
├── YieldVaultAsset
└── YieldVaultHistory

RecoveryRequest
└── RecoveryApproval

WalletConnectSession
SessionKey
```

### Indexes

- `User.email` - Unique
- `User.oauthId` - Unique
- `Wallet.address` - Unique
- `Session.token` - Unique
- `Guardian.inviteToken` - Unique

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-03 | Full ReGen/DeGen feature set, SQLite support |
| 1.5.0 | 2025-11-15 | Added MEV Guard, Whale Tracker |
| 1.0.0 | 2025-10-01 | Initial release |

---

---

## NEW ReGen Features (v2.5.0)

### 5. Panic Mode

**Purpose:** Emergency asset protection with duress detection and automated evacuation.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Emergency Evacuation** | One-tap asset transfer to pre-verified safe wallets |
| **Duress PIN** | Enter special PIN to show decoy wallet when under threat |
| **Dead Man's Switch** | Auto-transfer if user inactive for N days |
| **Geo-Lock** | Block transactions from certain countries/VPNs |
| **Time-Lock** | Only allow transactions during specified hours/days |
| **Transaction Limits** | Daily/single transaction caps |
| **Panic Beacon** | Alert guardians in emergency |

#### Service: `panic-mode.service.ts`

```typescript
interface PanicModeService {
  // Safe Wallet Management
  addSafeWallet(userId: string, params: SafeWalletParams): Promise<SafeWallet>
  verifySafeWallet(walletId: string, code: string): Promise<boolean>
  
  // Emergency Actions
  triggerEvacuation(userId: string, safeWalletId: string): Promise<EvacuationResult>
  checkDuressPin(userId: string, pin: string): Promise<DuressResult>
  
  // Restrictions
  checkGeoLock(userId: string, location: Location): Promise<CheckResult>
  checkTimeLock(userId: string): Promise<CheckResult>
  checkTransactionLimit(userId: string, amount: string): Promise<CheckResult>
  
  // Dead Man's Switch
  checkIn(userId: string): Promise<{ nextCheckDue: Date }>
  
  // Beacon
  sendPanicBeacon(userId: string, message: string): Promise<void>
}
```

---

### 6. Smart Vault

**Purpose:** Intelligent automated portfolio management and wealth preservation.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Auto-Diversify** | Automatic portfolio rebalancing to target allocations |
| **Yield Optimizer** | Find and move to best DeFi yields automatically |
| **Tax Harvester** | Automated tax-loss harvesting with wash sale avoidance |
| **Smart DCA** | AI-enhanced dollar cost averaging with timing optimization |
| **Stablecoin Shield** | Auto-convert to stables during market crashes |

#### Service: `smart-vault.service.ts`

```typescript
interface SmartVaultService {
  // Strategy Management
  createStrategy(userId: string, type: StrategyType, config: Config): Promise<Strategy>
  
  // Auto-Diversify
  checkRebalanceNeeded(userId: string, strategyId: string): Promise<RebalanceCheck>
  executeRebalance(userId: string, strategyId: string): Promise<RebalanceResult>
  
  // Yield Optimizer
  findBestYields(config: YieldConfig): Promise<YieldOpportunity[]>
  optimizeYield(userId: string, strategyId: string): Promise<OptimizeResult>
  
  // Tax Harvester
  findHarvestOpportunities(userId: string, strategyId: string): Promise<HarvestOpportunity[]>
  executeHarvest(userId: string, strategyId: string, asset: string): Promise<HarvestResult>
  getTaxSummary(userId: string, year: number): TaxSummary
  
  // Smart DCA
  executeDcaPurchase(userId: string, strategyId: string): Promise<DcaPurchase>
  getDcaStats(userId: string, strategyId: string): DcaStats
  
  // Stablecoin Shield
  checkShieldTrigger(userId: string, strategyId: string): Promise<ShieldCheck>
  activateShield(userId: string, strategyId: string): Promise<ShieldEvent>
}
```

#### DCA AI Enhancement

```typescript
interface DcaConfig {
  aiTiming: boolean           // Use AI to time purchases
  fearGreedWeight: number     // Weight of Fear & Greed index
  technicalWeight: number     // Weight of technical indicators
  maxDeviationPercent: number // Max deviation from schedule
}

// AI considers:
// - Fear & Greed Index (buy more when fearful)
// - Technical indicators (RSI, moving averages)
// - Volume patterns
// - Whale movements
```

---

### 7. Privacy Shield

**Purpose:** Advanced privacy protection and transaction obfuscation.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Stealth Addresses** | Generate one-time addresses for receiving funds |
| **Transaction Obfuscation** | Break on-chain links with multi-step transfers |
| **Activity Masking** | Random delays and split transactions |
| **Chain Hopping** | Cross-chain transfers to increase privacy |
| **Privacy Score** | Analyze your on-chain privacy level |

#### Service: `privacy-shield.service.ts`

```typescript
interface PrivacyShieldService {
  // Stealth Addresses
  generateStealthAddress(userId: string, label?: string): Promise<StealthAddress>
  getNextStealthAddress(userId: string): StealthAddress | null
  
  // Obfuscation
  createObfuscationPlan(userId: string, amount: string, recipient: string): Promise<ObfuscationPlan>
  executeObfuscationPlan(planId: string): Promise<ObfuscationPlan>
  
  // Privacy Analysis
  analyzePrivacy(userId: string, addresses: string[]): Promise<PrivacyScore>
  generateActivityReport(userId: string, period: string): Promise<ActivityReport>
  
  // Address Rotation
  rotateMainAddress(userId: string): Promise<RotationResult>
}
```

#### Privacy Score Breakdown

```typescript
interface PrivacyScore {
  overall: number              // 0-100
  breakdown: {
    addressReuse: number       // Lower is better
    transactionPattern: number // Regularity detection
    chainDiversity: number     // Multi-chain usage
    addressDiversity: number   // Number of addresses
    timingRandomness: number   // Transaction timing
    amountPatterns: number     // Round number detection
  }
  recommendations: string[]
  riskFactors: string[]
}
```

---

### 8. Social Vault

**Purpose:** Shared wallets for families, couples, and groups with spending controls.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Family Vault** | Shared wallet with parental controls |
| **Group Vault** | Shared investments with friends/team |
| **Allowance System** | Automated allowance for children/dependents |
| **Approval Workflows** | Multi-signature family decisions |
| **Crypto Gifts** | Schedule gifts with messages and NFT cards |
| **Savings Goals** | Collaborative saving with milestones |

#### Service: `social-vault.service.ts`

```typescript
interface SocialVaultService {
  // Vault Management
  createVault(creatorId: string, params: VaultParams): Promise<SocialVault>
  
  // Member Management
  inviteMember(vaultId: string, inviterId: string, member: MemberParams): Promise<VaultMember>
  setAllowance(vaultId: string, memberId: string, allowance: AllowanceConfig): Promise<VaultMember>
  
  // Transactions & Approvals
  initiateTransaction(vaultId: string, initiatorId: string, params: TxParams): Promise<VaultTransaction>
  approveTransaction(txId: string, approverId: string, approved: boolean): Promise<VaultTransaction>
  
  // Savings Goals
  createSavingsGoal(vaultId: string, creatorId: string, params: GoalParams): Promise<SavingsGoal>
  contributeToGoal(vaultId: string, goalId: string, memberId: string, amount: string): Promise<SavingsGoal>
  
  // Gifts
  createGift(fromUserId: string, params: GiftParams): Promise<CryptoGift>
  claimGift(claimCode: string, claimerAddress: string): Promise<CryptoGift>
}
```

#### Member Roles & Permissions

| Role | Deposit | Withdraw | Approve | Invite | Settings |
|------|---------|----------|---------|--------|----------|
| **Owner** | ✅ | ✅ Unlimited | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ High Limit | ✅ | ✅ | ❌ |
| **Member** | ✅ | ✅ With Approval | ❌ | ❌ | ❌ |
| **Child** | ✅ | ❌ Allowance Only | ❌ | ❌ | ❌ |

---

### 9. AI Security

**Purpose:** Intelligent security monitoring with ML-powered anomaly detection.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Security Health Score** | Overall wallet security grade (A+ to F) |
| **Anomaly Detection** | AI detects unusual activity patterns |
| **Personalized Recommendations** | Security suggestions based on usage |
| **Risk Assessment** | Portfolio and behavior risk analysis |
| **Threat Intelligence** | Proactive warnings about new threats |
| **Auto-Defense** | Automatic response to detected threats |

#### Service: `ai-security.service.ts`

```typescript
interface AISecurityService {
  // Health Score
  calculateHealthScore(userId: string): Promise<SecurityHealthScore>
  
  // Recommendations
  getRecommendations(userId: string): SecurityRecommendation[]
  
  // Anomaly Detection
  createAnomaly(userId: string, params: AnomalyParams): Promise<AnomalyAlert>
  getAnomalies(userId: string, status?: string): AnomalyAlert[]
  resolveAnomaly(userId: string, anomalyId: string, resolution: string): Promise<AnomalyAlert>
  
  // Risk Assessment
  assessRisk(userId: string): Promise<RiskAssessment>
  
  // Threat Intelligence
  getActiveThreatIntel(): ThreatIntelligence[]
  
  // Auto-Defense
  configureAutoDefense(userId: string, config: AutoDefenseConfig): AutoDefenseConfig
  
  // Behavior Profiling
  updateBehaviorProfile(userId: string): Promise<UserBehaviorProfile>
}
```

#### Anomaly Types Detected

```typescript
type AnomalyType = 
  | 'unusual_time'           // Activity at unusual hours
  | 'unusual_location'       // New location/IP detected
  | 'unusual_amount'         // Transaction size anomaly
  | 'unusual_frequency'      // Too many transactions
  | 'unusual_recipient'      // New/suspicious recipient
  | 'unusual_contract'       // Unknown contract interaction
  | 'unusual_gas'            // Abnormal gas usage
  | 'unusual_approval'       // Suspicious approval request
  | 'rapid_drain'            // Assets leaving quickly
  | 'failed_attempts'        // Multiple failed transactions
  | 'phishing_interaction'   // Interaction with phishing address
```

#### Auto-Defense Actions

| Trigger | Possible Actions |
|---------|-----------------|
| Any Anomaly | Alert, Require 2FA |
| High Severity | Block Transaction, Pause Wallet |
| Critical | Emergency Evacuation |

---

## Complete ReGen Feature Summary

| # | Feature | Primary Capability |
|---|---------|-------------------|
| 1 | Wallet Guard | Real-time threat detection |
| 2 | MEV Guard | Transaction MEV protection |
| 3 | Guardian System | Social recovery |
| 4 | Inheritance Vault | Crypto estate planning |
| 5 | **Panic Mode** | Emergency evacuation & duress protection |
| 6 | **Smart Vault** | Automated portfolio management |
| 7 | **Privacy Shield** | Transaction privacy & stealth addresses |
| 8 | **Social Vault** | Family/group wallets & allowances |
| 9 | **AI Security** | ML-powered security monitoring |

---

*Documentation generated for GuardiaVault v2.5.0*
