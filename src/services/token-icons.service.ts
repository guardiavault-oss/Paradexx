/**
 * Token Icons Service - Fetches real token logos
 * Uses multiple sources for comprehensive coverage
 */

// ============================================================
// COMMON TOKEN ICONS (Reliable hardcoded sources)
// ============================================================

const COMMON_TOKEN_ICONS: Record<string, string> = {
    // Native tokens
    ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    WETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    MATIC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    FTM: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',

    // Stablecoins
    USDC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    USDT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    DAI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeBCD380B50/logo.png',
    BUSD: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56/logo.png',
    FRAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x853d955aCEf822Db058eb8505911ED77F175b99e/logo.png',

    // Major DeFi tokens
    WBTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    UNI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    AAVE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
    CRV: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
    MKR: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
    SNX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F/logo.png',
    COMP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png',
    LDO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png',
    stETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',

    // L2 tokens
    ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    OP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',

    // Meme coins
    PEPE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
    SHIB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
    DOGE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/dogecoin/info/logo.png',
    FLOKI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E/logo.png',

    // Other popular tokens
    SOL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    ADA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
    DOT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
    ATOM: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
    XRP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
    LTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
};

// Native token addresses
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Chain to native symbol mapping
const CHAIN_NATIVE_SYMBOL: Record<number, string> = {
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH', // Arbitrum
    10: 'ETH', // Optimism
    8453: 'ETH', // Base
    43114: 'AVAX',
    250: 'FTM',
};

// Chain slug for Trust Wallet
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
// TOKEN ICONS SERVICE
// ============================================================

class TokenIconsService {
    private cache: Map<string, string> = new Map();
    private failedAttempts: Set<string> = new Set();

    /**
     * Get token icon by symbol
     */
    getIconBySymbol(symbol: string): string {
        const upperSymbol = symbol.toUpperCase();
        return COMMON_TOKEN_ICONS[upperSymbol] || this.getDefaultIcon();
    }

    /**
     * Get token icon by address
     */
    async getIconByAddress(chainId: number, address: string): Promise<string> {
        // Check for native token
        if (address.toLowerCase() === NATIVE_TOKEN.toLowerCase() || address === '0x') {
            return this.getNativeIcon(chainId);
        }

        // Check cache
        const cacheKey = `${chainId}:${address.toLowerCase()}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // Skip if already failed
        if (this.failedAttempts.has(cacheKey)) {
            return this.getDefaultIcon();
        }

        // Try Trust Wallet
        const trustWalletUrl = this.getTrustWalletUrl(chainId, address);
        if (await this.isImageValid(trustWalletUrl)) {
            this.cache.set(cacheKey, trustWalletUrl);
            return trustWalletUrl;
        }

        // Try 1inch
        const oneInchUrl = `https://tokens.1inch.io/${address.toLowerCase()}.png`;
        if (await this.isImageValid(oneInchUrl)) {
            this.cache.set(cacheKey, oneInchUrl);
            return oneInchUrl;
        }

        // Mark as failed and return default
        this.failedAttempts.add(cacheKey);
        return this.getDefaultIcon();
    }

    /**
     * Get native token icon for chain
     */
    getNativeIcon(chainId: number): string {
        const symbol = CHAIN_NATIVE_SYMBOL[chainId] || 'ETH';
        return COMMON_TOKEN_ICONS[symbol] || this.getDefaultIcon();
    }

    /**
     * Get Trust Wallet asset URL
     */
    private getTrustWalletUrl(chainId: number, address: string): string {
        const chainSlug = getChainSlug(chainId);
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainSlug}/assets/${address}/logo.png`;
    }

    /**
     * Check if image URL is valid
     */
    private async isImageValid(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get default icon
     */
    getDefaultIcon(): string {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23333"%3E%3C/circle%3E%3Ctext x="50" y="55" font-family="Arial" font-size="24" fill="%23888" text-anchor="middle"%3E%3F%3C/text%3E%3C/svg%3E';
    }

    /**
     * Get multiple icons at once
     */
    async getIcons(tokens: Array<{ chainId: number; address: string }>): Promise<Map<string, string>> {
        const results = new Map<string, string>();

        await Promise.all(
            tokens.map(async ({ chainId, address }) => {
                const icon = await this.getIconByAddress(chainId, address);
                results.set(`${chainId}:${address.toLowerCase()}`, icon);
            })
        );

        return results;
    }

    /**
     * Get common token icon
     */
    getCommonIcon(symbolOrName: string): string | null {
        const normalized = symbolOrName.toUpperCase();
        return COMMON_TOKEN_ICONS[normalized] || null;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        this.failedAttempts.clear();
    }
}

// Export singleton
export const tokenIconsService = new TokenIconsService();

// Export common icons for direct access
export { COMMON_TOKEN_ICONS };

export default tokenIconsService;
