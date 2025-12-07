/**
 * Asset Fetcher Service
 * Fetches ERC-20 tokens, NFTs, and token metadata across multiple chains
 */

// Optimized Ethers import - use optimized imports for better tree-shaking
import { BrowserProvider, Contract, formatEther, formatUnits } from "@/lib/ethers-optimized";
import { logError, logWarn } from "@/utils/logger";

// Chain configuration
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  alchemyNetwork?: string;
  explorer: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2",
    alchemyNetwork: "eth-mainnet",
    explorer: "https://etherscan.io",
  },
  polygon: {
    id: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2",
    alchemyNetwork: "polygon-mainnet",
    explorer: "https://polygonscan.com",
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum",
    rpcUrl: "https://arb-mainnet.g.alchemy.com/v2",
    alchemyNetwork: "arb-mainnet",
    explorer: "https://arbiscan.io",
  },
  optimism: {
    id: 10,
    name: "Optimism",
    rpcUrl: "https://opt-mainnet.g.alchemy.com/v2",
    alchemyNetwork: "opt-mainnet",
    explorer: "https://optimistic.etherscan.io",
  },
  base: {
    id: 8453,
    name: "Base",
    rpcUrl: "https://base-mainnet.g.alchemy.com/v2",
    alchemyNetwork: "base-mainnet",
    explorer: "https://basescan.org",
  },
};

// Token and NFT interfaces
export interface TokenAsset {
  type: "token";
  chainId: number;
  chainName: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  priceUsd?: number;
  valueUsd?: number;
  logo?: string;
}

export interface NFTAsset {
  type: "nft";
  chainId: number;
  chainName: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  collectionName?: string;
  collectionSymbol?: string;
  metadata?: Record<string, any>;
}

export type Asset = TokenAsset | NFTAsset;

// ERC-20 ABI (minimal for balanceOf)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

// ERC-721 ABI (minimal for NFT)
const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

// ERC-1155 ABI
const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
] as const;

// Multicall contract addresses (mainnet)
const MULTICALL_ADDRESSES: Record<number, string> = {
  1: "0xcA11bde05977b3631167028862bE2a173976CA11", // Ethereum
  137: "0xcA11bde05977b3631167028862bE2a173976CA11", // Polygon
  42161: "0xcA11bde05977b3631167028862bE2a173976CA11", // Arbitrum
  10: "0xcA11bde05977b3631167028862bE2a173976CA11", // Optimism
  8453: "0xcA11bde05977b3631167028862bE2a173976CA11", // Base
};

// Multicall ABI (simplified)
const MULTICALL_ABI = [
  "function aggregate((address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
] as const;

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<any>>();

function getCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.join(":")}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

async function rateLimitedRequest<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  const now = Date.now();
  const waitTime = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes("rate limit")) {
        // Rate limited - exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      if (i === retries - 1) throw error;
      // Retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Get provider for a specific chain
 */
export async function getProvider(chainId: number): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Ethereum provider not available");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // Switch chain if needed
  if (network.chainId !== BigInt(chainId)) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
        if (chain) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        }
      }
    }
  }

  return provider;
}

/**
 * Fetch ERC-20 token balances using multicall
 */
export async function fetchTokenBalances(
  address: string,
  chainId: number,
  tokenAddresses: string[] = []
): Promise<TokenAsset[]> {
  const cacheKey = getCacheKey("tokens", address, chainId, tokenAddresses.join(","));
  const cached = getCached<TokenAsset[]>(cacheKey);
  if (cached) return cached;

  try {
    const provider = await getProvider(chainId);
    const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
    if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

    const tokens: TokenAsset[] = [];
    const multicallAddress = MULTICALL_ADDRESSES[chainId];

    // If no tokens specified, use common tokens for the chain
    if (tokenAddresses.length === 0) {
      tokenAddresses = getDefaultTokens(chainId);
    }

    // Fetch native token balance (ETH, MATIC, etc.)
    const nativeBalance = await provider.getBalance(address);
    const nativeSymbol = chainId === 137 ? "MATIC" : chainId === 8453 ? "ETH" : "ETH";
    tokens.push({
      type: "token",
      chainId,
      chainName: chain.name,
      address: "native",
      symbol: nativeSymbol,
      name: chain.name,
      decimals: 18,
      balance: nativeBalance.toString(),
      balanceFormatted: formatEther(nativeBalance),
    });

    // Batch fetch ERC-20 balances using multicall
    if (multicallAddress && tokenAddresses.length > 0) {
      const multicall = new Contract(multicallAddress, MULTICALL_ABI, provider);
      const erc20 = new Contract(tokenAddresses[0], ERC20_ABI, provider);

      // Prepare calls for balanceOf
      const calls = tokenAddresses.flatMap((tokenAddr) => [
        {
          target: tokenAddr,
          callData: erc20.interface.encodeFunctionData("balanceOf", [address]),
        },
        {
          target: tokenAddr,
          callData: erc20.interface.encodeFunctionData("decimals"),
        },
        {
          target: tokenAddr,
          callData: erc20.interface.encodeFunctionData("symbol"),
        },
        {
          target: tokenAddr,
          callData: erc20.interface.encodeFunctionData("name"),
        },
      ]);

      try {
        const [, returnData] = await multicall.aggregate.staticCall(calls);

        for (let i = 0; i < tokenAddresses.length; i++) {
          const tokenAddr = tokenAddresses[i];
          const balanceData = returnData[i * 4];
          const decimalsData = returnData[i * 4 + 1];
          const symbolData = returnData[i * 4 + 2];
          const nameData = returnData[i * 4 + 3];

          const balance = erc20.interface.decodeFunctionResult("balanceOf", balanceData)[0];
          const decimals = erc20.interface.decodeFunctionResult("decimals", decimalsData)[0];
          const symbol = erc20.interface.decodeFunctionResult("symbol", symbolData)[0];
          const name = erc20.interface.decodeFunctionResult("name", nameData)[0];

          if (balance > 0n) {
            tokens.push({
              type: "token",
              chainId,
              chainName: chain.name,
              address: tokenAddr,
              symbol,
              name,
              decimals: Number(decimals),
              balance: balance.toString(),
              balanceFormatted: formatUnits(balance, decimals),
            });
          }
        }
      } catch (multicallError) {
        // Fallback to individual calls if multicall fails
        logWarn("Multicall failed, using individual calls", {
          context: "fetchTokenBalances",
          error: multicallError instanceof Error ? multicallError.message : String(multicallError),
        });
        for (const tokenAddr of tokenAddresses) {
          try {
            const token = new Contract(tokenAddr, ERC20_ABI, provider);
            const [balance, decimals, symbol, name] = await Promise.all([
              token.balanceOf(address),
              token.decimals(),
              token.symbol(),
              token.name(),
            ]);

            if (balance > 0n) {
              tokens.push({
                type: "token",
                chainId,
                chainName: chain.name,
                address: tokenAddr,
                symbol,
                name,
                decimals: Number(decimals),
                balance: balance.toString(),
                balanceFormatted: formatUnits(balance, decimals),
              });
            }
          } catch (error) {
            logWarn(`Failed to fetch token ${tokenAddr}`, {
              context: "fetchTokenBalances",
              tokenAddress: tokenAddr,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }

    // Fetch prices from CoinGecko
    await fetchTokenPrices(tokens);

    setCache(cacheKey, tokens);
    return tokens;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "fetchTokenBalances",
    });
    return [];
  }
}

/**
 * Get default token addresses for a chain
 */
function getDefaultTokens(chainId: number): string[] {
  const commonTokens: Record<number, string[]> = {
    1: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
      "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
      "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK
    ],
    137: [
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
      "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC
    ],
    42161: [
      "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
      "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
    ],
    10: [
      "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
      "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
    ],
    8453: [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    ],
  };

  return commonTokens[chainId] || [];
}

/**
 * Fetch token prices from CoinGecko
 */
async function fetchTokenPrices(tokens: TokenAsset[]): Promise<void> {
  if (tokens.length === 0) return;

  try {
    // Map chain IDs to CoinGecko chain identifiers
    const chainMap: Record<number, string> = {
      1: "ethereum",
      137: "polygon-pos",
      42161: "arbitrum-one",
      10: "optimistic-ethereum",
      8453: "base",
    };

    // Get token addresses (excluding native)
    const tokenAddresses = tokens
      .filter((t) => t.address !== "native")
      .map((t) => t.address.toLowerCase());

    if (tokenAddresses.length === 0) return;

    const chainId = tokens[0].chainId;
    const chainName = chainMap[chainId];
    if (!chainName) return;

    // Separate native and ERC-20 tokens
    const nativeTokens = tokens.filter((t) => t.address === "native");
    const erc20Tokens = tokens.filter((t) => t.address !== "native");

    // Fetch ERC-20 token prices
    if (erc20Tokens.length > 0) {
      const addresses = erc20Tokens.map((t) => t.address.toLowerCase()).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${chainName}?contract_addresses=${addresses}&vs_currencies=usd`;

      try {
        const response = await rateLimitedRequest(() => fetch(url));

        if (response.ok) {
          const data = await response.json();

          // Update ERC-20 tokens with prices
          erc20Tokens.forEach((token) => {
            const priceData = data[token.address.toLowerCase()];
            if (priceData?.usd) {
              token.priceUsd = priceData.usd;
              token.valueUsd = parseFloat(token.balanceFormatted) * priceData.usd;
            }
          });
        }
      } catch (error) {
        logWarn("Failed to fetch ERC-20 token prices", {
          context: "fetchTokenPrices",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fetch native token prices
    if (nativeTokens.length > 0) {
      const nativePriceMap: Record<number, string> = {
        1: "ethereum",
        137: "matic-network",
        42161: "ethereum", // Arbitrum uses ETH
        10: "ethereum", // Optimism uses ETH
        8453: "ethereum", // Base uses ETH
      };

      const nativeId = nativePriceMap[chainId] || "ethereum";

      try {
        const response = await rateLimitedRequest(() =>
          fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${nativeId}&vs_currencies=usd`)
        );

        if (response.ok) {
          const data = await response.json();
          const price = data?.[nativeId]?.usd;

          if (price) {
            nativeTokens.forEach((token) => {
              token.priceUsd = price;
              token.valueUsd = parseFloat(token.balanceFormatted) * price;
            });
          }
        }
      } catch (error) {
        logWarn(`Failed to fetch native token price for ${chainId}`, {
          context: "fetchTokenPrices",
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    logWarn("Failed to fetch token prices", {
      context: "fetchTokenPrices",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Fetch NFTs using Alchemy API
 */
export async function fetchNFTs(
  address: string,
  chainId: number,
  alchemyApiKey?: string
): Promise<NFTAsset[]> {
  const cacheKey = getCacheKey("nfts", address, chainId);
  const cached = getCached<NFTAsset[]>(cacheKey);
  if (cached) return cached;

  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  if (!chain || !chain.alchemyNetwork) {
    logWarn(`Alchemy not supported for chain ${chainId}`, {
      context: "fetchNFTs",
      chainId,
    });
    return [];
  }

  // Use environment variable or default
  const apiKey = alchemyApiKey || process.env.VITE_ALCHEMY_API_KEY || "";
  if (!apiKey) {
    logWarn("Alchemy API key not configured", {
      context: "fetchNFTs",
    });
    return [];
  }

  try {
    const url = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}/getNFTs?owner=${address}&withMetadata=true`;

    const response = await rateLimitedRequest(() => fetch(url));

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();
    const nfts: NFTAsset[] = [];

    for (const nft of data.ownedNfts || []) {
      try {
        const metadata = nft.metadata || {};
        nfts.push({
          type: "nft",
          chainId,
          chainName: chain.name,
          contractAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
          name: metadata.name || `${nft.contract.name || "NFT"} #${nft.id.tokenId}`,
          description: metadata.description,
          image: metadata.image || metadata.image_url,
          collectionName: nft.contract.name,
          collectionSymbol: nft.contract.symbol,
          metadata,
        });
      } catch (error) {
        logWarn(`Failed to process NFT ${nft.contract.address}:${nft.id.tokenId}`, {
          context: "fetchNFTs",
          nftAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setCache(cacheKey, nfts);
    return nfts;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "fetchNFTs",
    });
    return [];
  }
}

/**
 * Fetch all assets (tokens + NFTs) for an address across multiple chains
 */
export async function fetchAllAssets(
  address: string,
  chains: number[] = [1, 137, 42161, 10, 8453],
  tokenAddresses?: Record<number, string[]>,
  alchemyApiKey?: string
): Promise<Asset[]> {
  if (!address) {
    logWarn("No address provided to fetchAllAssets", {
      context: "fetchAllAssets",
    });
    return [];
  }

  const allAssets: Asset[] = [];

  // Fetch in parallel for all chains, but handle errors gracefully
  const promises = chains.map(async (chainId) => {
    try {
      // Use Promise.allSettled to handle partial failures
      const [tokensResult, nftsResult] = await Promise.allSettled([
        fetchTokenBalances(address, chainId, tokenAddresses?.[chainId]),
        fetchNFTs(address, chainId, alchemyApiKey),
      ]);

      const tokens = tokensResult.status === "fulfilled" ? tokensResult.value : [];
      const nfts = nftsResult.status === "fulfilled" ? nftsResult.value : [];

      if (tokensResult.status === "rejected") {
        logWarn(`Failed to fetch tokens for chain ${chainId}`, {
          context: "fetchAllAssets",
          chainId,
          reason: tokensResult.reason instanceof Error ? tokensResult.reason.message : String(tokensResult.reason),
        });
      }
      if (nftsResult.status === "rejected") {
        logWarn(`Failed to fetch NFTs for chain ${chainId}`, {
          context: "fetchAllAssets",
          chainId,
          reason: nftsResult.reason instanceof Error ? nftsResult.reason.message : String(nftsResult.reason),
        });
      }

      return [...tokens, ...nfts];
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchAllAssets",
        chainId,
      });
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      allAssets.push(...result.value);
    } else {
      logWarn("Failed to fetch assets for a chain", {
        context: "fetchAllAssets",
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return allAssets;
}

/**
 * Get total portfolio value in USD
 */
export function getTotalPortfolioValue(assets: Asset[]): number {
  return assets
    .filter((a): a is TokenAsset => a.type === "token")
    .reduce((sum, token) => sum + (token.valueUsd || 0), 0);
}

/**
 * Get asset allocation percentages
 */
export function getAssetAllocations(assets: Asset[]): Array<{
  asset: TokenAsset;
  percentage: number;
  value: number;
}> {
  const totalValue = getTotalPortfolioValue(assets);
  if (totalValue === 0) return [];

  const tokens = assets.filter((a): a is TokenAsset => a.type === "token");
  return tokens
    .map((token) => ({
      asset: token,
      percentage: totalValue > 0 ? (token.valueUsd || 0) / totalValue : 0,
      value: token.valueUsd || 0,
    }))
    .filter((alloc) => alloc.value > 0)
    .sort((a, b) => b.value - a.value);
}

