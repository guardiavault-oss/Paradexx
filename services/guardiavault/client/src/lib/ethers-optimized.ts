/**
 * Optimized Ethers.js Imports
 * Use named imports to enable better tree-shaking
 * Only import what's actually needed
 */

// Re-export commonly used utilities
export { BrowserProvider, formatEther, parseEther, formatUnits, parseUnits, id } from "ethers";

// Export Contract class for contract instantiation
export { Contract } from "ethers";

// Export types
export type { Signer, Provider, ContractTransactionReceipt } from "ethers";

// Create a minimal ethers object for Contract constructor
// This allows us to use new ethers.Contract() while tree-shaking unused parts
import { Contract as EthersContract, id as ethersId } from "ethers";

// Re-export as a namespace-like object for compatibility
export const ethers = {
  Contract: EthersContract,
  id: ethersId,
};

