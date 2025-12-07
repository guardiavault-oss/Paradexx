/**
 * ENS & Domain Resolution Service
 * 
 * Resolves blockchain domain names to addresses:
 * - ENS (.eth)
 * - Unstoppable Domains (.crypto, .nft, .x, .wallet, .blockchain, etc.)
 * - Lens Protocol (.lens)
 * - SpaceID (.bnb, .arb)
 */

import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import axios from 'axios';

// ENS Registry
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// Unstoppable Domains API
const UD_API = 'https://resolve.unstoppabledomains.com';
const UD_API_KEY = process.env.UNSTOPPABLE_DOMAINS_API_KEY || '';

// SpaceID API
const SPACEID_API = 'https://api.space.id';

export interface ResolvedAddress {
    address: string;
    domain: string;
    source: 'ens' | 'unstoppable' | 'lens' | 'spaceid';
    avatar?: string;
    description?: string;
    twitter?: string;
    email?: string;
    url?: string;
}

export interface DomainInfo {
    domain: string;
    owner: string;
    resolver: string;
    registrationDate?: Date;
    expirationDate?: Date;
    records: Record<string, string>;
}

class ENSResolverService {
    private provider: ethers.JsonRpcProvider;
    private cache: Map<string, { result: ResolvedAddress; timestamp: number }> = new Map();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.provider = new ethers.JsonRpcProvider(
            process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'
        );
    }

    /**
     * Resolve any domain name to address
     */
    async resolve(domain: string): Promise<ResolvedAddress | null> {
        // Check cache
        const cached = this.cache.get(domain.toLowerCase());
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }

        let result: ResolvedAddress | null = null;

        // Determine domain type and resolve
        if (domain.endsWith('.eth')) {
            result = await this.resolveENS(domain);
        } else if (domain.endsWith('.lens')) {
            result = await this.resolveLens(domain);
        } else if (this.isUnstoppableDomain(domain)) {
            result = await this.resolveUnstoppable(domain);
        } else if (domain.endsWith('.bnb') || domain.endsWith('.arb')) {
            result = await this.resolveSpaceID(domain);
        } else {
            // Try all resolvers
            result = await this.resolveENS(domain) ||
                await this.resolveUnstoppable(domain) ||
                await this.resolveSpaceID(domain);
        }

        // Cache result
        if (result) {
            this.cache.set(domain.toLowerCase(), { result, timestamp: Date.now() });
        }

        return result;
    }

    /**
     * Reverse resolve address to domain
     */
    async reverseResolve(address: string): Promise<string | null> {
        try {
            // Try ENS reverse resolution
            const ensName = await this.provider.lookupAddress(address);
            if (ensName) return ensName;

            // Try Unstoppable Domains reverse resolution
            const udName = await this.reverseResolveUD(address);
            if (udName) return udName;

            return null;
        } catch (error) {
            logger.error('[ENSResolver] Reverse resolution failed:', error);
            return null;
        }
    }

    /**
     * Resolve ENS domain
     */
    private async resolveENS(domain: string): Promise<ResolvedAddress | null> {
        try {
            const address = await this.provider.resolveName(domain);
            if (!address) return null;

            // Get additional records
            const resolver = await this.provider.getResolver(domain);
            let avatar: string | undefined;
            let description: string | undefined;
            let twitter: string | undefined;
            let email: string | undefined;
            let url: string | undefined;

            if (resolver) {
                try {
                    avatar = await resolver.getAvatar() as string | undefined;
                    description = await resolver.getText('description');
                    twitter = await resolver.getText('com.twitter');
                    email = await resolver.getText('email');
                    url = await resolver.getText('url');
                } catch {
                    // Records not available
                }
            }

            return {
                address,
                domain,
                source: 'ens',
                avatar: avatar || undefined,
                description: description || undefined,
                twitter: twitter || undefined,
                email: email || undefined,
                url: url || undefined,
            };
        } catch (error) {
            logger.error('[ENSResolver] ENS resolution failed:', error);
            return null;
        }
    }

    /**
     * Resolve Unstoppable Domains
     */
    private async resolveUnstoppable(domain: string): Promise<ResolvedAddress | null> {
        try {
            const response = await axios.get(`${UD_API}/domains/${domain}`, {
                headers: UD_API_KEY ? { 'Authorization': `Bearer ${UD_API_KEY}` } : {},
            });

            const data = response.data;
            const records = data.records || {};

            // Get ETH address (or other crypto addresses)
            const address = records['crypto.ETH.address'] ||
                records['crypto.MATIC.address'] ||
                records['crypto.BTC.address'];

            if (!address) return null;

            return {
                address,
                domain,
                source: 'unstoppable',
                avatar: records['social.picture.value'],
                description: records['profile.description'],
                twitter: records['social.twitter.username'],
                email: records['whois.email.value'],
                url: records['ipfs.html.value'] ? `https://gateway.ipfs.io/ipfs/${records['ipfs.html.value']}` : undefined,
            };
        } catch (error) {
            logger.error('[ENSResolver] Unstoppable resolution failed:', error);
            return null;
        }
    }

    /**
     * Resolve Lens Protocol handle
     */
    private async resolveLens(domain: string): Promise<ResolvedAddress | null> {
        try {
            const handle = domain.replace('.lens', '');
            const response = await axios.post('https://api.lens.dev', {
                query: `
          query Profile {
            profile(request: { handle: "${handle}" }) {
              id
              ownedBy
              picture {
                ... on MediaSet {
                  original {
                    url
                  }
                }
              }
              bio
            }
          }
        `,
            });

            const profile = response.data?.data?.profile;
            if (!profile) return null;

            return {
                address: profile.ownedBy,
                domain,
                source: 'lens',
                avatar: profile.picture?.original?.url,
                description: profile.bio,
            };
        } catch (error) {
            logger.error('[ENSResolver] Lens resolution failed:', error);
            return null;
        }
    }

    /**
     * Resolve SpaceID domains (.bnb, .arb)
     */
    private async resolveSpaceID(domain: string): Promise<ResolvedAddress | null> {
        try {
            const tld = domain.split('.').pop();
            const chainId = tld === 'bnb' ? 56 : tld === 'arb' ? 42161 : 1;

            const response = await axios.get(`${SPACEID_API}/v1/getName`, {
                params: { name: domain, tld, chainId },
            });

            const data = response.data;
            if (!data.address) return null;

            return {
                address: data.address,
                domain,
                source: 'spaceid',
                avatar: data.avatar,
            };
        } catch (error) {
            logger.error('[ENSResolver] SpaceID resolution failed:', error);
            return null;
        }
    }

    /**
     * Reverse resolve Unstoppable Domains
     */
    private async reverseResolveUD(address: string): Promise<string | null> {
        try {
            const response = await axios.get(`${UD_API}/reverse/${address}`, {
                headers: UD_API_KEY ? { 'Authorization': `Bearer ${UD_API_KEY}` } : {},
            });

            return response.data?.meta?.domain || null;
        } catch {
            return null;
        }
    }

    /**
     * Check if domain is Unstoppable Domain
     */
    private isUnstoppableDomain(domain: string): boolean {
        const udTlds = [
            '.crypto', '.nft', '.x', '.wallet', '.blockchain',
            '.bitcoin', '.dao', '.888', '.zil', '.polygon',
        ];
        return udTlds.some(tld => domain.endsWith(tld));
    }

    /**
     * Get full domain info
     */
    async getDomainInfo(domain: string): Promise<DomainInfo | null> {
        try {
            if (domain.endsWith('.eth')) {
                return this.getENSDomainInfo(domain);
            } else if (this.isUnstoppableDomain(domain)) {
                return this.getUDDomainInfo(domain);
            }
            return null;
        } catch (error) {
            logger.error('[ENSResolver] Get domain info failed:', error);
            return null;
        }
    }

    /**
     * Get ENS domain info
     */
    private async getENSDomainInfo(domain: string): Promise<DomainInfo | null> {
        try {
            const resolver = await this.provider.getResolver(domain);
            if (!resolver) return null;

            const owner = await this.provider.resolveName(domain);
            if (!owner) return null;

            // Get text records
            const records: Record<string, string> = {};
            const recordKeys = ['email', 'url', 'avatar', 'description', 'com.twitter', 'com.github'];

            for (const key of recordKeys) {
                try {
                    const value = await resolver.getText(key);
                    if (value) records[key] = value;
                } catch {
                    // Record not set
                }
            }

            return {
                domain,
                owner,
                resolver: await resolver.getAddress() as string,
                records,
            };
        } catch (error) {
            logger.error('[ENSResolver] ENS info failed:', error);
            return null;
        }
    }

    /**
     * Get Unstoppable Domain info
     */
    private async getUDDomainInfo(domain: string): Promise<DomainInfo | null> {
        try {
            const response = await axios.get(`${UD_API}/domains/${domain}`, {
                headers: UD_API_KEY ? { 'Authorization': `Bearer ${UD_API_KEY}` } : {},
            });

            const data = response.data;

            return {
                domain,
                owner: data.meta?.owner || '',
                resolver: data.meta?.resolver || '',
                records: data.records || {},
            };
        } catch (error) {
            logger.error('[ENSResolver] UD info failed:', error);
            return null;
        }
    }

    /**
     * Validate if string is a valid domain or address
     */
    isValidInput(input: string): 'address' | 'domain' | 'invalid' {
        if (ethers.isAddress(input)) {
            return 'address';
        }

        // Check if it's a domain - use explicit string method
        if ((input as string).indexOf('.') !== -1 && (input as string).indexOf(' ') === -1) {
            return 'domain';
        }

        return 'invalid';
    }

    /**
     * Smart resolve - handles both addresses and domains
     */
    async smartResolve(input: string): Promise<{ address: string; displayName: string } | null> {
        const inputType = this.isValidInput(input);

        if (inputType === 'address') {
            const domain = await this.reverseResolve(input);
            return {
                address: input,
                displayName: domain || this.shortenAddress(input),
            };
        }

        if (inputType === 'domain') {
            const resolved = await this.resolve(input);
            if (resolved) {
                return {
                    address: resolved.address,
                    displayName: input,
                };
            }
        }

        return null;
    }

    /**
     * Shorten address for display
     */
    private shortenAddress(address: string): string {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

export const ensResolverService = new ENSResolverService();
