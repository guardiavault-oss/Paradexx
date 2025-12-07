// Transaction Simulation Service - Tenderly/Blocknative integration

import axios from 'axios';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';

const TENDERLY_API = 'https://api.tenderly.co/api/v1';
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY;
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT;
const TENDERLY_USER = process.env.TENDERLY_USER;

export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  
  // State changes
  stateChanges: StateChange[];
  balanceChanges: BalanceChange[];
  
  // Logs & events
  logs: Log[];
  events: Event[];
  
  // Error details
  error?: {
    message: string;
    reason: string;
  };
  
  // Risk assessment
  risk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    warnings: string[];
  };
}

export interface StateChange {
  address: string;
  before: any;
  after: any;
  type: 'balance' | 'storage' | 'code';
}

export interface BalanceChange {
  address: string;
  token: string | null; // null for ETH
  before: string;
  after: string;
  change: string;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
}

export interface Event {
  name: string;
  signature: string;
  params: Record<string, any>;
}

export interface SimulationRequest {
  from: string;
  to: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  chainId?: number;
}

export class TransactionSimulator {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  // Simulate transaction with Tenderly
  async simulate(tx: SimulationRequest): Promise<SimulationResult> {
    try {
      const response = await axios.post(
        `${TENDERLY_API}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
        {
          network_id: tx.chainId?.toString() || '1',
          from: tx.from,
          to: tx.to,
          input: tx.data || '0x',
          value: tx.value || '0',
          gas: parseInt(tx.gas || '0'),
          gas_price: tx.gasPrice || '0',
          save: false, // Don't save simulation
          save_if_fails: false,
          simulation_type: 'quick',
        },
        {
          headers: {
            'X-Access-Key': TENDERLY_ACCESS_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      const simulation = response.data.transaction;

      // Extract balance changes
      const balanceChanges = this.extractBalanceChanges(simulation);

      // Extract state changes
      const stateChanges = this.extractStateChanges(simulation);

      // Assess risk
      const risk = this.assessRisk(simulation, balanceChanges);

      return {
        success: simulation.status,
        gasUsed: simulation.gas_used,
        gasPrice: simulation.gas_price,
        blockNumber: simulation.block_number,
        stateChanges,
        balanceChanges,
        logs: simulation.logs || [],
        events: this.decodeEvents(simulation.logs || []),
        error: simulation.error_message
          ? {
              message: simulation.error_message,
              reason: simulation.error_info?.error_message || 'Unknown',
            }
          : undefined,
        risk,
      };
    } catch (error: any) {
      logger.error('Simulation error:', error.response?.data || error.message);
      throw new Error('Transaction simulation failed');
    }
  }

  // Simulate bundle of transactions
  async simulateBundle(txs: SimulationRequest[]): Promise<SimulationResult[]> {
    const results = await Promise.all(
      txs.map((tx) => this.simulate(tx))
    );
    return results;
  }

  // Fork simulation (simulate against current state)
  async forkSimulate(tx: SimulationRequest): Promise<SimulationResult> {
    try {
      // Get latest block
      const block = await this.provider.getBlock('latest');

      const response = await axios.post(
        `${TENDERLY_API}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
        {
          network_id: tx.chainId?.toString() || '1',
          block_number: block?.number,
          from: tx.from,
          to: tx.to,
          input: tx.data || '0x',
          value: tx.value || '0',
          simulation_type: 'full',
          save: false,
        },
        {
          headers: {
            'X-Access-Key': TENDERLY_ACCESS_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.simulate(tx); // Parse same way
    } catch (error) {
      logger.error('Fork simulation error:', error);
      throw new Error('Fork simulation failed');
    }
  }

  // Estimate gas with simulation
  async estimateGas(tx: SimulationRequest): Promise<string> {
    const result = await this.simulate(tx);
    return result.gasUsed;
  }

  // Extract balance changes from simulation
  private extractBalanceChanges(simulation: any): BalanceChange[] {
    const changes: BalanceChange[] = [];

    if (!simulation.asset_changes) return changes;

    for (const change of simulation.asset_changes) {
      changes.push({
        address: change.address,
        token: change.token_info?.contract_address || null,
        before: change.raw_amount || '0',
        after: (BigInt(change.raw_amount || 0) + BigInt(change.amount || 0)).toString(),
        change: change.amount || '0',
      });
    }

    return changes;
  }

  // Extract state changes
  private extractStateChanges(simulation: any): StateChange[] {
    const changes: StateChange[] = [];

    if (!simulation.state_diff) return changes;

    for (const [address, diff] of Object.entries(simulation.state_diff)) {
      if ((diff as any).balance) {
        changes.push({
          address,
          before: (diff as any).balance.before,
          after: (diff as any).balance.after,
          type: 'balance',
        });
      }

      if ((diff as any).storage) {
        for (const [key, value] of Object.entries((diff as any).storage)) {
          changes.push({
            address,
            before: (value as any).before,
            after: (value as any).after,
            type: 'storage',
          });
        }
      }
    }

    return changes;
  }

  // Decode events from logs
  private decodeEvents(logs: Log[]): Event[] {
    // In production: Use ABI decoder (ethers.Interface)
    const events: Event[] = [];

    for (const log of logs) {
      try {
        // Common event signatures
        const eventSignatures: Record<string, string> = {
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
          '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
          '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65': 'Swap',
        };

        const eventName = eventSignatures[log.topics[0]] || 'Unknown';

        events.push({
          name: eventName,
          signature: log.topics[0],
          params: {}, // Decode params in production
        });
      } catch (error) {
        // Skip invalid logs
      }
    }

    return events;
  }

  // Assess transaction risk
  private assessRisk(
    simulation: any,
    balanceChanges: BalanceChange[]
  ): SimulationResult['risk'] {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if transaction fails
    if (!simulation.status) {
      level = 'critical';
      reasons.push('Transaction will fail');
    }

    // Check for large balance changes
    const largeChanges = balanceChanges.filter((change) => {
      const value = BigInt(change.change);
      return value > ethers.parseEther('1'); // > 1 ETH or token
    });

    if (largeChanges.length > 0) {
      level = level === 'low' ? 'medium' : level;
      warnings.push(`Large balance change detected (${largeChanges.length} tokens)`);
    }

    // Check for unusual state changes
    if (simulation.state_diff && Object.keys(simulation.state_diff).length > 10) {
      level = level === 'low' ? 'medium' : level;
      warnings.push('Many state changes detected');
    }

    // Check for call to unknown contracts
    if (simulation.calls) {
      const unknownCalls = simulation.calls.filter((call: any) => !call.to_verified);
      if (unknownCalls.length > 0) {
        level = level === 'low' ? 'medium' : level;
        warnings.push('Calls to unverified contracts');
      }
    }

    // Check for approval events (unlimited approvals)
    const approvalEvents = simulation.logs?.filter(
      (log: any) =>
        log.topics[0] === '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
    );

    if (approvalEvents && approvalEvents.length > 0) {
      warnings.push('Token approval detected');
    }

    return {
      level,
      reasons,
      warnings,
    };
  }
}

// Blocknative alternative (for gas estimation)
export class BlocknativeSimulator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async simulate(tx: SimulationRequest): Promise<SimulationResult> {
    try {
      const response = await axios.post(
        'https://api.blocknative.com/simulate',
        {
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Transform Blocknative response to our format
      return {
        success: response.data.status === 1,
        gasUsed: response.data.gasUsed,
        gasPrice: response.data.gasPrice,
        blockNumber: response.data.blockNumber,
        stateChanges: [],
        balanceChanges: [],
        logs: [],
        events: [],
        risk: {
          level: 'low',
          reasons: [],
          warnings: [],
        },
      };
    } catch (error) {
      logger.error('Blocknative simulation error:', error);
      throw new Error('Simulation failed');
    }
  }
}

// Export singleton
export const transactionSimulator = new TransactionSimulator(
  process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
);
