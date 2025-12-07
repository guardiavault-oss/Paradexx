// Rug Pull Detection Service - Honeypot detection, liquidity locks, contract analysis

import axios from 'axios';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';

const HONEYPOT_IS_API = 'https://api.honeypot.is/v2';
const GOPLUSLAB_API = 'https://api.gopluslabs.io/api/v1';

export interface RugCheckResult {
  isRugPull: boolean;
  riskScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  flags: RugFlag[];
  liquidityLocked: boolean;
  contractVerified: boolean;
  ownershipRenounced: boolean;
  recommendations: string[];
}

export interface RugFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string;
}

export interface TokenSafetyScore {
  score: number; // 0-100
  guardscore: number; // Guardian score for Discovery
  liquidity: number;
  holders: number;
  contractAge: number;
  buyTax: number;
  sellTax: number;
  isHoneypot: boolean;
  canBuy: boolean;
  canSell: boolean;
}

// GoPlus Security API integration
export class GoPlusSecurityService {
  private apiUrl = GOPLUSLAB_API;

  // Check token security
  async checkTokenSecurity(
    chainId: number,
    tokenAddress: string
  ): Promise<any> {
    try {
      const chainMap: Record<number, string> = {
        1: 'eth',
        56: 'bsc',
        137: 'polygon',
        42161: 'arbitrum',
        10: 'optimism',
      };

      const chain = chainMap[chainId] || 'eth';

      const response = await axios.get(
        `${this.apiUrl}/token_security/${chain}`,
        {
          params: {
            contract_addresses: tokenAddress.toLowerCase(),
          },
        }
      );

      const result = response.data.result[tokenAddress.toLowerCase()];
      return result || null;
    } catch (error) {
      logger.error('GoPlus API error:', error);
      return null;
    }
  }

  // Check NFT security
  async checkNftSecurity(
    chainId: number,
    contractAddress: string
  ): Promise<any> {
    try {
      const chainMap: Record<number, string> = {
        1: 'eth',
        56: 'bsc',
        137: 'polygon',
      };

      const chain = chainMap[chainId] || 'eth';

      const response = await axios.get(
        `${this.apiUrl}/nft_security/${chain}`,
        {
          params: {
            contract_addresses: contractAddress.toLowerCase(),
          },
        }
      );

      return response.data.result[contractAddress.toLowerCase()] || null;
    } catch (error) {
      logger.error('GoPlus NFT check error:', error);
      return null;
    }
  }

  // Check dApp security
  async checkDappSecurity(url: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/dapp_security`, {
        params: { url },
      });

      return response.data.result || null;
    } catch (error) {
      logger.error('GoPlus dApp check error:', error);
      return null;
    }
  }
}

// Honeypot.is API integration
export class HoneypotDetectionService {
  private apiUrl = HONEYPOT_IS_API;

  // Check if token is a honeypot
  async checkHoneypot(tokenAddress: string, chainId: number = 1): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/IsHoneypot`,
        {
          params: {
            address: tokenAddress,
            chainID: chainId,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Honeypot.is API error:', error);
      return null;
    }
  }
}

// Comprehensive rug pull detection
export class RugDetectionService {
  private goplus: GoPlusSecurityService;
  private honeypot: HoneypotDetectionService;

  constructor() {
    this.goplus = new GoPlusSecurityService();
    this.honeypot = new HoneypotDetectionService();
  }

  // Complete rug check
  async checkToken(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<RugCheckResult> {
    const flags: RugFlag[] = [];
    let riskScore = 0;

    // Get security data from multiple sources
    const [goplusData, honeypotData] = await Promise.all([
      this.goplus.checkTokenSecurity(chainId, tokenAddress),
      this.honeypot.checkHoneypot(tokenAddress, chainId),
    ]);

    // Analyze GoPlus data
    if (goplusData) {
      // Check if honeypot
      if (goplusData.is_honeypot === '1') {
        flags.push({
          type: 'honeypot',
          severity: 'critical',
          description: 'Token is a honeypot - cannot sell after buying',
        });
        riskScore += 50;
      }

      // Check buy/sell tax
      const buyTax = parseFloat(goplusData.buy_tax || '0');
      const sellTax = parseFloat(goplusData.sell_tax || '0');

      if (buyTax > 10 || sellTax > 10) {
        flags.push({
          type: 'high_tax',
          severity: 'high',
          description: `Suspicious taxes: Buy ${buyTax}%, Sell ${sellTax}%`,
        });
        riskScore += 20;
      }

      // Check if can sell
      if (goplusData.can_take_back_ownership === '1') {
        flags.push({
          type: 'ownership_takeback',
          severity: 'high',
          description: 'Owner can take back ownership',
        });
        riskScore += 15;
      }

      // Check hidden owner
      if (goplusData.hidden_owner === '1') {
        flags.push({
          type: 'hidden_owner',
          severity: 'high',
          description: 'Contract has hidden owner functions',
        });
        riskScore += 15;
      }

      // Check if owner can change balance
      if (goplusData.owner_change_balance === '1') {
        flags.push({
          type: 'balance_manipulation',
          severity: 'critical',
          description: 'Owner can change user balances',
        });
        riskScore += 30;
      }

      // Check trading cooldown
      if (goplusData.trading_cooldown === '1') {
        flags.push({
          type: 'trading_cooldown',
          severity: 'medium',
          description: 'Token has trading cooldown restrictions',
        });
        riskScore += 10;
      }

      // Check if ownership renounced
      if (goplusData.owner_address !== '0x0000000000000000000000000000000000000000') {
        flags.push({
          type: 'owner_not_renounced',
          severity: 'medium',
          description: 'Ownership not renounced',
          evidence: goplusData.owner_address,
        });
        riskScore += 10;
      }

      // Check liquidity
      const holderCount = parseInt(goplusData.holder_count || '0');
      if (holderCount < 100) {
        flags.push({
          type: 'low_holders',
          severity: 'medium',
          description: `Low holder count: ${holderCount}`,
        });
        riskScore += 10;
      }

      // Check contract verification
      if (goplusData.is_open_source !== '1') {
        flags.push({
          type: 'unverified_contract',
          severity: 'high',
          description: 'Contract source code not verified',
        });
        riskScore += 15;
      }

      // Check if proxy contract
      if (goplusData.is_proxy === '1') {
        flags.push({
          type: 'proxy_contract',
          severity: 'medium',
          description: 'Token uses proxy contract (logic can be changed)',
        });
        riskScore += 10;
      }
    }

    // Analyze Honeypot.is data
    if (honeypotData && honeypotData.honeypotResult) {
      if (honeypotData.honeypotResult.isHoneypot) {
        flags.push({
          type: 'honeypot_confirmed',
          severity: 'critical',
          description: 'Confirmed honeypot by multiple sources',
        });
        riskScore += 30;
      }
    }

    // Determine risk level
    let riskLevel: RugCheckResult['riskLevel'];
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    } else if (riskScore >= 10) {
      riskLevel = 'low';
    } else {
      riskLevel = 'safe';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('⛔ DO NOT BUY - High rug pull risk detected');
      recommendations.push('This token shows multiple red flags');
      recommendations.push('Consider reporting this token');
    } else if (riskLevel === 'medium') {
      recommendations.push('⚠️ Exercise extreme caution');
      recommendations.push('Only invest what you can afford to lose');
      recommendations.push('Monitor the token closely');
      recommendations.push('Set stop-loss orders');
    } else if (riskLevel === 'low') {
      recommendations.push('✓ Acceptable risk level');
      recommendations.push('Still do your own research');
      recommendations.push('Check liquidity before large purchases');
    } else {
      recommendations.push('✓ Token appears safe');
      recommendations.push('Low risk indicators detected');
    }

    return {
      isRugPull: riskLevel === 'critical' || riskLevel === 'high',
      riskScore,
      riskLevel,
      flags,
      liquidityLocked: goplusData?.lp_holder_count > 0 || false,
      contractVerified: goplusData?.is_open_source === '1' || false,
      ownershipRenounced:
        goplusData?.owner_address === '0x0000000000000000000000000000000000000000' ||
        false,
      recommendations,
    };
  }

  // Get token safety score (for Discovery feature)
  async getTokenSafetyScore(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<TokenSafetyScore> {
    const rugCheck = await this.checkToken(tokenAddress, chainId);
    const goplusData = await this.goplus.checkTokenSecurity(chainId, tokenAddress);

    // Calculate Guardian score (0-100)
    const guardscore = 100 - rugCheck.riskScore;

    return {
      score: guardscore,
      guardscore,
      liquidity: parseFloat(goplusData?.lp_total_supply || '0'),
      holders: parseInt(goplusData?.holder_count || '0'),
      contractAge: 0, // TODO: Calculate from creation timestamp
      buyTax: parseFloat(goplusData?.buy_tax || '0'),
      sellTax: parseFloat(goplusData?.sell_tax || '0'),
      isHoneypot: goplusData?.is_honeypot === '1',
      canBuy: goplusData?.is_honeypot !== '1',
      canSell: goplusData?.is_honeypot !== '1',
    };
  }

  // Batch check multiple tokens
  async checkMultipleTokens(
    tokens: Array<{ address: string; chainId: number }>
  ): Promise<Map<string, RugCheckResult>> {
    const results = new Map<string, RugCheckResult>();

    await Promise.all(
      tokens.map(async (token) => {
        const result = await this.checkToken(token.address, token.chainId);
        results.set(token.address, result);
      })
    );

    return results;
  }

  // Real-time monitoring (for active positions)
  async monitorToken(
    tokenAddress: string,
    chainId: number,
    callback: (alert: RugFlag) => void
  ): Promise<void> {
    // Check every 5 minutes
    setInterval(async () => {
      const result = await this.checkToken(tokenAddress, chainId);

      // Alert on new flags
      result.flags.forEach((flag) => {
        if (flag.severity === 'critical' || flag.severity === 'high') {
          callback(flag);
        }
      });
    }, 5 * 60 * 1000);
  }
}

// Export instances
export const rugDetection = new RugDetectionService();
export const goplusSecurity = new GoPlusSecurityService();
export const honeypotDetection = new HoneypotDetectionService();
