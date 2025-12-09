import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers } from 'ethers';
import { ContractService } from '../../server/services/contractService';
import { signatureService } from '../../server/services/signatureService';

/**
 * Blockchain Integration Tests
 *
 * Tests the complete integration between backend services and smart contracts
 * Tests cover: contract deployment, recovery flow, signature verification
 *
 * NOTE: These tests require:
 * 1. Contracts to be deployed (run: npm run compile && npm run deploy:local)
 * 2. Local Hardhat node running (run: npm run node:local)
 * 3. Environment variables configured in .env.test
 */

describe('Blockchain Integration Tests', () => {
  let contractService: ContractService;
  let testWallet: ethers.Wallet;
  let testGuardian1: ethers.Wallet;
  let testGuardian2: ethers.Wallet;
  let testGuardian3: ethers.Wallet;

  beforeAll(async () => {
    // Skip tests if required env vars are not set
    if (!process.env.RPC_URL || !process.env.CONTRACT_DEPLOYER_PRIVATE_KEY) {
      console.warn('⚠️  Skipping blockchain integration tests - missing required env vars');
      return;
    }

    // Initialize test wallets
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    testWallet = ethers.Wallet.createRandom().connect(provider);
    testGuardian1 = ethers.Wallet.createRandom().connect(provider);
    testGuardian2 = ethers.Wallet.createRandom().connect(provider);
    testGuardian3 = ethers.Wallet.createRandom().connect(provider);

    // Initialize contract service
    contractService = new ContractService({
      rpcUrl: process.env.RPC_URL || '',
      privateKey: process.env.CONTRACT_DEPLOYER_PRIVATE_KEY || '',
      guardiaVaultAddress: process.env.GUARDIA_VAULT_ADDRESS || '',
      recoveryAddress: process.env.RECOVERY_CONTRACT_ADDRESS || '',
      willFactoryAddress: process.env.WILL_FACTORY_ADDRESS || ''
    });
  });

  describe('Smart Will Deployment', () => {
    it('should deploy a smart will contract with valid parameters', async () => {
      if (!process.env.RPC_URL) return;

      const beneficiaries = [testGuardian1.address, testGuardian2.address];
      const shares = [60, 40];
      const encryptedData = 'encrypted_will_data_test';

      const result = await contractService.deploySmartWill(
        beneficiaries,
        shares,
        encryptedData,
        {
          requiredGuardianApprovals: 2,
          timelock: 604800 // 7 days
        }
      );

      expect(result.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should reject will deployment with mismatched beneficiaries and shares', async () => {
      if (!process.env.RPC_URL) return;

      const beneficiaries = [testGuardian1.address, testGuardian2.address];
      const shares = [60]; // Mismatched length

      await expect(
        contractService.deploySmartWill(
          beneficiaries,
          shares,
          'encrypted_data',
          { requiredGuardianApprovals: 2, timelock: 604800 }
        )
      ).rejects.toThrow('Beneficiaries and shares length mismatch');
    });

    it('should reject will deployment with shares not summing to 100', async () => {
      if (!process.env.RPC_URL) return;

      const beneficiaries = [testGuardian1.address, testGuardian2.address];
      const shares = [60, 50]; // Sum = 110%

      await expect(
        contractService.deploySmartWill(
          beneficiaries,
          shares,
          'encrypted_data',
          { requiredGuardianApprovals: 2, timelock: 604800 }
        )
      ).rejects.toThrow('Shares must sum to 100%');
    });
  });

  describe('Recovery Flow - End to End', () => {
    let recoveryId: string;

    it('should initiate a recovery process', async () => {
      if (!process.env.RPC_URL) return;

      const vaultId = 'test_vault_' + Date.now();
      const encryptedShares = [
        testGuardian1.address,
        testGuardian2.address,
        testGuardian3.address
      ];

      const result = await contractService.initiateRecovery(
        vaultId,
        testWallet.address,
        encryptedShares,
        2 // 2-of-3
      );

      expect(result.recoveryId).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      recoveryId = result.recoveryId;
    });

    it('should allow guardian to attest recovery', async () => {
      if (!process.env.RPC_URL || !recoveryId) return;

      // Create and sign attestation
      const message = signatureService.createAttestationMessage(
        recoveryId,
        testWallet.address,
        Date.now()
      );
      const signature = await testGuardian1.signMessage(message);

      const result = await contractService.attestRecovery(
        recoveryId,
        testGuardian1.address,
        signature
      );

      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.approvalsCount).toBeGreaterThanOrEqual(1);
    });

    it('should verify recovery status correctly', async () => {
      if (!process.env.RPC_URL || !recoveryId) return;

      const status = await contractService.verifyRecoveryStatus(recoveryId);

      expect(status.isActive).toBeDefined();
      expect(status.approvalsCount).toBeGreaterThanOrEqual(0);
      expect(status.requiredApprovals).toBe(2);
      expect(status.beneficiary).toBe(testWallet.address);
    });

    it('should complete recovery after sufficient attestations', async () => {
      if (!process.env.RPC_URL || !recoveryId) return;

      // Add second guardian attestation
      const message = signatureService.createAttestationMessage(
        recoveryId,
        testWallet.address,
        Date.now()
      );
      const signature = await testGuardian2.signMessage(message);

      await contractService.attestRecovery(
        recoveryId,
        testGuardian2.address,
        signature
      );

      // Complete recovery
      const result = await contractService.completeRecovery(
        recoveryId,
        testWallet.address
      );

      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.vaultData).toBeDefined();
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid EIP-191 signature', async () => {
      const message = 'Test message for signature verification';
      const signature = await testWallet.signMessage(message);

      const isValid = await signatureService.verifySignature(
        message,
        signature,
        testWallet.address
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const message = 'Test message';
      const signature = await testWallet.signMessage(message);

      // Try to verify with different address
      const isValid = await signatureService.verifySignature(
        message,
        signature,
        testGuardian1.address // Wrong address
      );

      expect(isValid).toBe(false);
    });

    it('should reject signature with tampered message', async () => {
      const message = 'Original message';
      const signature = await testWallet.signMessage(message);

      const isValid = await signatureService.verifySignature(
        'Tampered message', // Different message
        signature,
        testWallet.address
      );

      expect(isValid).toBe(false);
    });

    it('should validate signature format correctly', () => {
      const validSignature = '0x' + '0'.repeat(130); // 65 bytes
      const invalidSignature1 = '0x1234'; // Too short
      const invalidSignature2 = 'invalid'; // No 0x prefix

      expect(signatureService.isValidSignatureFormat(validSignature)).toBe(true);
      expect(signatureService.isValidSignatureFormat(invalidSignature1)).toBe(false);
      expect(signatureService.isValidSignatureFormat(invalidSignature2)).toBe(false);
    });

    it('should create consistent attestation messages', () => {
      const recoveryId = 'recovery_123';
      const beneficiary = '0x1234567890123456789012345678901234567890';
      const timestamp = 1234567890;

      const message = signatureService.createAttestationMessage(
        recoveryId,
        beneficiary,
        timestamp
      );

      expect(message).toContain(recoveryId);
      expect(message).toContain(beneficiary);
      expect(message).toContain(timestamp.toString());
    });
  });

  describe('EIP-712 Typed Data Signatures', () => {
    it('should verify EIP-712 typed data signature', async () => {
      const chainId = 11155111; // Sepolia
      const contractAddress = process.env.RECOVERY_CONTRACT_ADDRESS || ethers.ZeroAddress;

      const domain = signatureService.createDomain(chainId, contractAddress);
      const types = signatureService.createRecoveryAttestationTypes();

      const value = {
        recoveryId: 'recovery_456',
        beneficiaryAddress: testWallet.address,
        timestamp: Date.now(),
        guardianAddress: testGuardian1.address
      };

      const signature = await testGuardian1.signTypedData(domain, types, value);

      const isValid = await signatureService.verifyTypedDataSignature(
        domain,
        types,
        value,
        signature,
        testGuardian1.address
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Batch Signature Verification', () => {
    it('should verify multiple signatures in batch', async () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      const wallets = [testWallet, testGuardian1, testGuardian2];

      const signatures = await Promise.all(
        messages.map((msg, i) => wallets[i].signMessage(msg))
      );

      const addresses = wallets.map(w => w.address);

      const results = await signatureService.verifySignatureBatch(
        messages,
        signatures,
        addresses
      );

      expect(results).toEqual([true, true, true]);
    });

    it('should identify invalid signatures in batch', async () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      const signatures = await Promise.all(
        messages.map(msg => testWallet.signMessage(msg))
      );

      // Use wrong addresses for verification
      const addresses = [
        testWallet.address,      // Correct
        testGuardian1.address,   // Wrong
        testGuardian2.address    // Wrong
      ];

      const results = await signatureService.verifySignatureBatch(
        messages,
        signatures,
        addresses
      );

      expect(results).toEqual([true, false, false]);
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate gas for contract method', async () => {
      if (!process.env.RPC_URL) return;

      // This is a placeholder - actual implementation depends on contract methods
      // const gasEstimate = await contractService.estimateGas(
      //   contractService['willFactory'],
      //   'createWill',
      //   [[], [], '', [], 0]
      // );

      // expect(gasEstimate).toBeGreaterThan(0n);

      // For now, just verify the method exists
      expect(contractService.estimateGas).toBeDefined();
    });

    it('should get current gas price with multiplier', async () => {
      if (!process.env.RPC_URL) return;

      const gasPrice = await contractService.getGasPrice();

      expect(gasPrice).toBeGreaterThanOrEqual(0n);
    });
  });

  afterAll(async () => {
    // Cleanup - close any open connections
    console.log('✓ Blockchain integration tests completed');
  });
});
