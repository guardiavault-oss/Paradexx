// Chain Configuration Service - Maps chain names to chain IDs

export const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  fantom: 250,
  base: 8453,
  linea: 59144,
  scroll: 534352,
  // Testnets
  sepolia: 11155111,
  goerli: 5,
  mumbai: 80001,
  'bsc-testnet': 97,
};

export const CHAIN_NAME_MAP: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
  56: 'bsc',
  42161: 'arbitrum',
  10: 'optimism',
  43114: 'avalanche',
  250: 'fantom',
  8453: 'base',
  59144: 'linea',
  534352: 'scroll',
  // Testnets
  11155111: 'sepolia',
  5: 'goerli',
  80001: 'mumbai',
  97: 'bsc-testnet',
};

/**
 * Get chain ID from chain name
 */
export function getChainId(chainName: string): number | undefined {
  return CHAIN_ID_MAP[chainName.toLowerCase()];
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string | undefined {
  return CHAIN_NAME_MAP[chainId];
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainNameOrId: string | number): boolean {
  if (typeof chainNameOrId === 'string') {
    return chainNameOrId.toLowerCase() in CHAIN_ID_MAP;
  }
  return chainNameOrId in CHAIN_NAME_MAP;
}


