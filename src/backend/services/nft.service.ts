/**
 * NFT Service - Fetch and Display User NFTs
 * 
 * Integrates with multiple NFT APIs:
 * - Alchemy NFT API
 * - Moralis
 * - OpenSea
 * - Reservoir
 */

import axios from 'axios';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';

// API Configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';
const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY || '';

// API Endpoints
const ALCHEMY_BASE = 'https://eth-mainnet.g.alchemy.com/nft/v3';
const MORALIS_API = 'https://deep-index.moralis.io/api/v2.2';
const OPENSEA_API = 'https://api.opensea.io/api/v2';
const RESERVOIR_API = 'https://api.reservoir.tools';

export interface NFT {
    id: string;
    tokenId: string;
    contractAddress: string;
    name: string;
    description?: string;
    image: string;
    animationUrl?: string;
    collection: {
        name: string;
        slug?: string;
        image?: string;
        verified?: boolean;
    };
    attributes?: NFTAttribute[];
    rarity?: {
        rank?: number;
        score?: number;
        total?: number;
    };
    floorPrice?: {
        amount: string;
        currency: string;
    };
    lastSale?: {
        amount: string;
        currency: string;
        date: Date;
    };
    chain: string;
    standard: 'ERC721' | 'ERC1155';
    balance?: number; // For ERC1155
}

export interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
    rarity?: number;
}

export interface NFTCollection {
    address: string;
    name: string;
    symbol: string;
    image?: string;
    description?: string;
    externalUrl?: string;
    floorPrice?: string;
    totalSupply?: number;
    verified?: boolean;
    chain: string;
}

export interface NFTTransfer {
    tokenId: string;
    contractAddress: string;
    from: string;
    to: string;
    transactionHash: string;
    blockNumber: number;
    timestamp: Date;
    type: 'mint' | 'transfer' | 'sale';
    price?: string;
}

class NFTService extends EventEmitter {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTimeout = 60 * 1000; // 1 minute

    /**
     * Get all NFTs for an address
     */
    async getNFTsForAddress(
        address: string,
        chain: string = 'ethereum',
        options?: {
            pageSize?: number;
            pageKey?: string;
            excludeSpam?: boolean;
        }
    ): Promise<{ nfts: NFT[]; pageKey?: string }> {
        const cacheKey = `nfts:${address}:${chain}:${options?.pageKey || ''}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // Try Alchemy first (best coverage)
        if (ALCHEMY_API_KEY) {
            try {
                const result = await this.getNFTsFromAlchemy(address, chain, options);
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            } catch (error) {
                logger.error('[NFT] Alchemy failed, trying Moralis:', error);
            }
        }

        // Fallback to Moralis
        if (MORALIS_API_KEY) {
            try {
                const result = await this.getNFTsFromMoralis(address, chain, options);
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            } catch (error) {
                logger.error('[NFT] Moralis failed:', error);
            }
        }

        return { nfts: [] };
    }

    /**
     * Get NFTs from Alchemy
     */
    private async getNFTsFromAlchemy(
        address: string,
        chain: string,
        options?: { pageSize?: number; pageKey?: string; excludeSpam?: boolean }
    ): Promise<{ nfts: NFT[]; pageKey?: string }> {
        const chainUrl = this.getAlchemyChainUrl(chain);

        const response = await axios.get(`${chainUrl}/${ALCHEMY_API_KEY}/getNFTsForOwner`, {
            params: {
                owner: address,
                pageSize: options?.pageSize || 100,
                pageKey: options?.pageKey,
                excludeFilters: options?.excludeSpam ? ['SPAM'] : undefined,
                withMetadata: true,
            },
        });

        const nfts: NFT[] = response.data.ownedNfts.map((nft: any) => ({
            id: `${nft.contract.address}-${nft.tokenId}`,
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
            name: nft.name || nft.title || `#${nft.tokenId}`,
            description: nft.description,
            image: this.resolveIPFS(nft.image?.cachedUrl || nft.image?.originalUrl || nft.raw?.metadata?.image),
            animationUrl: nft.raw?.metadata?.animation_url,
            collection: {
                name: nft.contract.name || 'Unknown Collection',
                slug: nft.contract.openSeaMetadata?.collectionSlug,
                image: nft.contract.openSeaMetadata?.imageUrl,
                verified: nft.contract.openSeaMetadata?.safelistRequestStatus === 'verified',
            },
            attributes: nft.raw?.metadata?.attributes?.map((attr: any) => ({
                trait_type: attr.trait_type,
                value: attr.value,
                display_type: attr.display_type,
            })),
            rarity: nft.raw?.metadata?.rarity ? {
                rank: nft.raw.metadata.rarity.rank,
                score: nft.raw.metadata.rarity.score,
            } : undefined,
            floorPrice: nft.contract.openSeaMetadata?.floorPrice ? {
                amount: nft.contract.openSeaMetadata.floorPrice.toString(),
                currency: 'ETH',
            } : undefined,
            chain,
            standard: nft.tokenType === 'ERC1155' ? 'ERC1155' : 'ERC721',
            balance: nft.balance ? parseInt(nft.balance) : 1,
        }));

        return {
            nfts,
            pageKey: response.data.pageKey,
        };
    }

    /**
     * Get NFTs from Moralis
     */
    private async getNFTsFromMoralis(
        address: string,
        chain: string,
        options?: { pageSize?: number; pageKey?: string }
    ): Promise<{ nfts: NFT[]; pageKey?: string }> {
        const chainId = this.getMoralisChainId(chain);

        const response = await axios.get(`${MORALIS_API}/${address}/nft`, {
            params: {
                chain: chainId,
                limit: options?.pageSize || 100,
                cursor: options?.pageKey,
                normalizeMetadata: true,
            },
            headers: {
                'X-API-Key': MORALIS_API_KEY,
            },
        });

        const nfts: NFT[] = response.data.result.map((nft: any) => {
            const metadata = nft.normalized_metadata || JSON.parse(nft.metadata || '{}');

            return {
                id: `${nft.token_address}-${nft.token_id}`,
                tokenId: nft.token_id,
                contractAddress: nft.token_address,
                name: metadata.name || nft.name || `#${nft.token_id}`,
                description: metadata.description,
                image: this.resolveIPFS(metadata.image),
                animationUrl: metadata.animation_url,
                collection: {
                    name: nft.name || 'Unknown Collection',
                    verified: nft.verified_collection,
                },
                attributes: metadata.attributes,
                chain,
                standard: nft.contract_type === 'ERC1155' ? 'ERC1155' : 'ERC721',
                balance: parseInt(nft.amount) || 1,
            };
        });

        return {
            nfts,
            pageKey: response.data.cursor,
        };
    }

    /**
     * Get single NFT details
     */
    async getNFT(
        contractAddress: string,
        tokenId: string,
        chain: string = 'ethereum'
    ): Promise<NFT | null> {
        try {
            if (ALCHEMY_API_KEY) {
                const chainUrl = this.getAlchemyChainUrl(chain);
                const response = await axios.get(`${chainUrl}/${ALCHEMY_API_KEY}/getNFTMetadata`, {
                    params: {
                        contractAddress,
                        tokenId,
                        refreshCache: false,
                    },
                });

                const nft = response.data;
                return {
                    id: `${contractAddress}-${tokenId}`,
                    tokenId,
                    contractAddress,
                    name: nft.name || nft.title || `#${tokenId}`,
                    description: nft.description,
                    image: this.resolveIPFS(nft.image?.cachedUrl || nft.image?.originalUrl),
                    animationUrl: nft.raw?.metadata?.animation_url,
                    collection: {
                        name: nft.contract.name || 'Unknown',
                        verified: nft.contract.openSeaMetadata?.safelistRequestStatus === 'verified',
                    },
                    attributes: nft.raw?.metadata?.attributes,
                    chain,
                    standard: nft.tokenType === 'ERC1155' ? 'ERC1155' : 'ERC721',
                };
            }
            return null;
        } catch (error) {
            logger.error('[NFT] Get NFT failed:', error);
            return null;
        }
    }

    /**
     * Get collection info
     */
    async getCollection(
        contractAddress: string,
        chain: string = 'ethereum'
    ): Promise<NFTCollection | null> {
        try {
            if (ALCHEMY_API_KEY) {
                const chainUrl = this.getAlchemyChainUrl(chain);
                const response = await axios.get(`${chainUrl}/${ALCHEMY_API_KEY}/getContractMetadata`, {
                    params: { contractAddress },
                });

                const data = response.data;
                return {
                    address: contractAddress,
                    name: data.name || 'Unknown',
                    symbol: data.symbol || '',
                    image: data.openSeaMetadata?.imageUrl,
                    description: data.openSeaMetadata?.description,
                    externalUrl: data.openSeaMetadata?.externalUrl,
                    floorPrice: data.openSeaMetadata?.floorPrice?.toString(),
                    totalSupply: data.totalSupply,
                    verified: data.openSeaMetadata?.safelistRequestStatus === 'verified',
                    chain,
                };
            }
            return null;
        } catch (error) {
            logger.error('[NFT] Get collection failed:', error);
            return null;
        }
    }

    /**
     * Get NFT floor price from Reservoir
     */
    async getFloorPrice(
        contractAddress: string,
        chain: string = 'ethereum'
    ): Promise<{ amount: string; currency: string } | null> {
        try {
            if (RESERVOIR_API_KEY) {
                const response = await axios.get(`${RESERVOIR_API}/collections/v6`, {
                    params: { id: contractAddress },
                    headers: { 'x-api-key': RESERVOIR_API_KEY },
                });

                const collection = response.data.collections?.[0];
                if (collection?.floorAsk?.price?.amount?.native) {
                    return {
                        amount: collection.floorAsk.price.amount.native.toString(),
                        currency: 'ETH',
                    };
                }
            }
            return null;
        } catch (error) {
            logger.error('[NFT] Get floor price failed:', error);
            return null;
        }
    }

    /**
     * Get NFT transfers for address
     */
    async getTransfers(
        address: string,
        chain: string = 'ethereum',
        options?: { limit?: number; cursor?: string }
    ): Promise<{ transfers: NFTTransfer[]; cursor?: string }> {
        try {
            if (MORALIS_API_KEY) {
                const chainId = this.getMoralisChainId(chain);
                const response = await axios.get(`${MORALIS_API}/${address}/nft/transfers`, {
                    params: {
                        chain: chainId,
                        limit: options?.limit || 50,
                        cursor: options?.cursor,
                    },
                    headers: { 'X-API-Key': MORALIS_API_KEY },
                });

                const transfers: NFTTransfer[] = response.data.result.map((t: any) => ({
                    tokenId: t.token_id,
                    contractAddress: t.token_address,
                    from: t.from_address,
                    to: t.to_address,
                    transactionHash: t.transaction_hash,
                    blockNumber: parseInt(t.block_number),
                    timestamp: new Date(t.block_timestamp),
                    type: t.from_address === '0x0000000000000000000000000000000000000000'
                        ? 'mint'
                        : t.value && t.value !== '0'
                            ? 'sale'
                            : 'transfer',
                    price: t.value,
                }));

                return {
                    transfers,
                    cursor: response.data.cursor,
                };
            }
            return { transfers: [] };
        } catch (error) {
            logger.error('[NFT] Get transfers failed:', error);
            return { transfers: [] };
        }
    }

    /**
     * Resolve IPFS URLs
     */
    private resolveIPFS(url?: string): string {
        if (!url) return '';

        if (url.startsWith('ipfs://')) {
            return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
        }

        if (url.startsWith('ar://')) {
            return `https://arweave.net/${url.replace('ar://', '')}`;
        }

        return url;
    }

    /**
     * Get Alchemy chain URL
     */
    private getAlchemyChainUrl(chain: string): string {
        const urls: Record<string, string> = {
            ethereum: 'https://eth-mainnet.g.alchemy.com/nft/v3',
            polygon: 'https://polygon-mainnet.g.alchemy.com/nft/v3',
            arbitrum: 'https://arb-mainnet.g.alchemy.com/nft/v3',
            optimism: 'https://opt-mainnet.g.alchemy.com/nft/v3',
            base: 'https://base-mainnet.g.alchemy.com/nft/v3',
        };
        return urls[chain] || urls.ethereum;
    }

    /**
     * Get Moralis chain ID
     */
    private getMoralisChainId(chain: string): string {
        const chains: Record<string, string> = {
            ethereum: 'eth',
            polygon: 'polygon',
            bsc: 'bsc',
            arbitrum: 'arbitrum',
            optimism: 'optimism',
            base: 'base',
            avalanche: 'avalanche',
        };
        return chains[chain] || 'eth';
    }

    /**
     * Estimate NFT value based on floor price and rarity
     */
    estimateValue(nft: NFT): string {
        if (!nft.floorPrice) return '0';

        let multiplier = 1;

        // Adjust based on rarity rank
        if (nft.rarity?.rank && nft.rarity?.total) {
            const percentile = nft.rarity.rank / nft.rarity.total;
            if (percentile <= 0.01) multiplier = 5;      // Top 1%
            else if (percentile <= 0.05) multiplier = 3; // Top 5%
            else if (percentile <= 0.10) multiplier = 2; // Top 10%
            else if (percentile <= 0.25) multiplier = 1.5; // Top 25%
        }

        const floorValue = parseFloat(nft.floorPrice.amount);
        return (floorValue * multiplier).toFixed(4);
    }
}

export const nftService = new NFTService();
