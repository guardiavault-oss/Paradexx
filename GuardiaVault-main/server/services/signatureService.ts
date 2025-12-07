import { ethers } from 'ethers';
import { logInfo, logError } from './logger';

export class SignatureService {
  /**
   * Verify EIP-191 signature (standard Ethereum message signing)
   */
  async verifySignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      // Recover signer address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      // Compare addresses (case-insensitive)
      const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

      logInfo('Signature verification', {
        isValid,
        recoveredAddress,
        expectedAddress
      });

      return isValid;
    } catch (error: any) {
      logError(error, { context: 'verifySignature' });
      return false;
    }
  }

  /**
   * Verify EIP-712 typed data signature (for structured guardian attestations)
   */
  async verifyTypedDataSignature(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyTypedData(
        domain,
        types,
        value,
        signature
      );

      const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

      logInfo('Typed data signature verification', {
        isValid,
        recoveredAddress,
        expectedAddress
      });

      return isValid;
    } catch (error: any) {
      logError(error, { context: 'verifyTypedDataSignature' });
      return false;
    }
  }

  /**
   * Create attestation message for guardian to sign
   */
  createAttestationMessage(
    recoveryId: string,
    beneficiaryAddress: string,
    timestamp: number
  ): string {
    return `I attest to recovery ${recoveryId} for beneficiary ${beneficiaryAddress} at ${timestamp}`;
  }

  /**
   * Create EIP-712 domain for GuardiaVault
   */
  createDomain(chainId: number, contractAddress: string): ethers.TypedDataDomain {
    return {
      name: 'GuardiaVault',
      version: '1',
      chainId,
      verifyingContract: contractAddress
    };
  }

  /**
   * Create EIP-712 types for recovery attestation
   */
  createRecoveryAttestationTypes(): Record<string, ethers.TypedDataField[]> {
    return {
      RecoveryAttestation: [
        { name: 'recoveryId', type: 'string' },
        { name: 'beneficiaryAddress', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'guardianAddress', type: 'address' }
      ]
    };
  }

  /**
   * Hash a message using keccak256 (useful for on-chain verification)
   */
  hashMessage(message: string): string {
    return ethers.id(message);
  }

  /**
   * Verify signature matches expected format
   */
  isValidSignatureFormat(signature: string): boolean {
    try {
      // Check if signature is a valid hex string with proper length
      // Ethereum signatures are 65 bytes (130 hex chars + 0x prefix)
      if (!signature.startsWith('0x')) {
        return false;
      }

      const sigBytes = ethers.getBytes(signature);
      return sigBytes.length === 65;
    } catch (error) {
      return false;
    }
  }

  /**
   * Split signature into r, s, v components
   */
  splitSignature(signature: string): ethers.SignatureLike {
    try {
      return ethers.Signature.from(signature);
    } catch (error: any) {
      logError(error, { context: 'splitSignature' });
      throw new Error(`Invalid signature format: ${error.message}`);
    }
  }

  /**
   * Recover address from message hash and signature
   */
  recoverAddress(messageHash: string, signature: string): string {
    try {
      return ethers.recoverAddress(messageHash, signature);
    } catch (error: any) {
      logError(error, { context: 'recoverAddress' });
      throw new Error(`Failed to recover address: ${error.message}`);
    }
  }

  /**
   * Create a standardized guardian attestation message
   */
  createGuardianAttestationMessage(
    recoveryId: string,
    walletAddress: string,
    guardianEmail: string
  ): string {
    return `GuardiaVault Recovery Attestation\nRecovery ID: ${recoveryId}\nWallet: ${walletAddress}\nGuardian: ${guardianEmail}`;
  }

  /**
   * Verify multiple signatures in batch
   */
  async verifySignatureBatch(
    messages: string[],
    signatures: string[],
    expectedAddresses: string[]
  ): Promise<boolean[]> {
    if (messages.length !== signatures.length || messages.length !== expectedAddresses.length) {
      throw new Error('Input arrays must have the same length');
    }

    const results: boolean[] = [];

    for (let i = 0; i < messages.length; i++) {
      const isValid = await this.verifySignature(
        messages[i],
        signatures[i],
        expectedAddresses[i]
      );
      results.push(isValid);
    }

    return results;
  }

  /**
   * Generate a nonce for signature replay protection
   */
  generateNonce(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  /**
   * Create a message with nonce for replay protection
   */
  createNonceMessage(baseMessage: string, nonce: string): string {
    return `${baseMessage}\nNonce: ${nonce}`;
  }
}

// Export singleton instance
export const signatureService = new SignatureService();
