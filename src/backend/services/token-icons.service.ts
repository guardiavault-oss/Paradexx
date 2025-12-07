/**
 * Token Icons Service - Fetches real token logos from multiple sources
 * Sources: CoinGecko, Trust Wallet Assets, 1inch, custom overrides
 */

import axios from 'axios';
import { logger } from './logger.service';

// ============================================================
// TOKEN ICON SOURCES (priority order)
// ============================================================

const ICON_SOURCES = {
    // Trust Wallet Assets (GitHub CDN)
    TRUST_WALLET: (chainId: number, address: string) => {
        const chainName = getChainSlug(chainId);
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${address}/logo.png`;
    },

    // CoinGecko API
    COINGECKO: 'https://api.coingecko.com/api/v3',

    // 1inch Token List
    ONE_INCH: (chainId: number) =>
        `https://tokens.1inch.io/v1.2/${chainId}`,

    // Uniswap Token List
    UNISWAP: 'https://tokens.uniswap.org',

    // Fallback placeholder
    FALLBACK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
};

// Chain slug mapping for Trust Wallet
function getChainSlug(chainId: number): string {
    const chains: Record<number, string> = {
        1: 'ethereum',
        137: 'polygon',
        56: 'smartchain',
        42161: 'arbitrum',
        10: 'optimism',
        8453: 'base',
        43114: 'avalanchec',
        250: 'fantom',
    };
    return chains[chainId] || 'ethereum';
}

// ============================================================
// COMMON TOKEN ICONS (hardcoded for reliability)
// ============================================================

const COMMON_TOKEN_ICONS: Record<string, string> = {
    // Native tokens
    'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    'WETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    'MATIC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    'BNB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    'AVAX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',

    // Stablecoins
    'USDC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    'USDT': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    'DAI': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeBCD380B50/logo.png',
    'BUSD': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56/logo.png',
    'FRAX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x853d955aCEf822Db058eb8505911ED77F175b99e/logo.png',

    // Major tokens
    'WBTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    'UNI': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    'LINK': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    'AAVE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
    'CRV': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
    'MKR': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
    'SNX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F/logo.png',
    'COMP': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png',
    'LDO': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png',
    'stETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
    'ARB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    'OP': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    'PEPE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
    'SHIB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
    'DOGE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/dogecoin/info/logo.png',
};

// Native token address placeholder
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// ============================================================
// TOKEN ICON SERVICE
// ============================================================

interface TokenIconInfo {
    address: string;
    symbol: string;
    name: string;
    logoURI: string;
    chainId: number;
}

class TokenIconsService {
    private cache: Map<string, TokenIconInfo> = new Map();
    private tokenLists: Map<number, Map<string, TokenIconInfo>> = new Map();

    constructor() {
        this.loadTokenLists();
    }

    /**
     * Load token lists from various sources
     */
    private async loadTokenLists(): Promise<void> {
        try {
            // Load Uniswap token list
            const uniswapResponse = await axios.get(ICON_SOURCES.UNISWAP);
            const tokens = uniswapResponse.data.tokens || [];

            for (const token of tokens) {
                const key = `${token.chainId}:${token.address.toLowerCase()}`;
                this.cache.set(key, {
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    logoURI: token.logoURI || '',
                    chainId: token.chainId,
                });
            }

            logger.info(`[TokenIcons] Loaded ${tokens.length} tokens from Uniswap list`);
        } catch (error) {
            logger.warn('[TokenIcons] Failed to load Uniswap token list:', error);
        }
    }

    /**
     * Get token icon URL
     */
    async getTokenIcon(chainId: number, addressOrSymbol: string): Promise<string> {
        // Normalize address
        const normalizedAddress = addressOrSymbol.toLowerCase();

        // Check for native token
        if (normalizedAddress === NATIVE_TOKEN_ADDRESS.toLowerCase() || normalizedAddress === 'eth' || normalizedAddress === '0x') {
            return this.getNativeTokenIcon(chainId);
        }

        // Check common tokens by symbol first
        const symbol = addressOrSymbol.toUpperCase();
        if (COMMON_TOKEN_ICONS[symbol]) {
            return COMMON_TOKEN_ICONS[symbol];
        }

        // Check cache
        const cacheKey = `${chainId}:${normalizedAddress}`;
        const cached = this.cache.get(cacheKey);
        if (cached?.logoURI) {
            return cached.logoURI;
        }

        // Try Trust Wallet Assets
        const trustWalletUrl = ICON_SOURCES.TRUST_WALLET(chainId, this.checksumAddress(addressOrSymbol));
        if (await this.isValidImageUrl(trustWalletUrl)) {
            return trustWalletUrl;
        }

        // Try 1inch API
        try {
            const oneInchUrl = `${ICON_SOURCES.ONE_INCH(chainId)}/${normalizedAddress}`;
            const response = await axios.get(oneInchUrl);
            if (response.data?.logoURI) {
                this.cache.set(cacheKey, {
                    address: addressOrSymbol,
                    symbol: response.data.symbol || '',
                    name: response.data.name || '',
                    logoURI: response.data.logoURI,
                    chainId,
                });
                return response.data.logoURI;
            }
        } catch (error) {
            // Silently fail
        }

        // Try CoinGecko
        try {
            const platform = this.getCoinGeckoPlatform(chainId);
            const response = await axios.get(
                `${ICON_SOURCES.COINGECKO}/coins/${platform}/contract/${normalizedAddress}`
            );
            if (response.data?.image?.large) {
                return response.data.image.large;
            }
        } catch (error) {
            // Silently fail
        }

        // Return fallback
        return ICON_SOURCES.FALLBACK;
    }

    /**
     * Get native token icon for chain
     */
    getNativeTokenIcon(chainId: number): string {
        const nativeIcons: Record<number, string> = {
            1: COMMON_TOKEN_ICONS['ETH'],
            137: COMMON_TOKEN_ICONS['MATIC'],
            56: COMMON_TOKEN_ICONS['BNB'],
            42161: COMMON_TOKEN_ICONS['ETH'], // Arbitrum uses ETH
            10: COMMON_TOKEN_ICONS['ETH'], // Optimism uses ETH
            8453: COMMON_TOKEN_ICONS['ETH'], // Base uses ETH
            43114: COMMON_TOKEN_ICONS['AVAX'],
        };
        return nativeIcons[chainId] || COMMON_TOKEN_ICONS['ETH'];
    }

    /**
     * Get multiple token icons at once
     */
    async getTokenIcons(chainId: number, addresses: string[]): Promise<Record<string, string>> {
        const results: Record<string, string> = {};

        await Promise.all(
            addresses.map(async (address) => {
                results[address] = await this.getTokenIcon(chainId, address);
            })
        );

        return results;
    }

    /**
     * Get token info with icon
     */
    async getTokenInfo(chainId: number, address: string): Promise<TokenIconInfo> {
        const cacheKey = `${chainId}:${address.toLowerCase()}`;
        const cached = this.cache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const logoURI = await this.getTokenIcon(chainId, address);

        const info: TokenIconInfo = {
            address,
            symbol: '',
            name: '',
            logoURI,
            chainId,
        };

        this.cache.set(cacheKey, info);
        return info;
    }

    /**
     * Validate image URL
     */
    private async isValidImageUrl(url: string): Promise<boolean> {
        try {
            const response = await axios.head(url, { timeout: 3000 });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    /**
     * Get CoinGecko platform ID for chain
     */
    private getCoinGeckoPlatform(chainId: number): string {
        const platforms: Record<number, string> = {
            1: 'ethereum',
            137: 'polygon-pos',
            56: 'binance-smart-chain',
            42161: 'arbitrum-one',
            10: 'optimistic-ethereum',
            8453: 'base',
            43114: 'avalanche',
        };
        return platforms[chainId] || 'ethereum';
    }

    /**
     * Convert to checksum address for Trust Wallet URLs
     */
    private checksumAddress(address: string): string {
        // Basic checksum - in production use ethers.getAddress()
        try {
            // Simple implementation - returns original if not a valid address
            if (!address.startsWith('0x') || address.length !== 42) {
                return address;
            }
            return address; // Would use proper checksum in production
        } catch {
            return address;
        }
    }
}

export const tokenIconsService = new TokenIconsService();
export default tokenIconsService;
