// ============================================================================
// APEX SNIPER - Telegram Notification Service
// Real-time alerts and bot commands via Telegram
// ============================================================================

import { Telegraf, Context, Markup } from 'telegraf';
import EventEmitter from 'eventemitter3';
import {
  SnipeOrder,
  Position,
  SniperEvent,
  MemeHunterAlert,
  WhaleTransaction,
  RiskLevel,
  OrderStatus
} from '../types';
import { config } from '../config';
import { logger, formatEther, checksumAddress } from '../utils';
import { sniperCore } from '../core/SniperCore';
import { executionEngine } from './ExecutionEngine';
import { tokenAnalyzer } from './TokenAnalyzer';
import { portfolioAnalytics, RiskAlert } from './PortfolioAnalytics';
import { marketRegimeDetector, MarketOpportunity, RegimeAnalysis } from './MarketRegimeDetector';
import { memeHunter } from './MemeHunter';

// ============================================================================
// TYPES
// ============================================================================

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatIds: string[];        // Authorized chat IDs
  adminIds: string[];       // Admin user IDs for commands
  
  // Notification settings
  notifyOrders: boolean;
  notifyPositions: boolean;
  notifyWhales: boolean;
  notifyMemeAlerts: boolean;
  notifyRiskAlerts: boolean;
  notifyRegimeChanges: boolean;
  
  // Alert thresholds
  minPnLForNotification: number;  // Minimum PnL % to notify
  minWhaleValueUSD: number;       // Minimum whale tx value
  minMemeScore: number;           // Minimum meme score
}

// ============================================================================
// EVENTS
// ============================================================================

export interface TelegramServiceEvents {
  'message:sent': (chatId: string, message: string) => void;
  'command:received': (command: string, args: string[], userId: string) => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: TelegramConfig = {
  enabled: false,
  botToken: '',
  chatIds: [],
  adminIds: [],
  notifyOrders: true,
  notifyPositions: true,
  notifyWhales: true,
  notifyMemeAlerts: true,
  notifyRiskAlerts: true,
  notifyRegimeChanges: true,
  minPnLForNotification: 10,
  minWhaleValueUSD: 10000,
  minMemeScore: 80
};

// ============================================================================
// TELEGRAM NOTIFICATION SERVICE
// ============================================================================

export class TelegramNotificationService extends EventEmitter<TelegramServiceEvents> {
  private bot: Telegraf | null = null;
  private config: TelegramConfig;
  private isRunning: boolean = false;
  private messageQueue: Array<{ chatId: string; message: string; options?: any }> = [];
  private lastMessageTime: Map<string, number> = new Map();

  constructor(customConfig?: Partial<TelegramConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    
    // Load from environment
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.config.botToken = process.env.TELEGRAM_BOT_TOKEN;
      this.config.enabled = true;
    }
    if (process.env.TELEGRAM_CHAT_ID) {
      this.config.chatIds = process.env.TELEGRAM_CHAT_ID.split(',');
    }
    if (process.env.TELEGRAM_ADMIN_ID) {
      this.config.adminIds = process.env.TELEGRAM_ADMIN_ID.split(',');
    }
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (!this.config.enabled || !this.config.botToken) {
      logger.info('[Telegram] Telegram notifications disabled (no token configured)');
      return;
    }

    logger.info('[Telegram] Starting Telegram notification service...');

    try {
      this.bot = new Telegraf(this.config.botToken);
      
      // Set up commands
      this.setupCommands();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start the bot
      await this.bot.launch();
      
      this.isRunning = true;
      
      // Send startup message
      await this.broadcastMessage('🚀 *APEX SNIPER Started*\n\nBot is now active and monitoring the market.');
      
      logger.info('[Telegram] Telegram notification service started');
    } catch (error) {
      logger.error('[Telegram] Failed to start Telegram bot:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.bot) {
      await this.broadcastMessage('🛑 *APEX SNIPER Stopped*\n\nBot is shutting down.');
      this.bot.stop();
      this.bot = null;
    }
    this.isRunning = false;
    logger.info('[Telegram] Telegram notification service stopped');
  }

  // ==========================================================================
  // COMMAND SETUP
  // ==========================================================================

  private setupCommands(): void {
    if (!this.bot) return;

    // Start command
    this.bot.start((ctx) => {
      const welcomeMessage = `
🎯 *Welcome to APEX SNIPER Bot*

I'm your personal trading assistant for Ethereum token sniping.

*Available Commands:*
/status - Check system status
/positions - View open positions
/stats - Trading statistics
/analyze <token> - Analyze token safety
/regime - Current market regime
/alerts - Recent alerts

/settings - Notification settings
/help - Show this help

_Use /subscribe to receive real-time alerts_
      `;
      ctx.replyWithMarkdown(welcomeMessage);
    });

    // Status command
    this.bot.command('status', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const status = sniperCore.getStatus();
      const regime = marketRegimeDetector.getCurrentRegime();
      const metrics = portfolioAnalytics.getMetrics();
      
      const message = `
📊 *System Status*

🔄 Running: ${status.running ? '✅ Active' : '❌ Stopped'}
📡 Mempool: ${status.mempoolConnected ? '✅ Connected' : '❌ Disconnected'}
🎯 Auto-Snipe: ${status.autoSnipe ? '✅ Enabled' : '❌ Disabled'}

📈 *Market Regime:* ${this.formatRegime(regime)}

💼 *Portfolio:*
├ Open Positions: ${status.openPositions}
├ Pending Snipes: ${status.pendingSnipes}
└ Tracked Whales: ${status.trackedWallets}

${metrics ? `
📉 *Performance:*
├ Total PnL: ${metrics.totalPnL >= 0 ? '🟢' : '🔴'} $${metrics.totalPnL.toFixed(2)}
├ Win Rate: ${metrics.winRate.toFixed(1)}%
└ Drawdown: ${metrics.currentDrawdown.toFixed(1)}%
` : ''}
      `;
      
      ctx.replyWithMarkdown(message);
    });

    // Positions command
    this.bot.command('positions', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const positions = executionEngine.getOpenPositions();
      
      if (positions.length === 0) {
        ctx.reply('📭 No open positions');
        return;
      }
      
      let message = '📊 *Open Positions*\n\n';
      
      for (const pos of positions.slice(0, 10)) {
        const pnlEmoji = pos.unrealizedPnLPercentage >= 0 ? '🟢' : '🔴';
        message += `*${pos.tokenInfo.symbol}*\n`;
        message += `├ Entry: ${formatEther(pos.entryAmountIn)} ETH\n`;
        message += `├ Current: $${pos.currentValueUSD.toFixed(2)}\n`;
        message += `└ PnL: ${pnlEmoji} ${pos.unrealizedPnLPercentage.toFixed(1)}%\n\n`;
      }
      
      if (positions.length > 10) {
        message += `_...and ${positions.length - 10} more_`;
      }
      
      ctx.replyWithMarkdown(message);
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const stats = sniperCore.getStats();
      const metrics = portfolioAnalytics.getMetrics();
      
      const message = `
📊 *Trading Statistics*

🎯 *Trades:*
├ Total: ${stats.totalTrades}
├ Successful: ${stats.successfulTrades}
├ Failed: ${stats.failedTrades}
└ Win Rate: ${stats.winRate.toFixed(1)}%

💰 *Performance:*
├ Total PnL: ${stats.totalPnL >= 0 ? '🟢' : '🔴'} $${stats.totalPnL.toFixed(2)}
├ Realized: $${stats.realizedPnL.toFixed(2)}
├ Unrealized: $${stats.unrealizedPnL.toFixed(2)}
├ Best Trade: $${stats.bestTrade.toFixed(2)}
└ Worst Trade: $${stats.worstTrade.toFixed(2)}

⚡ *Speed:*
├ Avg Latency: ${stats.avgLatencyMs.toFixed(0)}ms
└ Fastest Snipe: ${stats.fastestSnipeMs === Infinity ? 'N/A' : stats.fastestSnipeMs.toFixed(0) + 'ms'}

${metrics ? `
📉 *Risk Metrics:*
├ Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
├ Max Drawdown: ${metrics.maxDrawdown.toFixed(1)}%
└ Volatility: ${metrics.volatility.toFixed(1)}%
` : ''}
      `;
      
      ctx.replyWithMarkdown(message);
    });

    // Analyze command
    this.bot.command('analyze', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        ctx.reply('Usage: /analyze <token_address>');
        return;
      }
      
      const tokenAddress = args[0];
      ctx.reply('🔍 Analyzing token...');
      
      try {
        const analysis = await tokenAnalyzer.analyzeToken(tokenAddress);
        const message = this.formatTokenAnalysis(tokenAddress, analysis);
        ctx.replyWithMarkdown(message);
      } catch (error) {
        ctx.reply(`❌ Failed to analyze token: ${(error as Error).message}`);
      }
    });

    // Regime command
    this.bot.command('regime', (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const analysis = marketRegimeDetector.getLastAnalysis();
      if (!analysis) {
        ctx.reply('📊 Market regime data not available yet');
        return;
      }
      
      const message = this.formatRegimeAnalysis(analysis);
      ctx.replyWithMarkdown(message);
    });

    // Alerts command
    this.bot.command('alerts', (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      
      const alerts = memeHunter.getActiveAlerts().slice(0, 5);
      
      if (alerts.length === 0) {
        ctx.reply('📭 No recent alerts');
        return;
      }
      
      let message = '🚨 *Recent Alerts*\n\n';
      
      for (const alert of alerts) {
        message += `${this.getTierEmoji(alert.tier)} *${alert.title}*\n`;
        message += `Score: ${alert.score}/100 | Confidence: ${(alert.confidence * 100).toFixed(0)}%\n`;
        message += `_${new Date(alert.createdAt).toLocaleTimeString()}_\n\n`;
      }
      
      ctx.replyWithMarkdown(message);
    });

    // Subscribe command
    this.bot.command('subscribe', (ctx) => {
      const chatId = ctx.chat.id.toString();
      
      if (!this.config.chatIds.includes(chatId)) {
        this.config.chatIds.push(chatId);
        ctx.reply('✅ You are now subscribed to alerts!');
        logger.info(`[Telegram] Chat ${chatId} subscribed to alerts`);
      } else {
        ctx.reply('You are already subscribed.');
      }
    });

    // Unsubscribe command
    this.bot.command('unsubscribe', (ctx) => {
      const chatId = ctx.chat.id.toString();
      const index = this.config.chatIds.indexOf(chatId);
      
      if (index > -1) {
        this.config.chatIds.splice(index, 1);
        ctx.reply('✅ You have been unsubscribed from alerts.');
        logger.info(`[Telegram] Chat ${chatId} unsubscribed from alerts`);
      } else {
        ctx.reply('You are not subscribed.');
      }
    });

    // Settings command
    this.bot.command('settings', (ctx) => {
      if (!this.isAdmin(ctx)) {
        ctx.reply('⛔ Admin access required');
        return;
      }
      
      const message = `
⚙️ *Notification Settings*

📋 Orders: ${this.config.notifyOrders ? '✅' : '❌'}
💼 Positions: ${this.config.notifyPositions ? '✅' : '❌'}
🐋 Whales: ${this.config.notifyWhales ? '✅' : '❌'}
🎯 Meme Alerts: ${this.config.notifyMemeAlerts ? '✅' : '❌'}
⚠️ Risk Alerts: ${this.config.notifyRiskAlerts ? '✅' : '❌'}
📊 Regime Changes: ${this.config.notifyRegimeChanges ? '✅' : '❌'}

_Use inline buttons to toggle settings_
      `;
      
      ctx.replyWithMarkdown(message, Markup.inlineKeyboard([
        [
          Markup.button.callback('Toggle Orders', 'toggle_orders'),
          Markup.button.callback('Toggle Positions', 'toggle_positions')
        ],
        [
          Markup.button.callback('Toggle Whales', 'toggle_whales'),
          Markup.button.callback('Toggle Meme', 'toggle_meme')
        ],
        [
          Markup.button.callback('Toggle Risk', 'toggle_risk'),
          Markup.button.callback('Toggle Regime', 'toggle_regime')
        ]
      ]));
    });

    // Help command
    this.bot.command('help', (ctx) => {
      ctx.replyWithMarkdown(`
📚 *APEX SNIPER Help*

*Monitoring Commands:*
/status - System status
/positions - Open positions
/stats - Trading statistics
/regime - Market regime analysis
/alerts - Recent alerts

*Analysis Commands:*
/analyze <token> - Token safety analysis

*Subscription:*
/subscribe - Enable alerts
/unsubscribe - Disable alerts

*Admin Commands:*
/settings - Notification settings

_Need more help? Check our documentation!_
      `);
    });

    // Handle callback queries for settings
    this.bot.action(/toggle_(.+)/, (ctx) => {
      if (!this.isAdmin(ctx)) {
        ctx.answerCbQuery('⛔ Admin access required');
        return;
      }
      
      const setting = ctx.match[1];
      
      switch (setting) {
        case 'orders':
          this.config.notifyOrders = !this.config.notifyOrders;
          ctx.answerCbQuery(`Orders: ${this.config.notifyOrders ? '✅' : '❌'}`);
          break;
        case 'positions':
          this.config.notifyPositions = !this.config.notifyPositions;
          ctx.answerCbQuery(`Positions: ${this.config.notifyPositions ? '✅' : '❌'}`);
          break;
        case 'whales':
          this.config.notifyWhales = !this.config.notifyWhales;
          ctx.answerCbQuery(`Whales: ${this.config.notifyWhales ? '✅' : '❌'}`);
          break;
        case 'meme':
          this.config.notifyMemeAlerts = !this.config.notifyMemeAlerts;
          ctx.answerCbQuery(`Meme Alerts: ${this.config.notifyMemeAlerts ? '✅' : '❌'}`);
          break;
        case 'risk':
          this.config.notifyRiskAlerts = !this.config.notifyRiskAlerts;
          ctx.answerCbQuery(`Risk Alerts: ${this.config.notifyRiskAlerts ? '✅' : '❌'}`);
          break;
        case 'regime':
          this.config.notifyRegimeChanges = !this.config.notifyRegimeChanges;
          ctx.answerCbQuery(`Regime Changes: ${this.config.notifyRegimeChanges ? '✅' : '❌'}`);
          break;
      }
    });
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  private setupEventListeners(): void {
    // Order events
    executionEngine.on('order:confirmed', (order) => {
      if (this.config.notifyOrders) {
        this.notifyOrderConfirmed(order);
      }
    });

    executionEngine.on('order:failed', (order, error) => {
      if (this.config.notifyOrders) {
        this.notifyOrderFailed(order, error);
      }
    });

    // Position events
    executionEngine.on('position:opened', (position) => {
      if (this.config.notifyPositions) {
        this.notifyPositionOpened(position);
      }
    });

    executionEngine.on('position:closed', (position) => {
      if (this.config.notifyPositions) {
        this.notifyPositionClosed(position);
      }
    });

    // Meme Hunter alerts
    memeHunter.on('alert:created', (alert) => {
      if (this.config.notifyMemeAlerts && alert.score >= this.config.minMemeScore) {
        this.notifyMemeAlert(alert);
      }
    });

    // Risk alerts
    portfolioAnalytics.on('risk:alert', (alert) => {
      if (this.config.notifyRiskAlerts) {
        this.notifyRiskAlert(alert);
      }
    });

    // Circuit breaker
    portfolioAnalytics.on('circuit:breaker', (reason) => {
      this.broadcastMessage(`🚨 *CIRCUIT BREAKER ACTIVATED*\n\nReason: ${reason}\n\n_Trading paused to protect capital_`, true);
    });

    // Regime changes
    marketRegimeDetector.on('regime:changed', (oldRegime, newRegime, analysis) => {
      if (this.config.notifyRegimeChanges) {
        this.notifyRegimeChange(oldRegime, newRegime, analysis);
      }
    });

    // Opportunities
    marketRegimeDetector.on('opportunity:detected', (opportunity) => {
      this.notifyOpportunity(opportunity);
    });
  }

  // ==========================================================================
  // NOTIFICATION METHODS
  // ==========================================================================

  private async notifyOrderConfirmed(order: SnipeOrder): Promise<void> {
    const message = `
✅ *Order Confirmed*

Token: \`${order.tokenOut}\`
Amount: ${formatEther(order.amountIn)} ETH
Type: ${order.type}

⛓ [View Transaction](https://etherscan.io/tx/${order.txHash})

⚡ Latency: ${order.latencyMs}ms
    `;
    
    await this.broadcastMessage(message);
  }

  private async notifyOrderFailed(order: SnipeOrder, error: string): Promise<void> {
    const message = `
❌ *Order Failed*

Token: \`${order.tokenOut}\`
Amount: ${formatEther(order.amountIn)} ETH
Error: ${error}

_Retry count: ${order.retryCount}_
    `;
    
    await this.broadcastMessage(message);
  }

  private async notifyPositionOpened(position: Position): Promise<void> {
    const message = `
📈 *Position Opened*

Token: *${position.tokenInfo.symbol}* (${position.tokenInfo.name})
Entry: ${formatEther(position.entryAmountIn)} ETH
Block: ${position.entryBlock}

⛓ [View Transaction](https://etherscan.io/tx/${position.entryTxHash})
    `;
    
    await this.broadcastMessage(message);
  }

  private async notifyPositionClosed(position: Position): Promise<void> {
    const pnlEmoji = position.realizedPnL >= 0 ? '🟢' : '🔴';
    
    const message = `
📉 *Position Closed*

Token: *${position.tokenInfo.symbol}*
Entry: ${formatEther(position.entryAmountIn)} ETH

${pnlEmoji} *PnL: $${position.realizedPnL.toFixed(2)}*

Duration: ${this.formatDuration(Date.now() - position.entryTimestamp)}
    `;
    
    await this.broadcastMessage(message);
  }

  private async notifyMemeAlert(alert: MemeHunterAlert): Promise<void> {
    const tierEmoji = this.getTierEmoji(alert.tier);
    
    const message = `
${tierEmoji} *MEME ALERT: ${alert.token.symbol}*

Score: *${alert.score}/100*
Confidence: ${(alert.confidence * 100).toFixed(0)}%

📊 *Top Signals:*
${alert.topSignals.slice(0, 3).map(s => `├ ${s}`).join('\n')}

🔗 [DexTools](${alert.token.dextoolsUrl})
🔗 [DexScreener](${alert.token.dexscreenerUrl})

_${alert.message}_
    `;
    
    await this.broadcastMessage(message, true);
  }

  private async notifyRiskAlert(alert: RiskAlert): Promise<void> {
    const severityEmoji = alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
    
    const message = `
${severityEmoji} *Risk Alert: ${alert.title}*

${alert.message}

_${new Date(alert.timestamp).toLocaleString()}_
    `;
    
    await this.broadcastMessage(message, alert.severity === 'CRITICAL');
  }

  private async notifyRegimeChange(
    oldRegime: string,
    newRegime: string,
    analysis: RegimeAnalysis
  ): Promise<void> {
    const message = `
📊 *Market Regime Change*

${this.formatRegime(oldRegime)} → ${this.formatRegime(newRegime)}

*Recommended Action:* ${analysis.recommendedAction.action.toUpperCase()}
*Position Size:* ${(analysis.recommendedAction.positionSizeMultiplier * 100).toFixed(0)}%
*Max Positions:* ${analysis.recommendedAction.maxPositions}

📝 *Notes:*
${analysis.recommendedAction.notes.slice(0, 3).map(n => `• ${n}`).join('\n')}
    `;
    
    await this.broadcastMessage(message);
  }

  private async notifyOpportunity(opportunity: MarketOpportunity): Promise<void> {
    const typeEmoji: Record<string, string> = {
      'dip_buy': '📉',
      'breakout': '🚀',
      'momentum': '📈',
      'reversal': '🔄'
    };
    
    const message = `
${typeEmoji[opportunity.type] || '💡'} *Market Opportunity*

Type: ${opportunity.type.replace('_', ' ').toUpperCase()}
Confidence: ${(opportunity.confidence * 100).toFixed(0)}%

${opportunity.message}

💡 ${opportunity.suggestedAction}
    `;
    
    await this.broadcastMessage(message);
  }

  // ==========================================================================
  // FORMATTING HELPERS
  // ==========================================================================

  private formatTokenAnalysis(address: string, analysis: any): string {
    const riskEmoji: Record<string, string> = {
      [RiskLevel.SAFE]: '🟢',
      [RiskLevel.LOW]: '🟡',
      [RiskLevel.MEDIUM]: '🟠',
      [RiskLevel.HIGH]: '🔴',
      [RiskLevel.CRITICAL]: '⛔',
      [RiskLevel.HONEYPOT]: '🍯'
    };
    
    return `
🔍 *Token Analysis*

Address: \`${address}\`
Risk: ${riskEmoji[analysis.riskLevel] || '❓'} ${analysis.riskLevel}
Score: ${analysis.score}/100

📊 *Taxes:*
├ Buy: ${analysis.honeypotTest.buyTax}%
└ Sell: ${analysis.honeypotTest.sellTax}%

🔒 *Contract:*
├ Verified: ${analysis.contractAnalysis.verified ? '✅' : '❌'}
├ Blacklist: ${analysis.contractAnalysis.hasBlacklist ? '⚠️' : '✅'}
├ Pausable: ${analysis.contractAnalysis.hasPauseFunction ? '⚠️' : '✅'}
└ Mint: ${analysis.contractAnalysis.hasMintFunction ? '⚠️' : '✅'}

💧 *Liquidity:*
├ Total: $${analysis.liquidityAnalysis.totalLiquidityUSD.toFixed(0)}
└ Locked: ${analysis.liquidityAnalysis.isLocked ? '✅' : '❌'}

${analysis.flags.length > 0 ? `
⚠️ *Flags:*
${analysis.flags.slice(0, 5).map((f: any) => `• ${f.message}`).join('\n')}
` : ''}
    `;
  }

  private formatRegimeAnalysis(analysis: RegimeAnalysis): string {
    return `
📊 *Market Regime Analysis*

🎯 *Regime:* ${this.formatRegime(analysis.currentRegime)}
📈 Confidence: ${(analysis.confidence * 100).toFixed(0)}%

*Indicators:*
├ Trend: ${analysis.trendDirection} (${analysis.trendStrength.toFixed(0)})
├ Volatility: ${analysis.volatility.toFixed(1)}%
├ Momentum: ${analysis.momentum.toFixed(1)}
├ RSI: ${analysis.rsi.toFixed(0)}
└ Fear/Greed: ${analysis.fearGreedIndex.toFixed(0)}/100

*Recommendation:*
├ Action: ${analysis.recommendedAction.action.toUpperCase()}
├ Position Size: ${(analysis.recommendedAction.positionSizeMultiplier * 100).toFixed(0)}%
└ Max Positions: ${analysis.recommendedAction.maxPositions}

📝 ${analysis.recommendedAction.notes[0] || 'Monitor market conditions'}
    `;
  }

  private formatRegime(regime: string): string {
    const regimeEmojis: Record<string, string> = {
      'TRENDING_UP': '📈 Trending Up',
      'TRENDING_DOWN': '📉 Trending Down',
      'RANGING': '↔️ Ranging',
      'VOLATILE': '⚡ Volatile',
      'ACCUMULATION': '🔄 Accumulation',
      'DISTRIBUTION': '📤 Distribution',
      'CAPITULATION': '💥 Capitulation',
      'EUPHORIA': '🎉 Euphoria'
    };
    return regimeEmojis[regime] || regime;
  }

  private getTierEmoji(tier: string): string {
    switch (tier) {
      case 'INSTANT': return '🔥';
      case 'FAST': return '⚡';
      case 'RESEARCH': return '📊';
      default: return '📋';
    }
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // ==========================================================================
  // MESSAGE SENDING
  // ==========================================================================

  private async broadcastMessage(message: string, urgent: boolean = false): Promise<void> {
    if (!this.bot || this.config.chatIds.length === 0) return;
    
    for (const chatId of this.config.chatIds) {
      await this.sendMessage(chatId, message, urgent);
    }
  }

  private async sendMessage(chatId: string, message: string, urgent: boolean = false): Promise<void> {
    if (!this.bot) return;
    
    // Rate limiting
    const lastTime = this.lastMessageTime.get(chatId) || 0;
    const minInterval = urgent ? 1000 : 5000;
    
    if (Date.now() - lastTime < minInterval) {
      this.messageQueue.push({ chatId, message });
      return;
    }
    
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true }
      });
      
      this.lastMessageTime.set(chatId, Date.now());
      this.emit('message:sent', chatId, message);
      
    } catch (error) {
      logger.error(`[Telegram] Failed to send message to ${chatId}:`, error);
    }
  }

  // ==========================================================================
  // AUTHORIZATION
  // ==========================================================================

  private isAuthorized(ctx: Context): boolean {
    const chatId = ctx.chat?.id.toString();
    return chatId ? this.config.chatIds.includes(chatId) : false;
  }

  private isAdmin(ctx: Context): boolean {
    const userId = ctx.from?.id.toString();
    return userId ? this.config.adminIds.includes(userId) : false;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  updateConfig(updates: Partial<TelegramConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[Telegram] Configuration updated');
  }

  getConfig(): TelegramConfig {
    return { ...this.config };
  }

  async sendCustomMessage(message: string): Promise<void> {
    await this.broadcastMessage(message);
  }

  isActive(): boolean {
    return this.isRunning && this.bot !== null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const telegramService = new TelegramNotificationService();
