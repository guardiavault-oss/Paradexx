import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { moralis } from '../services/moralis.service';

const router = Router();

router.post('/gallery', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { chainId = 1, limit = 100, cursor } = req.body;

    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId!, isHidden: false },
      select: { address: true, chain: true },
    });

    if (wallets.length === 0) {
      return res.json({ nfts: [], total: 0, cursor: null });
    }

    const chainIdToFilter = chainId;
    const chainMap: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      bsc: 56,
      arbitrum: 42161,
      optimism: 10,
      base: 8453,
    };

    const allNfts: any[] = [];

    for (const wallet of wallets) {
      const walletChainId = chainMap[wallet.chain] || 1;
      
      if (chainIdToFilter && walletChainId !== chainIdToFilter) {
        continue;
      }

      try {
        const nfts = await moralis.getNFTs(wallet.address, walletChainId, limit);
        
        const formattedNfts = nfts.map(nft => ({
          id: `${nft.token_address}-${nft.token_id}`,
          tokenAddress: nft.token_address,
          tokenId: nft.token_id,
          name: nft.normalized_metadata?.name || nft.name || `#${nft.token_id}`,
          description: nft.normalized_metadata?.description || '',
          image: normalizeIpfsUrl(nft.normalized_metadata?.image || ''),
          animationUrl: normalizeIpfsUrl(nft.normalized_metadata?.animation_url || ''),
          externalUrl: nft.normalized_metadata?.external_url,
          attributes: nft.normalized_metadata?.attributes || [],
          contractType: nft.contract_type,
          symbol: nft.symbol,
          chain: wallet.chain,
          chainId: walletChainId,
          ownerAddress: wallet.address,
          verified: nft.verified_collection,
          spam: nft.possible_spam,
          blockNumber: nft.block_number,
          lastTransfer: nft.block_number_minted,
        }));

        allNfts.push(...formattedNfts);
      } catch (error) {
        logger.error(`Failed to fetch NFTs for ${wallet.address}:`, error);
      }
    }

    const nonSpamNfts = allNfts.filter(nft => !nft.spam);

    res.json({
      nfts: nonSpamNfts.slice(0, limit),
      total: nonSpamNfts.length,
      cursor: nonSpamNfts.length > limit ? 'more-available' : null,
    });
  } catch (error) {
    logger.error('Get NFT gallery error:', error);
    res.status(500).json({ error: 'Failed to get NFT gallery' });
  }
});

router.get('/details/:tokenAddress/:tokenId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tokenAddress, tokenId } = req.params;
    const { chainId = 1 } = req.query;

    const nft = await moralis.getNFTMetadata(tokenAddress, tokenId, Number(chainId));

    res.json({
      nft: {
        id: `${nft.token_address}-${nft.token_id}`,
        tokenAddress: nft.token_address,
        tokenId: nft.token_id,
        name: nft.normalized_metadata?.name || nft.name || `#${nft.token_id}`,
        description: nft.normalized_metadata?.description || '',
        image: normalizeIpfsUrl(nft.normalized_metadata?.image || ''),
        animationUrl: normalizeIpfsUrl(nft.normalized_metadata?.animation_url || ''),
        externalUrl: nft.normalized_metadata?.external_url,
        attributes: nft.normalized_metadata?.attributes || [],
        contractType: nft.contract_type,
        symbol: nft.symbol,
        owner: nft.owner_of,
        verified: nft.verified_collection,
        spam: nft.possible_spam,
      },
    });
  } catch (error) {
    logger.error('Get NFT details error:', error);
    res.status(500).json({ error: 'Failed to get NFT details' });
  }
});

router.get('/transfers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { chainId = 1, limit = 50 } = req.query;

    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId!, isHidden: false },
      select: { address: true },
    });

    if (wallets.length === 0) {
      return res.json({ transfers: [] });
    }

    const allTransfers: any[] = [];

    for (const wallet of wallets) {
      try {
        const transfers = await moralis.getNFTTransfers(wallet.address, Number(chainId), Number(limit));
        allTransfers.push(...transfers.map(t => ({
          ...t,
          walletAddress: wallet.address,
        })));
      } catch (error) {
        logger.error(`Failed to fetch NFT transfers for ${wallet.address}:`, error);
      }
    }

    allTransfers.sort((a, b) => 
      new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
    );

    res.json({
      transfers: allTransfers.slice(0, Number(limit)),
    });
  } catch (error) {
    logger.error('Get NFT transfers error:', error);
    res.status(500).json({ error: 'Failed to get NFT transfers' });
  }
});

router.get('/collections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { chainId = 1 } = req.query;

    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId!, isHidden: false },
      select: { address: true },
    });

    if (wallets.length === 0) {
      return res.json({ collections: [] });
    }

    const collectionsMap = new Map<string, any>();

    for (const wallet of wallets) {
      try {
        const nfts = await moralis.getNFTs(wallet.address, Number(chainId), 500);
        
        nfts.forEach(nft => {
          if (nft.possible_spam) return;
          
          const key = nft.token_address.toLowerCase();
          if (!collectionsMap.has(key)) {
            collectionsMap.set(key, {
              address: nft.token_address,
              name: nft.name,
              symbol: nft.symbol,
              contractType: nft.contract_type,
              verified: nft.verified_collection,
              count: 0,
              floorPrice: null,
            });
          }
          collectionsMap.get(key).count++;
        });
      } catch (error) {
        logger.error(`Failed to fetch NFTs for ${wallet.address}:`, error);
      }
    }

    const collections = Array.from(collectionsMap.values())
      .sort((a, b) => b.count - a.count);

    res.json({ collections });
  } catch (error) {
    logger.error('Get NFT collections error:', error);
    res.status(500).json({ error: 'Failed to get NFT collections' });
  }
});

function normalizeIpfsUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
}

export default router;
