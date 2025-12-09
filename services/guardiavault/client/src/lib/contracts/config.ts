// Contract addresses and configuration
export const CONTRACTS = {
  // Update these after deploying to testnet
  GuardiaVault: {
    address: import.meta.env.VITE_GUARDIA_VAULT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    chainId: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 31337,
  },
  MultiSigRecovery: {
    address: import.meta.env.VITE_MULTISIG_RECOVERY_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    chainId: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 31337,
  },
  YieldVault: {
    address: import.meta.env.VITE_YIELD_VAULT_ADDRESS || "",
    chainId: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 31337,
  },
  DAOVerification: {
    address: import.meta.env.VITE_DAO_VERIFICATION_ADDRESS || "",
    chainId: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 31337,
  },
};

// Network configurations
export const SUPPORTED_CHAINS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545",
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || "",
    blockExplorer: "https://sepolia.etherscan.io",
  },
};

export const DEFAULT_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "31337");
