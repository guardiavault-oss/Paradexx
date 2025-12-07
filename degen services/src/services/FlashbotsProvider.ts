// ============================================================================
// APEX SNIPER - Flashbots Integration
// Private mempool and bundle execution for MEV protection
// ============================================================================

import { ethers, Wallet, JsonRpcProvider, TransactionRequest, TransactionResponse } from 'ethers';
import axios from 'axios';
import {
  FlashbotsBundle,
  FlashbotsBundleTransaction,
  BundleSimulationResult,
  TransactionSimulationResult,
  ExecutionMethod
} from '../types';
import { config, FLASHBOTS_CONFIG } from '../config';
import { logger, generateId, sleep, checksumAddress } from '../utils';

// ============================================================================
// FLASHBOTS PROVIDER
// ============================================================================

export class FlashbotsProvider {
  private provider: JsonRpcProvider;
  private authSigner: Wallet;
  private relayUrl: string;
  private protectUrl: string;
  private builderUrls: string[];
  
  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    
    // Auth signer for bundle signing
    const authKey = config.flashbotsAuthKey || Wallet.createRandom().privateKey;
    this.authSigner = new Wallet(authKey);
    
    const fbConfig = config.chainId === 1 
      ? FLASHBOTS_CONFIG.mainnet 
      : FLASHBOTS_CONFIG.sepolia;
      
    this.relayUrl = fbConfig.relayUrl;
    this.protectUrl = fbConfig.protectUrl;
    this.builderUrls = 'builderUrls' in fbConfig ? (fbConfig.builderUrls as string[]) : [this.relayUrl];
    
    logger.info(`Flashbots provider initialized with relay: ${this.relayUrl}`);
  }

  // ==========================================================================
  // BUNDLE CREATION
  // ==========================================================================

  async createBundle(
    transactions: Array<{
      signer: Wallet;
      transaction: TransactionRequest;
    }>,
    targetBlock?: number
  ): Promise<FlashbotsBundle> {
    const currentBlock = await this.provider.getBlockNumber();
    const target = targetBlock || currentBlock + 1;
    
    const signedTransactions: FlashbotsBundleTransaction[] = [];
    
    for (const { signer, transaction } of transactions) {
      // Ensure nonce is set
      if (transaction.nonce === undefined) {
        transaction.nonce = await this.provider.getTransactionCount(signer.address, 'pending');
      }
      
      // Ensure chain ID is set
      transaction.chainId = config.chainId;
      
      // Sign transaction
      const signedTx = await signer.signTransaction(transaction as TransactionRequest);
      const txHash = ethers.keccak256(signedTx);
      
      signedTransactions.push({
        signedTransaction: signedTx,
        hash: txHash,
        from: checksumAddress(signer.address),
        to: transaction.to as string,
        value: transaction.value as bigint || 0n,
        gasLimit: transaction.gasLimit as bigint || 300000n
      });
    }
    
    const bundle: FlashbotsBundle = {
      id: generateId(),
      transactions: signedTransactions,
      targetBlock: target,
      status: 'PENDING',
      createdAt: Date.now()
    };
    
    return bundle;
  }

  // ==========================================================================
  // BUNDLE SIMULATION
  // ==========================================================================

  async simulateBundle(bundle: FlashbotsBundle): Promise<BundleSimulationResult> {
    const signedTxs = bundle.transactions.map(tx => tx.signedTransaction);
    
    const params = {
      txs: signedTxs,
      blockNumber: `0x${bundle.targetBlock.toString(16)}`,
      stateBlockNumber: 'latest'
    };
    
    try {
      const response = await this.callRelay('eth_callBundle', [params]);
      
      if (response.error) {
        return {
          success: false,
          bundleHash: '',
          coinbaseDiff: 0n,
          gasFees: 0n,
          totalGasUsed: 0n,
          stateBlockNumber: bundle.targetBlock,
          results: [],
          error: response.error.message
        };
      }
      
      const result = response.result;
      
      const txResults: TransactionSimulationResult[] = result.results?.map((r: any) => ({
        txHash: r.txHash,
        success: !r.error && !r.revert,
        gasUsed: BigInt(r.gasUsed || 0),
        gasPrice: BigInt(r.gasPrice || 0),
        gasFees: BigInt(r.gasFees || 0),
        fromAddress: r.fromAddress,
        toAddress: r.toAddress,
        value: BigInt(r.value || 0),
        error: r.error,
        revert: r.revert
      })) || [];
      
      return {
        success: !result.firstRevert,
        bundleHash: result.bundleHash || '',
        coinbaseDiff: BigInt(result.coinbaseDiff || 0),
        gasFees: BigInt(result.totalGasUsed || 0) * BigInt(result.gasPrice || 0),
        totalGasUsed: BigInt(result.totalGasUsed || 0),
        stateBlockNumber: parseInt(result.stateBlockNumber || bundle.targetBlock),
        results: txResults
      };
    } catch (error) {
      logger.error('Bundle simulation failed:', error);
      return {
        success: false,
        bundleHash: '',
        coinbaseDiff: 0n,
        gasFees: 0n,
        totalGasUsed: 0n,
        stateBlockNumber: bundle.targetBlock,
        results: [],
        error: (error as Error).message
      };
    }
  }

  // ==========================================================================
  // BUNDLE SUBMISSION
  // ==========================================================================

  async sendBundle(bundle: FlashbotsBundle): Promise<{
    success: boolean;
    bundleHash?: string;
    error?: string;
  }> {
    const signedTxs = bundle.transactions.map(tx => tx.signedTransaction);
    
    // First simulate
    const simulation = await this.simulateBundle(bundle);
    if (!simulation.success) {
      return {
        success: false,
        error: `Simulation failed: ${simulation.error}`
      };
    }
    
    bundle.simulationResult = simulation;
    bundle.bundleHash = simulation.bundleHash;
    
    const params = {
      txs: signedTxs,
      blockNumber: `0x${bundle.targetBlock.toString(16)}`,
      minTimestamp: bundle.minTimestamp,
      maxTimestamp: bundle.maxTimestamp
    };
    
    try {
      // Send to all builders for better inclusion
      const promises = this.builderUrls.map(url => 
        this.callRelayDirect(url, 'eth_sendBundle', [params])
      );
      
      const results = await Promise.allSettled(promises);
      
      // Check if any succeeded
      for (const result of results) {
        if (result.status === 'fulfilled' && !result.value.error) {
          bundle.status = 'SUBMITTED';
          bundle.submittedAt = Date.now();
          
          return {
            success: true,
            bundleHash: simulation.bundleHash
          };
        }
      }
      
      // All failed
      const firstError = results.find(r => 
        r.status === 'rejected' || r.value?.error
      );
      const errorMsg = firstError?.status === 'rejected' 
        ? (firstError.reason as Error).message 
        : (firstError as any)?.value?.error?.message || 'Unknown error';
        
      return {
        success: false,
        error: errorMsg
      };
      
    } catch (error) {
      logger.error('Bundle submission failed:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ==========================================================================
  // MULTI-BLOCK SUBMISSION
  // ==========================================================================

  async sendBundleToBlocks(
    bundle: FlashbotsBundle,
    numBlocks: number = 3
  ): Promise<{
    success: boolean;
    bundleHash?: string;
    error?: string;
  }> {
    const currentBlock = await this.provider.getBlockNumber();
    const results: Promise<any>[] = [];
    
    for (let i = 0; i < numBlocks; i++) {
      const targetBlock = currentBlock + 1 + i;
      const blockBundle = { ...bundle, targetBlock };
      results.push(this.sendBundle(blockBundle));
    }
    
    const allResults = await Promise.allSettled(results);
    
    for (const result of allResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        return result.value;
      }
    }
    
    return {
      success: false,
      error: 'Failed to submit to any block'
    };
  }

  // ==========================================================================
  // BUNDLE STATUS
  // ==========================================================================

  async getBundleStats(bundleHash: string): Promise<{
    status: 'PENDING' | 'INCLUDED' | 'FAILED';
    blockNumber?: number;
  }> {
    try {
      const response = await this.callRelay('flashbots_getBundleStats', [{
        bundleHash
      }]);
      
      if (response.result?.isSimulated && response.result?.isHighPriority) {
        if (response.result?.simulatedAt) {
          return { status: 'PENDING' };
        }
      }
      
      return { status: 'FAILED' };
    } catch {
      return { status: 'PENDING' };
    }
  }

  async waitForInclusion(
    bundleHash: string,
    maxBlocks: number = 5
  ): Promise<{
    included: boolean;
    blockNumber?: number;
  }> {
    const startBlock = await this.provider.getBlockNumber();
    
    while (true) {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock - startBlock > maxBlocks) {
        return { included: false };
      }
      
      const stats = await this.getBundleStats(bundleHash);
      
      if (stats.status === 'INCLUDED') {
        return {
          included: true,
          blockNumber: stats.blockNumber
        };
      }
      
      if (stats.status === 'FAILED') {
        return { included: false };
      }
      
      await sleep(1000);
    }
  }

  // ==========================================================================
  // FLASHBOTS PROTECT (PRIVATE TRANSACTIONS)
  // ==========================================================================

  async sendPrivateTransaction(
    signer: Wallet,
    transaction: TransactionRequest
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // Ensure transaction is properly formatted
    if (transaction.nonce === undefined) {
      transaction.nonce = await this.provider.getTransactionCount(signer.address, 'pending');
    }
    transaction.chainId = config.chainId;
    
    // Sign the transaction
    const signedTx = await signer.signTransaction(transaction as TransactionRequest);
    
    try {
      // Send via Flashbots Protect RPC
      const response = await axios.post(this.protectUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendRawTransaction',
        params: [signedTx]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.error) {
        return {
          success: false,
          error: response.data.error.message
        };
      }
      
      return {
        success: true,
        txHash: response.data.result
      };
    } catch (error) {
      logger.error('Private transaction failed:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ==========================================================================
  // CANCEL TRANSACTIONS
  // ==========================================================================

  async cancelPrivateTransaction(txHash: string): Promise<boolean> {
    try {
      const response = await axios.post(this.protectUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_cancelPrivateTransaction',
        params: [{ txHash }]
      });
      
      return !response.data.error;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // RELAY COMMUNICATION
  // ==========================================================================

  private async callRelay(method: string, params: any[]): Promise<any> {
    return this.callRelayDirect(this.relayUrl, method, params);
  }

  private async callRelayDirect(url: string, method: string, params: any[]): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    };
    
    // Sign the body for authentication
    const signature = await this.authSigner.signMessage(
      ethers.id(JSON.stringify(body))
    );
    
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': `${this.authSigner.address}:${signature}`
      },
      timeout: 10000
    });
    
    return response.data;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  async getCurrentBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async estimateBundleGas(transactions: TransactionRequest[]): Promise<bigint> {
    let total = 0n;
    
    for (const tx of transactions) {
      try {
        const estimate = await this.provider.estimateGas(tx);
        total += estimate;
      } catch {
        total += 300000n; // Default estimate
      }
    }
    
    return total;
  }

  getAuthSignerAddress(): string {
    return this.authSigner.address;
  }
}

// ============================================================================
// EXECUTION ENGINE INTEGRATION
// ============================================================================

export class FlashbotsExecutor {
  private flashbots: FlashbotsProvider;
  
  constructor() {
    this.flashbots = new FlashbotsProvider();
  }

  async executeSwap(
    signer: Wallet,
    swapTx: TransactionRequest,
    method: ExecutionMethod = ExecutionMethod.FLASHBOTS
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    switch (method) {
      case ExecutionMethod.FLASHBOTS:
        return this.executeViaFlashbots(signer, swapTx);
      case ExecutionMethod.PRIVATE_RPC:
        return this.executeViaPrivateRPC(signer, swapTx);
      default:
        return this.executeDirect(signer, swapTx);
    }
  }

  private async executeViaFlashbots(
    signer: Wallet,
    swapTx: TransactionRequest
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    // Create bundle with single transaction
    const bundle = await this.flashbots.createBundle([
      { signer, transaction: swapTx }
    ]);
    
    // Send to multiple blocks
    const result = await this.flashbots.sendBundleToBlocks(bundle, 3);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Wait for inclusion
    const inclusion = await this.flashbots.waitForInclusion(result.bundleHash!, 5);
    
    if (!inclusion.included) {
      return { success: false, error: 'Bundle not included' };
    }
    
    return {
      success: true,
      txHash: bundle.transactions[0].hash,
      blockNumber: inclusion.blockNumber
    };
  }

  private async executeViaPrivateRPC(
    signer: Wallet,
    swapTx: TransactionRequest
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    return this.flashbots.sendPrivateTransaction(signer, swapTx);
  }

  private async executeDirect(
    signer: Wallet,
    swapTx: TransactionRequest
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const connectedSigner = signer.connect(provider);
      
      const tx = await connectedSigner.sendTransaction(swapTx);
      await tx.wait();
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const flashbotsProvider = new FlashbotsProvider();
export const flashbotsExecutor = new FlashbotsExecutor();
