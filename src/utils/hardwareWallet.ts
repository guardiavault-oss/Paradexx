/**
 * Hardware Wallet Integration - Ledger & Trezor support
 * 
 * Real SDK implementations using:
 * - @ledgerhq/hw-transport-webusb + @ledgerhq/hw-app-eth for Ledger
 * - @trezor/connect-web for Trezor
 */

import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import type Transport from '@ledgerhq/hw-transport';
import Eth from '@ledgerhq/hw-app-eth';
import TrezorConnect, { DEVICE_EVENT, DEVICE } from '@trezor/connect-web';
import { logger } from '../services/logger.service';

export type HardwareWalletType = 'ledger' | 'trezor';

export interface HardwareWalletInfo {
  type: HardwareWalletType;
  connected: boolean;
  model?: string;
  firmwareVersion?: string;
  addresses: string[];
  currentPath: string;
}

export interface DerivationPath {
  path: string;
  label: string;
  description: string;
}

// Common derivation paths
export const DERIVATION_PATHS: DerivationPath[] = [
  {
    path: "m/44'/60'/0'/0",
    label: "Ethereum (Default)",
    description: "Standard Ethereum path (MetaMask, Ledger Live)"
  },
  {
    path: "m/44'/60'/0'",
    label: "Ethereum (Legacy)",
    description: "Legacy path used by older wallets"
  },
  {
    path: "m/44'/60'/0'/0/0",
    label: "Ethereum (First Account)",
    description: "First account on default path"
  },
  {
    path: "m/44'/60'/1'/0/0",
    label: "Ethereum (Second Account)",
    description: "Second account"
  }
];

// Ledger Transport - Real implementation using @ledgerhq/hw-transport-webusb
class LedgerTransport {
  private transport: Transport | null = null;
  private eth: Eth | null = null;
  private _connected = false;

  async connect(): Promise<boolean> {
    try {
      logger.info('Connecting to Ledger device via WebUSB...');
      this.transport = await TransportWebUSB.create();
      this.eth = new Eth(this.transport);
      const appConfig = await this.eth.getAppConfiguration();
      logger.info(`Ledger connected - Ethereum app version: ${appConfig.version}`);
      this._connected = true;
      return true;
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      logger.error('Failed to connect to Ledger:', err);
      this._connected = false;
      if (err.message?.includes('No device selected')) {
        throw new Error('No Ledger device selected. Please connect your Ledger and try again.');
      }
      if (err.message?.includes('access denied') || err.statusCode === 27404) {
        throw new Error('Ethereum app not open on Ledger. Please open the Ethereum app and try again.');
      }
      if (err.message?.includes('locked')) {
        throw new Error('Ledger device is locked. Please unlock it with your PIN.');
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.eth = null;
    }
    this._connected = false;
    logger.info('Ledger disconnected');
  }

  get connected(): boolean {
    return this._connected;
  }

  async getAddress(path: string, display = false): Promise<string> {
    if (!this.eth || !this._connected) {
      throw new Error('Ledger not connected');
    }
    try {
      logger.info(`Ledger: Getting address for path ${path}${display ? ' (confirm on device)' : ''}`);
      const result = await this.eth.getAddress(path, display, false);
      return result.address;
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      logger.error('Failed to get address from Ledger:', err);
      if (err.statusCode === 27013) {
        throw new Error('User rejected the address display on Ledger');
      }
      throw error;
    }
  }

  async signTransaction(path: string, rawTxHex: string): Promise<{ v: string; r: string; s: string }> {
    if (!this.eth || !this._connected) {
      throw new Error('Ledger not connected');
    }
    try {
      logger.info('Ledger: Please confirm transaction on device...');
      const signature = await this.eth.signTransaction(path, rawTxHex);
      logger.info('Ledger: Transaction signed successfully');
      return { v: signature.v, r: signature.r, s: signature.s };
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      logger.error('Failed to sign transaction on Ledger:', err);
      if (err.statusCode === 27013) {
        throw new Error('User rejected the transaction on Ledger');
      }
      if (err.statusCode === 27264) {
        throw new Error('Transaction data too large for Ledger. Try enabling blind signing.');
      }
      throw error;
    }
  }

  async signMessage(path: string, message: string): Promise<{ v: number; r: string; s: string }> {
    if (!this.eth || !this._connected) {
      throw new Error('Ledger not connected');
    }
    try {
      logger.info('Ledger: Please confirm message signature on device...');
      const messageHex = Buffer.from(message).toString('hex');
      const signature = await this.eth.signPersonalMessage(path, messageHex);
      logger.info('Ledger: Message signed successfully');
      return { v: signature.v, r: signature.r, s: signature.s };
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      logger.error('Failed to sign message on Ledger:', err);
      if (err.statusCode === 27013) {
        throw new Error('User rejected the message signature on Ledger');
      }
      throw error;
    }
  }

  async signTypedData(path: string, domainSeparatorHex: string, structHashHex: string): Promise<{ v: number; r: string; s: string }> {
    if (!this.eth || !this._connected) {
      throw new Error('Ledger not connected');
    }
    try {
      logger.info('Ledger: Please confirm typed data signature on device...');
      const signature = await this.eth.signEIP712HashedMessage(path, domainSeparatorHex, structHashHex);
      logger.info('Ledger: Typed data signed successfully');
      return { v: signature.v, r: signature.r, s: signature.s };
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      logger.error('Failed to sign typed data on Ledger:', err);
      if (err.statusCode === 27013) {
        throw new Error('User rejected the typed data signature on Ledger');
      }
      throw error;
    }
  }

  async getAppConfiguration(): Promise<{ version: string; arbitraryDataEnabled: number; erc20ProvisioningNecessary: number }> {
    if (!this.eth || !this._connected) {
      throw new Error('Ledger not connected');
    }
    return await this.eth.getAppConfiguration();
  }
}

// Trezor Connect - Real implementation using @trezor/connect-web
class TrezorConnectWrapper {
  private _connected = false;
  private _initialized = false;
  private deviceId: string | null = null;

  async init(): Promise<void> {
    if (this._initialized) return;
    try {
      logger.info('Initializing Trezor Connect...');
      await TrezorConnect.init({
        lazyLoad: false,
        manifest: {
          email: 'support@paradex.io',
          appUrl: globalThis.window?.location?.origin ?? 'https://paradex.io',
          appName: 'Paradex Wallet',
        },
        popup: true,
        debug: process.env.NODE_ENV === 'development',
      });
      TrezorConnect.on(DEVICE_EVENT, (event) => {
        if (event.type === DEVICE.CONNECT) {
          logger.info('Trezor device connected:', event.payload.label);
          this._connected = true;
          this.deviceId = event.payload.id ?? null;
        } else if (event.type === DEVICE.DISCONNECT) {
          logger.info('Trezor device disconnected');
          this._connected = false;
          this.deviceId = null;
        }
      });
      this._initialized = true;
      logger.info('Trezor Connect initialized');
    } catch (error) {
      logger.error('Failed to initialize Trezor Connect:', error);
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    await this.init();
    try {
      logger.info('Connecting to Trezor device...');
      const result = await TrezorConnect.getFeatures();
      if (!result.success) {
        throw new Error(result.payload.error || 'Failed to connect to Trezor');
      }
      this._connected = true;
      this.deviceId = result.payload.device_id ?? null;
      logger.info(`Trezor connected - Model: ${result.payload.model}, FW: ${result.payload.major_version}.${result.payload.minor_version}.${result.payload.patch_version}`);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to connect to Trezor:', err);
      this._connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.deviceId = null;
    logger.info('Trezor session ended');
  }

  get connected(): boolean {
    return this._connected;
  }

  async getAddress(path: string, display = false): Promise<string> {
    await this.init();
    try {
      logger.info(`Trezor: Getting address for path ${path}`);
      const result = await TrezorConnect.ethereumGetAddress({ path, showOnTrezor: display });
      if (!result.success) {
        throw new Error(result.payload.error || 'Failed to get address from Trezor');
      }
      this._connected = true;
      return result.payload.address;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to get address from Trezor:', err);
      if (err.message?.includes('cancelled') || err.message?.includes('Cancelled')) {
        throw new Error('User cancelled the operation on Trezor');
      }
      throw error;
    }
  }

  async signTransaction(path: string, txData: {
    to: string;
    value: string;
    gasPrice?: string;
    gasLimit: string;
    nonce: string;
    data?: string;
    chainId: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  }): Promise<{ v: string; r: string; s: string }> {
    await this.init();
    try {
      logger.info('Trezor: Please confirm transaction on device...');
      const isEIP1559 = !!txData.maxFeePerGas;
      const result = await TrezorConnect.ethereumSignTransaction({
        path,
        transaction: {
          to: txData.to,
          value: txData.value,
          gasLimit: txData.gasLimit,
          nonce: txData.nonce,
          data: txData.data || '0x',
          chainId: txData.chainId,
          ...(isEIP1559 ? { maxFeePerGas: txData.maxFeePerGas!, maxPriorityFeePerGas: txData.maxPriorityFeePerGas! } : { gasPrice: txData.gasPrice! }),
        },
      });
      if (!result.success) {
        throw new Error(result.payload.error || 'Failed to sign transaction on Trezor');
      }
      logger.info('Trezor: Transaction signed successfully');
      return { v: result.payload.v, r: result.payload.r, s: result.payload.s };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to sign transaction on Trezor:', err);
      if (err.message?.includes('cancelled') || err.message?.includes('Cancelled')) {
        throw new Error('User rejected the transaction on Trezor');
      }
      throw error;
    }
  }

  async signMessage(path: string, message: string): Promise<{ address: string; signature: string }> {
    await this.init();
    try {
      logger.info('Trezor: Please confirm message signature on device...');
      const result = await TrezorConnect.ethereumSignMessage({ path, message, hex: false });
      if (!result.success) {
        throw new Error(result.payload.error || 'Failed to sign message on Trezor');
      }
      logger.info('Trezor: Message signed successfully');
      return { address: result.payload.address, signature: result.payload.signature };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to sign message on Trezor:', err);
      if (err.message?.includes('cancelled') || err.message?.includes('Cancelled')) {
        throw new Error('User rejected the message signature on Trezor');
      }
      throw error;
    }
  }

  async signTypedData(path: string, data: unknown, metamaskV4Compat = true): Promise<{ address: string; signature: string }> {
    await this.init();
    try {
      logger.info('Trezor: Please confirm typed data signature on device...');
      const result = await TrezorConnect.ethereumSignTypedData({
        path,
        data: data as Parameters<typeof TrezorConnect.ethereumSignTypedData>[0]['data'],
        metamask_v4_compat: metamaskV4Compat,
      });
      if (!result.success) {
        throw new Error(result.payload.error || 'Failed to sign typed data on Trezor');
      }
      logger.info('Trezor: Typed data signed successfully');
      return { address: result.payload.address, signature: result.payload.signature };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to sign typed data on Trezor:', err);
      if (err.message?.includes('cancelled') || err.message?.includes('Cancelled')) {
        throw new Error('User rejected the typed data signature on Trezor');
      }
      throw error;
    }
  }

  async getFeatures(): Promise<{ model: string; major_version: number; minor_version: number; patch_version: number; device_id: string | null }> {
    await this.init();
    const result = await TrezorConnect.getFeatures();
    if (!result.success) {
      throw new Error(result.payload.error || 'Failed to get Trezor features');
    }
    return result.payload;
  }
}

// Hardware Wallet Manager
export class HardwareWalletManager {
  private ledger: LedgerTransport | null = null;
  private trezor: TrezorConnectWrapper | null = null;
  private currentType: HardwareWalletType | null = null;
  private currentPath: string = DERIVATION_PATHS[0].path;
  private cachedAddresses: string[] = [];

  // Connect to hardware wallet
  async connect(type: HardwareWalletType): Promise<HardwareWalletInfo> {
    try {
      // Disconnect existing connection first
      await this.disconnect();

      if (type === 'ledger') {
        this.ledger = new LedgerTransport();
        await this.ledger.connect();
        this.currentType = 'ledger';
        const config = await this.ledger.getAppConfiguration();
        const address = await this.ledger.getAddress(this.currentPath + '/0');
        this.cachedAddresses = [address];
        return {
          type,
          connected: true,
          model: 'Ledger Device',
          firmwareVersion: config.version,
          addresses: this.cachedAddresses,
          currentPath: this.currentPath,
        };
      } else {
        this.trezor = new TrezorConnectWrapper();
        await this.trezor.connect();
        this.currentType = 'trezor';
        const features = await this.trezor.getFeatures();
        const address = await this.trezor.getAddress(this.currentPath + '/0');
        this.cachedAddresses = [address];
        return {
          type,
          connected: true,
          model: features.model || 'Trezor',
          firmwareVersion: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
          addresses: this.cachedAddresses,
          currentPath: this.currentPath,
        };
      }
    } catch (err: unknown) {
      this.currentType = null;
      const error = err as Error;
      throw new Error(`Failed to connect to ${type}: ${error.message}`);
    }
  }

  // Disconnect
  async disconnect(): Promise<void> {
    if (this.ledger) {
      await this.ledger.disconnect();
      this.ledger = null;
    }
    if (this.trezor) {
      await this.trezor.disconnect();
      this.trezor = null;
    }
    this.currentType = null;
    this.cachedAddresses = [];
  }

  // Check if connected
  isConnected(): boolean {
    if (this.currentType === 'ledger' && this.ledger) {
      return this.ledger.connected;
    }
    if (this.currentType === 'trezor' && this.trezor) {
      return this.trezor.connected;
    }
    return false;
  }
  
  // Get address for path
  async getAddress(path: string, display = false): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }

    if (this.currentType === 'ledger' && this.ledger) {
      return await this.ledger.getAddress(path, display);
    } else if (this.currentType === 'trezor' && this.trezor) {
      return await this.trezor.getAddress(path, display);
    }

    throw new Error('Hardware wallet not initialized');
  }

  // Get multiple addresses
  async getAddresses(basePath: string, count = 5, startIndex = 0): Promise<string[]> {
    const addresses: string[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const path = `${basePath}/${i}`;
      const address = await this.getAddress(path);
      addresses.push(address);
    }

    this.cachedAddresses = [...new Set([...this.cachedAddresses, ...addresses])];
    return addresses;
  }

  // Sign transaction
  async signTransaction(txData: string | Record<string, unknown>): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }

    if (this.currentType === 'ledger' && this.ledger) {
      const rawTxHex = typeof txData === 'string' ? txData : JSON.stringify(txData);
      const signature = await this.ledger.signTransaction(this.currentPath + '/0', rawTxHex);
      return '0x' + signature.r + signature.s + signature.v;
    } else if (this.currentType === 'trezor' && this.trezor) {
      const tx = txData as {
        to: string;
        value: string;
        gasPrice?: string;
        gasLimit: string;
        nonce: string;
        data?: string;
        chainId: number;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
      };
      const signature = await this.trezor.signTransaction(this.currentPath + '/0', tx);
      return '0x' + signature.r.slice(2) + signature.s.slice(2) + signature.v.slice(2);
    }

    throw new Error('Hardware wallet not initialized');
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }

    if (this.currentType === 'ledger' && this.ledger) {
      const signature = await this.ledger.signMessage(this.currentPath + '/0', message);
      const v = signature.v.toString(16).padStart(2, '0');
      return '0x' + signature.r + signature.s + v;
    } else if (this.currentType === 'trezor' && this.trezor) {
      const result = await this.trezor.signMessage(this.currentPath + '/0', message);
      return result.signature;
    }

    throw new Error('Hardware wallet not initialized');
  }

  // Sign typed data (EIP-712)
  async signTypedData(typedData: unknown): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }

    if (this.currentType === 'ledger') {
      throw new Error('EIP-712 signing on Ledger requires pre-computed hashes. Use signTypedDataHashed() instead.');
    } else if (this.currentType === 'trezor' && this.trezor) {
      const result = await this.trezor.signTypedData(this.currentPath + '/0', typedData);
      return result.signature;
    }

    throw new Error('Hardware wallet not initialized');
  }

  // Sign typed data with pre-computed hashes (for Ledger)
  async signTypedDataHashed(domainSeparatorHex: string, structHashHex: string): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }

    if (this.currentType === 'ledger' && this.ledger) {
      const signature = await this.ledger.signTypedData(this.currentPath + '/0', domainSeparatorHex, structHashHex);
      const v = signature.v.toString(16).padStart(2, '0');
      return '0x' + signature.r + signature.s + v;
    }

    throw new Error('Use signTypedData() for Trezor devices');
  }

  // Set derivation path
  setPath(path: string): void {
    this.currentPath = path;
  }

  // Get current path
  getPath(): string {
    return this.currentPath;
  }

  // Get current info
  getInfo(): HardwareWalletInfo | null {
    if (!this.currentType) return null;

    return {
      type: this.currentType,
      connected: this.isConnected(),
      addresses: this.cachedAddresses,
      currentPath: this.currentPath
    };
  }

  // Get current type
  getType(): HardwareWalletType | null {
    return this.currentType;
  }
}

// Singleton instance
export const hardwareWallet = new HardwareWalletManager();

// Check if hardware wallet is supported
export function isHardwareWalletSupported(): boolean {
  const hasWebUSB = typeof navigator !== 'undefined' && 'usb' in navigator;
  const hasTrezor = globalThis.window !== undefined;
  return hasWebUSB || hasTrezor;
}

export function isLedgerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export function isTrezorSupported(): boolean {
  return globalThis.window !== undefined;
}

// Get hardware wallet connection instructions
export function getConnectionInstructions(type: HardwareWalletType): string[] {
  if (type === 'ledger') {
    return [
      '1. Connect your Ledger device via USB',
      '2. Enter your PIN on the device',
      '3. Open the Ethereum app on your Ledger',
      '4. Make sure "Blind signing" is enabled in app settings',
      '5. Click "Connect Ledger" below'
    ];
  } else {
    return [
      '1. Connect your Trezor device via USB',
      '2. A popup window will appear from Trezor',
      '3. Enter your PIN on the Trezor website popup',
      '4. Follow the instructions on your Trezor device',
      '5. Grant permission when prompted'
    ];
  }
}

// Hardware wallet errors
export class HardwareWalletError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_CONNECTED'
      | 'USER_REJECTED'
      | 'DEVICE_LOCKED'
      | 'APP_NOT_OPEN'
      | 'TIMEOUT'
      | 'BLIND_SIGNING_DISABLED'
      | 'UNSUPPORTED_OPERATION'
      | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'HardwareWalletError';
  }
}

export function parseHardwareWalletError(err: unknown): HardwareWalletError {
  const error = err as Error;
  const message = error.message || 'Unknown error';

  if (message.includes('not connected') || message.includes('No device')) {
    return new HardwareWalletError('Device not connected', 'NOT_CONNECTED');
  }

  if (message.includes('rejected') || message.includes('denied') || message.includes('cancelled') || message.includes('Cancelled')) {
    return new HardwareWalletError('User rejected action', 'USER_REJECTED');
  }

  if (message.includes('locked')) {
    return new HardwareWalletError('Device is locked', 'DEVICE_LOCKED');
  }

  if (message.includes('app not open') || message.includes('27404')) {
    return new HardwareWalletError('Ethereum app not open on device', 'APP_NOT_OPEN');
  }

  if (message.includes('timeout')) {
    return new HardwareWalletError('Connection timeout', 'TIMEOUT');
  }

  if (message.includes('blind signing') || message.includes('27264')) {
    return new HardwareWalletError('Please enable blind signing in Ledger Ethereum app settings', 'BLIND_SIGNING_DISABLED');
  }

  return new HardwareWalletError(message, 'UNKNOWN');
}

// Utility to format signature for ethers.js
export function formatSignature(v: number | string, r: string, s: string): string {
  const vHex = typeof v === 'number' ? v.toString(16).padStart(2, '0') : v.replace('0x', '');
  const rClean = r.replace('0x', '');
  const sClean = s.replace('0x', '');
  return '0x' + rClean + sClean + vHex;
}
