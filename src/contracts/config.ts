/**
 * DualGen Smart Contract Configuration
 * Deployed contracts on Sepolia Testnet
 */

// Sepolia Testnet Chain ID
export const SEPOLIA_CHAIN_ID = 11155111;

// Contract Addresses - Deployed on Sepolia
export const CONTRACT_ADDRESSES = {
  // Core Contracts
  GuardiaVault: '0x7B6795A664977Be8eeBF64eaF539EDc6707296e3',
  YieldVault: '0x63823f0a35bFe67439f9EC4A515255E258405D0A',
  MultiSigRecovery: '0x6B2Ae1f02E82f2a8336180894c980487C922db59',
  
  // Yield Adapters
  LidoAdapter: '0x08C3F1fde722766a5368E78eB428CbF0a81E9901',
  AaveAdapter: '0xaE1f64EEc0c46C287D9A6B39667beacc12F4596A',
  
  // Legacy Deployments (Ignition)
  GuardiaVaultLegacy: '0x3D853c85Df825EA3CEd26040Cba0341778eAA891',
  YieldVaultLegacy: '0xe63b2eaaE33fbe61C887235668ec0705bCFb463e',
  LifetimeAccess: '0x01eFA1b345f806cC847aa434FC99c255CDc02Da1',
} as const;

// Test Token Addresses on Sepolia
export const TEST_TOKENS = {
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  DAI: '0x68194a729C2450ad26072b3cC3CC575Fff8c6C5A',
} as const;

// Sepolia RPC URLs - Configure via environment variables or use public endpoints
// Set VITE_ALCHEMY_KEY or VITE_INFURA_KEY in your .env file for better rate limits
export const SEPOLIA_RPC_URLS: readonly string[] = [
  // Public RPC endpoints (no API key required)
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://sepolia.drpc.org',
  'https://1rpc.io/sepolia',
] as const;

// Network Configuration
export const NETWORK_CONFIG = {
  name: 'Sepolia',
  chainId: SEPOLIA_CHAIN_ID,
  rpcUrl: SEPOLIA_RPC_URLS[0],
  blockExplorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Contract ABI Imports (will be created)
export type ContractName = keyof typeof CONTRACT_ADDRESSES;
