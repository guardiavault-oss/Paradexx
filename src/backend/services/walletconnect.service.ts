/**
 * WalletConnect v2 Service - Connect Platform Wallet to dApps
 * 
 * This service allows users to:
 * 1. Connect their platform wallet to any WalletConnect-compatible dApp
 * 2. Sign transactions using the platform's internal wallet
 * 3. Manage multiple dApp sessions
 */

// WalletConnect packages - optional, stub if not installed
let Core: any, Web3Wallet: any, buildApprovedNamespaces: any, getSdkError: any;
try {
    Core = require('@walletconnect/core').Core;
    Web3Wallet = require('@walletconnect/web3wallet').Web3Wallet;
    const utils = require('@walletconnect/utils');
    buildApprovedNamespaces = utils.buildApprovedNamespaces;
    getSdkError = utils.getSdkError;
} catch {
    // WalletConnect not installed - service will be disabled
}
import { logger } from '../services/logger.service';
type IWeb3Wallet = any;
import { EventEmitter } from 'events';
import { walletService } from './wallet.service';
import { seedlessWalletService } from './seedless-wallet.service';
import { prisma } from '../config/database';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.WALLETCONNECT_PROJECT_ID || '';

export interface WCSession {
    topic: string;
    peerMeta: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };
    namespaces: any;
    expiry: number;
    acknowledged: boolean;
}

export interface WCRequest {
    id: number;
    topic: string;
    method: string;
    params: any;
    chainId: string;
}

export interface PendingRequest extends WCRequest {
    peerMeta: WCSession['peerMeta'];
    timestamp: Date;
}

class WalletConnectService extends EventEmitter {
    private web3wallet: IWeb3Wallet | null = null;
    private initialized: boolean = false;
    private pendingRequests: Map<number, PendingRequest> = new Map();

    // Supported chains
    private supportedChains = [
        'eip155:1',      // Ethereum
        'eip155:137',    // Polygon
        'eip155:56',     // BSC
        'eip155:42161',  // Arbitrum
        'eip155:10',     // Optimism
        'eip155:8453',   // Base
        'eip155:43114',  // Avalanche
    ];

    // Supported methods
    private supportedMethods = [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
    ];

    // Supported events
    private supportedEvents = [
        'chainChanged',
        'accountsChanged',
    ];

    /**
     * Initialize WalletConnect
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        if (!WALLETCONNECT_PROJECT_ID) {
            logger.error('[WalletConnect] Project ID not configured');
            return false;
        }

        try {
            const core = new Core({
                projectId: WALLETCONNECT_PROJECT_ID,
            });

            this.web3wallet = await Web3Wallet.init({
                core,
                metadata: {
                    name: 'GuardiaVault',
                    description: 'Secure Multi-Chain Wallet',
                    url: process.env.FRONTEND_URL || 'https://guardiavault.io',
                    icons: ['https://guardiavault.io/icon.png'],
                },
            });

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;
            logger.info('[WalletConnect] Initialized successfully');
            return true;
        } catch (error) {
            logger.error('[WalletConnect] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Set up WalletConnect event listeners
     */
    private setupEventListeners(): void {
        if (!this.web3wallet) return;

        // Session proposal (new connection request)
        this.web3wallet.on('session_proposal', async (proposal) => {
            logger.info('[WalletConnect] Session proposal:', proposal);
            this.emit('session_proposal', proposal);
        });

        // Session request (transaction/sign request)
        this.web3wallet.on('session_request', async (request) => {
            logger.info('[WalletConnect] Session request:', request);
            await this.handleSessionRequest(request);
        });

        // Session delete
        this.web3wallet.on('session_delete', (session) => {
            logger.info('[WalletConnect] Session deleted:', session.topic);
            this.emit('session_deleted', session.topic);
        });
    }

    /**
     * Connect to a dApp using WalletConnect URI
     */
    async pair(uri: string): Promise<void> {
        if (!this.web3wallet) {
            await this.initialize();
        }

        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        await this.web3wallet.core.pairing.pair({ uri });
    }

    /**
     * Approve a session proposal
     */
    async approveSession(
        userId: string,
        proposalId: number,
        proposal: any
    ): Promise<WCSession> {
        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        // Get user's wallet address
        const userWallet = await prisma.wallet.findFirst({
            where: { userId },
        });

        if (!userWallet) {
            throw new Error('No wallet found for user');
        }

        // Build approved namespaces
        const namespaces = buildApprovedNamespaces({
            proposal: proposal.params,
            supportedNamespaces: {
                eip155: {
                    chains: this.supportedChains,
                    methods: this.supportedMethods,
                    events: this.supportedEvents,
                    accounts: this.supportedChains.map(
                        chain => `${chain}:${userWallet.address}`
                    ),
                },
            },
        });

        const session = await this.web3wallet.approveSession({
            id: proposalId,
            namespaces,
        });

        // Store session in database
        await prisma.walletConnectSession.create({
            data: {
                userId,
                topic: session.topic,
                peerName: session.peer.metadata.name,
                peerUrl: session.peer.metadata.url,
                peerIcon: session.peer.metadata.icons[0] || '',
                chainId: 1, // Default to Ethereum mainnet
                accounts: JSON.stringify([userWallet.address]),
                connected: true,
            },
        });

        this.emit('session_approved', session);

        return {
            topic: session.topic,
            peerMeta: session.peer.metadata,
            namespaces: session.namespaces,
            expiry: session.expiry,
            acknowledged: session.acknowledged,
        };
    }

    /**
     * Reject a session proposal
     */
    async rejectSession(proposalId: number): Promise<void> {
        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        await this.web3wallet.rejectSession({
            id: proposalId,
            reason: getSdkError('USER_REJECTED'),
        });
    }

    /**
     * Handle incoming session request
     */
    private async handleSessionRequest(request: any): Promise<void> {
        const { id, topic, params } = request;
        const { request: req, chainId } = params;

        // Get session info
        const session = this.web3wallet?.getActiveSessions()[topic];
        if (!session) {
            logger.error('[WalletConnect] Session not found:', topic);
            return;
        }

        const pendingRequest: PendingRequest = {
            id,
            topic,
            method: req.method,
            params: req.params,
            chainId,
            peerMeta: session.peer.metadata,
            timestamp: new Date(),
        };

        this.pendingRequests.set(id, pendingRequest);
        this.emit('request', pendingRequest);
    }

    /**
     * Approve a request (sign/send transaction)
     */
    async approveRequest(
        userId: string,
        requestId: number,
        sessionToken?: string
    ): Promise<any> {
        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        const request = this.pendingRequests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        try {
            let result: any;

            switch (request.method) {
                case 'personal_sign':
                    result = await this.handlePersonalSign(userId, request.params);
                    break;

                case 'eth_sign':
                    result = await this.handleEthSign(userId, request.params);
                    break;

                case 'eth_signTypedData':
                case 'eth_signTypedData_v3':
                case 'eth_signTypedData_v4':
                    result = await this.handleSignTypedData(userId, request.params);
                    break;

                case 'eth_sendTransaction':
                    result = await this.handleSendTransaction(userId, request.params, sessionToken);
                    break;

                case 'eth_signTransaction':
                    result = await this.handleSignTransaction(userId, request.params, sessionToken);
                    break;

                default:
                    throw new Error(`Unsupported method: ${request.method}`);
            }

            // Send response
            await this.web3wallet.respondSessionRequest({
                topic: request.topic,
                response: {
                    id: requestId,
                    jsonrpc: '2.0',
                    result,
                },
            });

            this.pendingRequests.delete(requestId);
            this.emit('request_approved', { requestId, result });

            return result;
        } catch (error: any) {
            await this.rejectRequest(requestId, error.message);
            throw error;
        }
    }

    /**
     * Reject a request
     */
    async rejectRequest(requestId: number, reason?: string): Promise<void> {
        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        const request = this.pendingRequests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        await this.web3wallet.respondSessionRequest({
            topic: request.topic,
            response: {
                id: requestId,
                jsonrpc: '2.0',
                error: {
                    code: 4001,
                    message: reason || 'User rejected request',
                },
            },
        });

        this.pendingRequests.delete(requestId);
        this.emit('request_rejected', { requestId, reason });
    }

    /**
     * Handle personal_sign
     */
    private async handlePersonalSign(userId: string, params: any[]): Promise<string> {
        const [message, address] = params;

        // Get user's wallet
        const wallet = await prisma.wallet.findFirst({
            where: { userId, address: { equals: address, mode: 'insensitive' } },
        });

        if (!wallet || !wallet.encryptedPrivateKey) {
            throw new Error('Wallet not found or missing private key');
        }

        // Decrypt private key and sign
        const privateKey = walletService.decryptPrivateKey(wallet.encryptedPrivateKey, userId);
        const signature = await walletService.signMessage(privateKey, message);

        return signature;
    }

    /**
     * Handle eth_sign
     */
    private async handleEthSign(userId: string, params: any[]): Promise<string> {
        const [address, message] = params;
        return this.handlePersonalSign(userId, [message, address]);
    }

    /**
     * Handle eth_signTypedData
     */
    private async handleSignTypedData(userId: string, params: any[]): Promise<string> {
        const [address, typedData] = params;
        const data = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;

        // Get user's wallet
        const wallet = await prisma.wallet.findFirst({
            where: { userId, address: { equals: address, mode: 'insensitive' } },
        });

        if (!wallet || !wallet.encryptedPrivateKey) {
            throw new Error('Wallet not found or missing private key');
        }

        // Decrypt private key and sign typed data
        const privateKey = walletService.decryptPrivateKey(wallet.encryptedPrivateKey, userId);
        const signature = await walletService.signTypedData(
            privateKey,
            data.domain,
            data.types,
            data.message
        );

        return signature;
    }

    /**
     * Handle eth_sendTransaction
     */
    private async handleSendTransaction(
        userId: string,
        params: any[],
        sessionToken?: string
    ): Promise<string> {
        const [txParams] = params;

        // Use seedless wallet service for secure transaction
        if (sessionToken) {
            const result = await seedlessWalletService.signTransaction(userId, sessionToken, {
                to: txParams.to,
                value: txParams.value || '0',
                data: txParams.data,
                gasLimit: txParams.gas,
            });

            if (!result.success) {
                throw new Error(result.error || 'Transaction failed');
            }

            return result.transactionHash || '';
        }

        // Fallback: Direct wallet signing
        const wallet = await prisma.wallet.findFirst({
            where: { userId, address: { equals: txParams.from, mode: 'insensitive' } },
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // For now, return the signed transaction - actual broadcast would need provider
        return 'Transaction requires session token for execution';
    }

    /**
     * Handle eth_signTransaction
     */
    private async handleSignTransaction(
        userId: string,
        params: any[],
        sessionToken?: string
    ): Promise<string> {
        const [txParams] = params;

        if (sessionToken) {
            const result = await seedlessWalletService.signTransaction(userId, sessionToken, {
                to: txParams.to,
                value: txParams.value || '0',
                data: txParams.data,
                gasLimit: txParams.gas,
            });

            if (!result.success) {
                throw new Error(result.error || 'Signing failed');
            }

            return result.signedTransaction || '';
        }

        throw new Error('Session token required for signing');
    }

    /**
     * Disconnect a session
     */
    async disconnect(topic: string): Promise<void> {
        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        await this.web3wallet.disconnectSession({
            topic,
            reason: getSdkError('USER_DISCONNECTED'),
        });

        // Remove from database
        await prisma.walletConnectSession.deleteMany({
            where: { topic },
        });

        this.emit('session_disconnected', topic);
    }

    /**
     * Get all active sessions for a user
     */
    async getSessions(userId: string): Promise<WCSession[]> {
        const dbSessions = await prisma.walletConnectSession.findMany({
            where: { userId, connected: true },
        });

        return dbSessions.map(s => ({
            topic: s.topic,
            peerMeta: {
                name: s.peerName,
                description: '',
                url: s.peerUrl,
                icons: s.peerIcon ? [s.peerIcon] : [],
            },
            namespaces: {
                eip155: {
                    accounts: JSON.parse(s.accounts),
                    chains: [`eip155:${s.chainId}`],
                    methods: this.supportedMethods,
                    events: this.supportedEvents,
                },
            },
            expiry: Math.floor(s.lastActiveAt.getTime() / 1000) + (7 * 24 * 60 * 60), // 7 days from last active
            acknowledged: true,
        }));
    }

    /**
     * Get pending requests
     */
    getPendingRequests(): PendingRequest[] {
        return Array.from(this.pendingRequests.values());
    }

    /**
     * Generate pairing URI for QR code display
     */
    async generatePairingUri(): Promise<string> {
        if (!this.web3wallet) {
            await this.initialize();
        }

        if (!this.web3wallet) {
            throw new Error('WalletConnect not initialized');
        }

        const { uri } = await this.web3wallet.core.pairing.create();
        return uri;
    }
}

export const walletConnectService = new WalletConnectService();
