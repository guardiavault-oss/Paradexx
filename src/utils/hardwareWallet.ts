import { logger } from '../services/logger.service';
// Hardware Wallet Integration - Ledger & Trezor support

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

// Ledger Transport (mock - in production use @ledgerhq/hw-transport-webusb)
class LedgerTransport {
  private connected: boolean = false;
  
  async connect(): Promise<boolean> {
    // In production:
    // const transport = await TransportWebUSB.create();
    // const eth = new Eth(transport);
    
    logger.info('Connecting to Ledger...');
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connected = true;
    return true;
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  async getAddress(path: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Ledger not connected');
    }
    
    // In production:
    // const result = await eth.getAddress(path);
    // return result.address;
    
    // Mock address
    return '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  async signTransaction(path: string, txData: any): Promise<string> {
    if (!this.connected) {
      throw new Error('Ledger not connected');
    }
    
    // In production:
    // const signature = await eth.signTransaction(path, txData);
    // return signature;
    
    logger.info('Ledger: Please confirm transaction on device');
    
    // Simulate user confirmation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock signature
    return '0x' + Array(130).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  async signMessage(path: string, message: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Ledger not connected');
    }
    
    logger.info('Ledger: Please confirm message on device');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return '0x' + Array(130).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// Trezor Connect (mock - in production use @trezor/connect-web)
class TrezorConnect {
  private connected: boolean = false;
  
  async init(): Promise<void> {
    // In production:
    // await TrezorConnect.init({
    //   lazyLoad: true,
    //   manifest: {
    //     email: 'support@regenx.com',
    //     appUrl: 'https://regenx.com'
    //   }
    // });
    
    logger.info('Initializing Trezor Connect...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  async connect(): Promise<boolean> {
    await this.init();
    
    logger.info('Connecting to Trezor...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connected = true;
    return true;
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  async getAddress(path: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Trezor not connected');
    }
    
    // In production:
    // const result = await TrezorConnect.ethereumGetAddress({ path });
    // if (!result.success) throw new Error(result.payload.error);
    // return result.payload.address;
    
    return '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  async signTransaction(path: string, txData: any): Promise<string> {
    if (!this.connected) {
      throw new Error('Trezor not connected');
    }
    
    logger.info('Trezor: Please confirm transaction on device');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return '0x' + Array(130).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  async signMessage(path: string, message: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Trezor not connected');
    }
    
    logger.info('Trezor: Please confirm message on device');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return '0x' + Array(130).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// Hardware Wallet Manager
export class HardwareWalletManager {
  private ledger: LedgerTransport | null = null;
  private trezor: TrezorConnect | null = null;
  private currentType: HardwareWalletType | null = null;
  private currentPath: string = DERIVATION_PATHS[0].path;
  
  // Connect to hardware wallet
  async connect(type: HardwareWalletType): Promise<HardwareWalletInfo> {
    try {
      if (type === 'ledger') {
        this.ledger = new LedgerTransport();
        await this.ledger.connect();
        this.currentType = 'ledger';
      } else {
        this.trezor = new TrezorConnect();
        await this.trezor.connect();
        this.currentType = 'trezor';
      }
      
      // Get first address
      const address = await this.getAddress(this.currentPath);
      
      return {
        type,
        connected: true,
        model: type === 'ledger' ? 'Nano S Plus' : 'Model T',
        firmwareVersion: '2.1.0',
        addresses: [address],
        currentPath: this.currentPath
      };
    } catch (err: any) {
      throw new Error(`Failed to connect to ${type}: ${err.message}`);
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
  }
  
  // Get address for path
  async getAddress(path: string): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }
    
    if (this.currentType === 'ledger' && this.ledger) {
      return await this.ledger.getAddress(path);
    } else if (this.currentType === 'trezor' && this.trezor) {
      return await this.trezor.getAddress(path);
    }
    
    throw new Error('Hardware wallet not initialized');
  }
  
  // Get multiple addresses
  async getAddresses(basePath: string, count: number = 5): Promise<string[]> {
    const addresses: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const path = `${basePath}/${i}`;
      const address = await this.getAddress(path);
      addresses.push(address);
    }
    
    return addresses;
  }
  
  // Sign transaction
  async signTransaction(txData: any): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }
    
    if (this.currentType === 'ledger' && this.ledger) {
      return await this.ledger.signTransaction(this.currentPath, txData);
    } else if (this.currentType === 'trezor' && this.trezor) {
      return await this.trezor.signTransaction(this.currentPath, txData);
    }
    
    throw new Error('Hardware wallet not initialized');
  }
  
  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.currentType) {
      throw new Error('No hardware wallet connected');
    }
    
    if (this.currentType === 'ledger' && this.ledger) {
      return await this.ledger.signMessage(this.currentPath, message);
    } else if (this.currentType === 'trezor' && this.trezor) {
      return await this.trezor.signMessage(this.currentPath, message);
    }
    
    throw new Error('Hardware wallet not initialized');
  }
  
  // Set derivation path
  setPath(path: string): void {
    this.currentPath = path;
  }
  
  // Get current info
  getInfo(): HardwareWalletInfo | null {
    if (!this.currentType) return null;
    
    return {
      type: this.currentType,
      connected: true,
      addresses: [],
      currentPath: this.currentPath
    };
  }
}

// Singleton instance
export const hardwareWallet = new HardwareWalletManager();

// Check if hardware wallet is supported
export function isHardwareWalletSupported(): boolean {
  // Check for WebUSB support (Ledger)
  const hasWebUSB = 'usb' in navigator;
  
  // Trezor Connect works in all modern browsers
  const hasTrezor = true;
  
  return hasWebUSB || hasTrezor;
}

// Get hardware wallet connection instructions
export function getConnectionInstructions(type: HardwareWalletType): string[] {
  if (type === 'ledger') {
    return [
      '1. Connect your Ledger device via USB',
      '2. Enter your PIN on the device',
      '3. Open the Ethereum app on your Ledger',
      '4. Click "Connect Ledger" below'
    ];
  } else {
    return [
      '1. Connect your Trezor device via USB',
      '2. A popup window will appear',
      '3. Follow the instructions on your Trezor',
      '4. Grant permission in your browser'
    ];
  }
}

// Hardware wallet errors
export class HardwareWalletError extends Error {
  constructor(
    message: string,
    public code: 
      'NOT_CONNECTED' | 
      'USER_REJECTED' | 
      'DEVICE_LOCKED' | 
      'APP_NOT_OPEN' | 
      'TIMEOUT' |
      'UNKNOWN'
  ) {
    super(message);
    this.name = 'HardwareWalletError';
  }
}

export function parseHardwareWalletError(err: any): HardwareWalletError {
  const message = err.message || 'Unknown error';
  
  if (message.includes('not connected')) {
    return new HardwareWalletError('Device not connected', 'NOT_CONNECTED');
  }
  
  if (message.includes('rejected') || message.includes('denied')) {
    return new HardwareWalletError('User rejected action', 'USER_REJECTED');
  }
  
  if (message.includes('locked')) {
    return new HardwareWalletError('Device is locked', 'DEVICE_LOCKED');
  }
  
  if (message.includes('app not open')) {
    return new HardwareWalletError('Ethereum app not open on device', 'APP_NOT_OPEN');
  }
  
  if (message.includes('timeout')) {
    return new HardwareWalletError('Connection timeout', 'TIMEOUT');
  }
  
  return new HardwareWalletError(message, 'UNKNOWN');
}
