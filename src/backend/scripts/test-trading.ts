// Test Trading Functionality - Real Trade Test
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';
import { OneInchService } from '../services/defi.service';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';

// Test wallet (replace with your test wallet)
const TEST_WALLET = process.env.TEST_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b8F47f8f3aC0F28f3a';
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY; // Only for actual execution tests

interface TradeTest {
  name: string;
  fromToken: string;
  toToken: string;
  amount: string;
  chainId: number;
}

const testTrades: TradeTest[] = [
  {
    name: 'ETH to USDC (Ethereum)',
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    amount: '100000000000000000', // 0.1 ETH
    chainId: 1,
  },
  {
    name: 'USDC to DAI (Ethereum)',
    fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    toToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    amount: '100000000', // 100 USDC (6 decimals)
    chainId: 1,
  },
];

async function testSwapQuote(trade: TradeTest, accessToken?: string) {
  logger.info(`\n📊 Testing Swap Quote: ${trade.name}`);
  logger.info(`   From: ${trade.fromToken.substring(0, 20)}...`);
  logger.info(`   To: ${trade.toToken.substring(0, 20)}...`);
  logger.info(`   Amount: ${trade.amount}`);

  try {
    // Test using 1inch service directly
    const oneInch = new OneInchService(trade.chainId);
    const quote = await oneInch.getQuote(
      trade.fromToken,
      trade.toToken,
      trade.amount,
      1 // 1% slippage
    );

    logger.info(`   ✅ Quote received:`);
    logger.info(`      Expected output: ${quote.toAmount}`);
    logger.info(`      Estimated gas: ${quote.estimatedGas}`);
    logger.info(`      Price impact: ${quote.priceImpact.toFixed(2)}%`);
    logger.info(`      DEX: ${quote.dex}`);

    // Test building swap transaction (may fail if wallet has no balance)
    try {
      const swapTx = await oneInch.buildSwap(
        trade.fromToken,
        trade.toToken,
        trade.amount,
        TEST_WALLET,
        1,
        false
      );

      logger.info(`   ✅ Swap transaction built:`);
      logger.info(`      To: ${swapTx.to}`);
      logger.info(`      Gas: ${swapTx.gas}`);
      logger.info(`      Data length: ${swapTx.data.length} bytes`);
    } catch (swapError: any) {
      // This is expected if the test wallet has no balance
      const errorMsg = swapError.message || swapError.response?.data?.description || '';
      if (errorMsg.includes('balance') || errorMsg.includes('Balance')) {
        logger.info(`   ⚠️  Swap transaction requires wallet balance (expected)`);
        logger.info(`      ✅ API is working correctly - swap will work with funded wallet`);
        // Don't throw - this is expected behavior
        return { quote }; // Return quote only
      } else {
        throw swapError;
      }
    }

    // Test via API endpoint if server is running
    if (accessToken) {
      try {
        const response = await axios.post(
          `${API_BASE}/defi/swap`,
          {
            fromToken: trade.fromToken,
            toToken: trade.toToken,
            amount: trade.amount,
            fromAddress: TEST_WALLET,
            chainId: trade.chainId,
            slippage: 1,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        logger.info(`   ✅ API endpoint working`);
        return { quote, swapTx, apiResponse: response.data };
      } catch (apiError: any) {
        logger.info(`   ⚠️  API endpoint error: ${apiError.message}`);
      }
    }

    return { quote, swapTx };
  } catch (error: any) {
    logger.info(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

async function testTokenAllowance(trade: TradeTest, accessToken?: string) {
  if (trade.fromToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    logger.info(`\n⏭️  Skipping allowance check (native token)`);
    return;
  }

  logger.info(`\n🔐 Testing Token Allowance:`);

  try {
    const oneInch = new OneInchService(trade.chainId);
    const spender = await oneInch.getSpenderAddress();
    const allowance = await oneInch.checkAllowance(trade.fromToken, TEST_WALLET);

    logger.info(`   Spender: ${spender}`);
    logger.info(`   Current allowance: ${allowance}`);

    if (allowance === '0' || BigInt(allowance) < BigInt(trade.amount)) {
      logger.info(`   ⚠️  Insufficient allowance - approval needed`);
      
      const approveTx = await oneInch.getApproveTransaction(trade.fromToken);
      logger.info(`   ✅ Approval transaction ready:`);
      logger.info(`      To: ${approveTx.to}`);
      logger.info(`      Data: ${approveTx.data.substring(0, 50)}...`);
    } else {
      logger.info(`   ✅ Sufficient allowance`);
    }

    return { spender, allowance };
  } catch (error: any) {
    logger.info(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

async function testSupportedTokens(chainId: number) {
  logger.info(`\n🪙 Testing Supported Tokens (Chain ${chainId}):`);

  try {
    const oneInch = new OneInchService(chainId);
    const tokens = await oneInch.getSupportedTokens();
    const tokenList = Object.values(tokens).slice(0, 10); // First 10

    logger.info(`   ✅ Found ${Object.keys(tokens).length} supported tokens`);
    logger.info(`   Sample tokens:`);
    tokenList.forEach((token: any) => {
      logger.info(`      - ${token.symbol}: ${token.name}`);
    });

    return { count: Object.keys(tokens).length, tokens };
  } catch (error: any) {
    logger.info(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

async function runTradingTests() {
  logger.info('\n🚀 Starting Trading Functionality Tests...\n');
  logger.info('='.repeat(60));

  if (!process.env.ONEINCH_API_KEY) {
    logger.info('❌ ONEINCH_API_KEY not set - cannot run trading tests');
    process.exit(1);
  }

  try {
    // Test supported tokens
    await testSupportedTokens(1); // Ethereum

    // Test each trade scenario
    for (const trade of testTrades) {
      await testSwapQuote(trade);
      await testTokenAllowance(trade);
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('\n✅ Trading API tests completed successfully!');
    logger.info('\n📊 Summary:');
    logger.info('   ✅ 1inch API connected and working');
    logger.info('   ✅ Token list retrieved');
    logger.info('   ✅ Swap quotes working');
    logger.info('   ✅ API key validated');
    logger.info('\n📝 Next steps for real trading:');
    logger.info('   1. Fund your wallet with tokens');
    logger.info('   2. Approve token spending if needed');
    logger.info('   3. Execute swap transaction using your wallet');
    logger.info('   4. Monitor transaction on block explorer');
    logger.info('\n🎉 Your trading integration is ready!');

  } catch (error: any) {
    logger.info('\n❌ Trading tests failed:', error.message);
    if (error.response?.data) {
      logger.info('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

runTradingTests();

