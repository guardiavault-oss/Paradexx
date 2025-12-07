import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import axios from 'axios';

const router = Router();

const LIFI_API = 'https://li.quest/v1';
const SOCKET_API = 'https://api.socket.tech/v2';

// Lazy getter for Socket API key
function getSocketApiKey(): string {
  return process.env.SOCKET_API_KEY || '';
}

// Helper to get the key value (called at runtime)
function hasSocketApiKey(): boolean {
  return !!process.env.SOCKET_API_KEY;
}

// Log config on module load (deferred)
setTimeout(() => {
  const hasSocketKey = !!process.env.SOCKET_API_KEY;
  if (hasSocketKey) {
    logger.info('[CrossChain] ✅ Socket API key configured');
  } else {
    logger.info('[CrossChain] ⚠️ No Socket API key - using LI.FI only (free tier)');
  }
  logger.info('[CrossChain] Available bridges: LI.FI (free), Socket.tech (with API key)');
}, 1000);

router.post('/routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      fromChainId,
      toChainId,
      fromToken,
      toToken,
      amount,
      userAddress,
      slippage = 1,
    } = req.body;

    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['fromChainId', 'toChainId', 'fromToken', 'toToken', 'amount'],
      });
    }

    const routes: any[] = [];

    try {
      const lifiResponse = await axios.post(`${LIFI_API}/routes`, {
        fromChainId,
        toChainId,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        fromAmount: amount,
        fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
        options: {
          slippage: slippage / 100,
          order: 'RECOMMENDED',
        },
      });

      if (lifiResponse.data?.routes) {
        lifiResponse.data.routes.forEach((route: any) => {
          routes.push({
            provider: 'lifi',
            name: `LI.FI - ${route.tags?.join(', ') || 'Standard'}`,
            fromAmount: route.fromAmount,
            toAmount: route.toAmount,
            estimatedTime: route.steps?.reduce((acc: number, step: any) =>
              acc + (step.estimate?.executionDuration || 0), 0),
            gasCostUSD: route.gasCostUSD,
            steps: route.steps?.map((step: any) => ({
              type: step.type,
              tool: step.tool,
              fromChain: step.action?.fromChainId,
              toChain: step.action?.toChainId,
              fromToken: step.action?.fromToken?.symbol,
              toToken: step.action?.toToken?.symbol,
              estimatedTime: step.estimate?.executionDuration,
            })),
            tags: route.tags,
            id: route.id,
          });
        });
      }
    } catch (error: any) {
      logger.error('LI.FI routes error:', error.response?.data || error.message);
    }

    if (hasSocketApiKey()) {
      try {
        const socketResponse = await axios.get(`${SOCKET_API}/quote`, {
          params: {
            fromChainId,
            toChainId,
            fromTokenAddress: fromToken,
            toTokenAddress: toToken,
            fromAmount: amount,
            userAddress: userAddress || '0x0000000000000000000000000000000000000000',
            uniqueRoutesPerBridge: true,
            sort: 'output',
          },
          headers: {
            'API-KEY': getSocketApiKey(),
          },
        });

        if (socketResponse.data?.result?.routes) {
          socketResponse.data.result.routes.forEach((route: any) => {
            routes.push({
              provider: 'socket',
              name: `Socket - ${route.usedBridgeNames?.join(' → ') || 'Bridge'}`,
              fromAmount: route.fromAmount,
              toAmount: route.toAmount,
              estimatedTime: route.serviceTime,
              gasCostUSD: route.totalGasFeesInUsd,
              steps: route.userTxs?.map((tx: any) => ({
                type: tx.userTxType,
                fromChain: tx.chainId,
                protocol: tx.protocol?.displayName,
              })),
              bridgeUsed: route.usedBridgeNames,
              id: route.routeId,
            });
          });
        }
      } catch (error: any) {
        logger.error('Socket routes error:', error.response?.data || error.message);
      }
    }

    if (routes.length === 0) {
      return res.status(503).json({
        error: 'No routes available',
        message: 'Unable to find cross-chain routes. Try different tokens or chains.',
      });
    }

    routes.sort((a, b) => {
      const aAmount = BigInt(a.toAmount || '0');
      const bAmount = BigInt(b.toAmount || '0');
      return bAmount > aAmount ? 1 : -1;
    });

    res.json({
      routes,
      bestRoute: routes[0],
      parameters: {
        fromChainId,
        toChainId,
        fromToken,
        toToken,
        amount,
        slippage,
      },
    });
  } catch (error) {
    logger.error('Get cross-chain routes error:', error);
    res.status(500).json({ error: 'Failed to get cross-chain routes' });
  }
});

router.post('/build-tx', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { provider, routeId, userAddress, stepIndex = 0 } = req.body;

    if (!routeId || !userAddress) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['routeId', 'userAddress'],
      });
    }

    if (provider === 'lifi' || !provider) {
      const stepResponse = await axios.post(`${LIFI_API}/advanced/stepTransaction`, {
        step: {
          id: routeId,
          action: { fromAddress: userAddress, toAddress: userAddress },
        },
      });

      if (stepResponse.data?.transactionRequest) {
        return res.json({
          transaction: {
            to: stepResponse.data.transactionRequest.to,
            data: stepResponse.data.transactionRequest.data,
            value: stepResponse.data.transactionRequest.value,
            gasLimit: stepResponse.data.transactionRequest.gasLimit,
            chainId: stepResponse.data.transactionRequest.chainId,
          },
        });
      }
    }

    if (provider === 'socket' && hasSocketApiKey()) {
      const buildResponse = await axios.post(
        `${SOCKET_API}/build-tx`,
        { route: { routeId, stepIndex } },
        { headers: { 'API-KEY': getSocketApiKey() } }
      );

      if (buildResponse.data?.result) {
        return res.json({
          transaction: {
            to: buildResponse.data.result.txTarget,
            data: buildResponse.data.result.txData,
            value: buildResponse.data.result.value,
            chainId: buildResponse.data.result.chainId,
          },
        });
      }
    }

    return res.status(400).json({ error: 'Unable to build transaction' });
  } catch (error: any) {
    logger.error('Build cross-chain tx error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to build cross-chain transaction' });
  }
});

router.get('/status/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;
    const { bridge, fromChain, toChain } = req.query;

    const statusResponse = await axios.get(`${LIFI_API}/status`, {
      params: {
        txHash,
        bridge,
        fromChain,
        toChain,
      },
    });

    res.json({
      status: statusResponse.data.status,
      substatus: statusResponse.data.substatus,
      substatusMessage: statusResponse.data.substatusMessage,
      sending: statusResponse.data.sending,
      receiving: statusResponse.data.receiving,
    });
  } catch (error: any) {
    logger.error('Get bridge status error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get bridge status' });
  }
});

router.get('/chains', async (_req: Request, res: Response) => {
  try {
    const chainsResponse = await axios.get(`${LIFI_API}/chains`);

    res.json({
      chains: chainsResponse.data.chains?.map((chain: any) => ({
        id: chain.id,
        name: chain.name,
        key: chain.key,
        nativeCurrency: chain.nativeToken,
        logo: chain.logoURI,
      })),
    });
  } catch (error: any) {
    logger.error('Get chains error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get supported chains' });
  }
});

export default router;
