// ============================================================================
// APEX SNIPER - Main Entry Point
// Enterprise-grade Ethereum Sniper Bot with Flashbots Integration
// ============================================================================

import 'dotenv/config';
import { logger } from './utils';
import { config } from './config';
import { sniperCore } from './core/SniperCore';
import { apiServer } from './api/server';
import { executionEngine } from './services/ExecutionEngine';

// ============================================================================
// ASCII ART BANNER
// ============================================================================

const BANNER = `
 █████╗ ██████╗ ███████╗██╗  ██╗    ███████╗███╗   ██╗██╗██████╗ ███████╗██████╗ 
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝    ██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗
███████║██████╔╝█████╗   ╚███╔╝     ███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗     ╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗
██║  ██║██║     ███████╗██╔╝ ██╗    ███████║██║ ╚████║██║██║     ███████╗██║  ██║
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
                                                                                  
                    ⚡ Enterprise-grade Ethereum Sniper Bot ⚡
                         Flashbots | MEV Protection | Auto-Sell
`;

// ============================================================================
// MAIN BOOTSTRAP
// ============================================================================

async function bootstrap(): Promise<void> {
  console.log(BANNER);
  
  logger.info('Initializing Apex Sniper...');
  logger.info(`Chain ID: ${config.chainId}`);
  logger.info(`RPC URL: ${config.rpcUrl}`);
  logger.info(`Features: Flashbots=${config.features.flashbotsEnabled}, Whale Tracking=${config.features.whaleTrackingEnabled}`);

  // Load wallets from environment
  await loadWallets();

  // Start API server
  await apiServer.start();
  logger.info('API server started on port 3001');

  // Start sniper core
  await sniperCore.start();
  
  logger.info('');
  logger.info('╔═══════════════════════════════════════════════════════════════╗');
  logger.info('║                   APEX SNIPER INITIALIZED                      ║');
  logger.info('║                                                                 ║');
  logger.info('║  Dashboard: http://localhost:3000                              ║');
  logger.info('║  API:       http://localhost:3001/api                          ║');
  logger.info('║                                                                 ║');
  logger.info('║  Commands:                                                      ║');
  logger.info('║  - Enable auto-snipe: POST /api/auto-snipe/enable              ║');
  logger.info('║  - Manual buy: POST /api/buy { token, amount, walletId }       ║');
  logger.info('║  - Check status: GET /api/status                               ║');
  logger.info('║                                                                 ║');
  logger.info('╚═══════════════════════════════════════════════════════════════╝');
  logger.info('');
}

// ============================================================================
// WALLET LOADING
// ============================================================================

async function loadWallets(): Promise<void> {
  // Load wallets from environment variables
  // Format: WALLET_1_NAME=Main Wallet, WALLET_1_KEY=0x...
  
  let walletIndex = 1;
  
  while (true) {
    const name = process.env[`WALLET_${walletIndex}_NAME`];
    const key = process.env[`WALLET_${walletIndex}_KEY`];
    
    if (!name || !key) break;
    
    try {
      await executionEngine.addWallet(`wallet-${walletIndex}`, name, key);
      logger.info(`Loaded wallet: ${name}`);
    } catch (error) {
      logger.error(`Failed to load wallet ${name}:`, error);
    }
    
    walletIndex++;
  }
  
  // If no wallets loaded from env, check for default
  if (walletIndex === 1 && process.env.PRIVATE_KEY) {
    try {
      await executionEngine.addWallet('default', 'Default Wallet', process.env.PRIVATE_KEY);
      logger.info('Loaded default wallet');
    } catch (error) {
      logger.error('Failed to load default wallet:', error);
    }
  }
  
  const wallets = executionEngine.getWallets();
  logger.info(`Total wallets loaded: ${wallets.length}`);
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`\nReceived ${signal}, shutting down gracefully...`);
  
  try {
    await sniperCore.stop();
    await apiServer.stop();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

// ============================================================================
// START
// ============================================================================

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap:', error);
  process.exit(1);
});
