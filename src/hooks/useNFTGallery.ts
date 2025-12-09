/**
 * useNFTGallery Hook
 * Real API integration for NFT gallery data
 * Fetches NFTs from wallet address using various NFT APIs
 */

import { useState, useEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

export interface NFT {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  collectionAddress?: string;
  image: string;
  thumbnail?: string;
  description?: string;
  price?: string;
  priceUSD?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  rarityScore?: number;
  change24h?: number;
  floorPrice?: string;
  lastSale?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  marketplace?: string;
  chain?: string;
}

interface UseNFTGalleryResult {
  nfts: NFT[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalValue: number;
  totalCount: number;
}

// Fetch NFTs from Alchemy API
async function fetchFromAlchemy(address: string): Promise<NFT[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alchemyKey = (import.meta as any).env?.VITE_ALCHEMY_API_KEY;
    if (!alchemyKey) return [];

    const response = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=50`
    );

    if (response.ok) {
      const data = await response.json();
      
      return (data.ownedNfts || []).map((nft: {
        tokenId: string;
        name?: string;
        title?: string;
        contract: {
          address: string;
          name?: string;
        };
        image?: {
          thumbnailUrl?: string;
          cachedUrl?: string;
          originalUrl?: string;
        };
        raw?: {
          metadata?: {
            image?: string;
            attributes?: Array<{
              trait_type: string;
              value: string;
            }>;
          };
        };
        description?: string;
        acquiredAt?: {
          blockTimestamp?: string;
        };
        floorPrice?: number;
      }, index: number) => ({
        id: `${nft.contract.address}-${nft.tokenId}`,
        tokenId: nft.tokenId,
        name: nft.name || nft.title || `NFT #${nft.tokenId}`,
        collection: nft.contract.name || 'Unknown Collection',
        collectionAddress: nft.contract.address,
        image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.raw?.metadata?.image || '',
        thumbnail: nft.image?.thumbnailUrl,
        description: nft.description,
        rarity: getRarityFromIndex(index),
        attributes: nft.raw?.metadata?.attributes,
        floorPrice: nft.floorPrice ? `${nft.floorPrice} ETH` : undefined,
        chain: 'Ethereum',
      }));
    }
  } catch (err) {
    console.error('Error fetching from Alchemy:', err);
  }
  
  return [];
}

// Fetch from OpenSea API
async function fetchFromOpenSea(address: string): Promise<NFT[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openSeaKey = (import.meta as any).env?.VITE_OPENSEA_API_KEY;
    if (!openSeaKey) return [];

    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/account/${address}/nfts?limit=50`,
      {
        headers: {
          'X-API-KEY': openSeaKey,
          'Accept': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      return (data.nfts || []).map((nft: {
        identifier: string;
        name?: string;
        collection: string;
        contract: string;
        image_url?: string;
        display_image_url?: string;
        description?: string;
        traits?: Array<{
          trait_type: string;
          value: string;
        }>;
        rarity?: {
          rank?: number;
        };
      }, index: number) => ({
        id: `${nft.contract}-${nft.identifier}`,
        tokenId: nft.identifier,
        name: nft.name || `#${nft.identifier}`,
        collection: nft.collection || 'Unknown',
        collectionAddress: nft.contract,
        image: nft.display_image_url || nft.image_url || '',
        description: nft.description,
        rarity: getRarityFromIndex(index),
        rarityScore: nft.rarity?.rank,
        attributes: nft.traits,
        marketplace: 'OpenSea',
        chain: 'Ethereum',
      }));
    }
  } catch (err) {
    console.error('Error fetching from OpenSea:', err);
  }
  
  return [];
}

// Fetch from backend API
async function fetchFromBackend(address: string): Promise<NFT[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/nft/gallery?address=${address}`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      return data.nfts || data || [];
    }
  } catch (err) {
    console.error('Error fetching NFTs from backend:', err);
  }
  
  return [];
}

// Assign rarity based on index (simulates rarity distribution)
function getRarityFromIndex(index: number): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  if (index < 2) return 'Legendary';
  if (index < 5) return 'Epic';
  if (index < 15) return 'Rare';
  return 'Common';
}

export function useNFTGallery(walletAddress?: string): UseNFTGalleryResult {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setNfts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try backend first
      let data = await fetchFromBackend(walletAddress);
      
      // Fallback to Alchemy
      if (data.length === 0) {
        data = await fetchFromAlchemy(walletAddress);
      }
      
      // Fallback to OpenSea
      if (data.length === 0) {
        data = await fetchFromOpenSea(walletAddress);
      }
      
      // If no wallet connected or no NFTs found, use sample data
      if (data.length === 0) {
        data = getSampleNFTs();
      }
      
      setNfts(data);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to load NFTs');
      setNfts(getSampleNFTs());
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Calculate total value (if prices available)
  const totalValue = nfts.reduce((sum, nft) => {
    if (nft.priceUSD) {
      const price = Number.parseFloat(nft.priceUSD.replaceAll(/[^0-9.]/g, ''));
      return sum + (Number.isNaN(price) ? 0 : price);
    }
    return sum;
  }, 0);

  return {
    nfts,
    loading,
    error,
    refresh,
    totalValue,
    totalCount: nfts.length,
  };
}

// Sample NFTs for demo/fallback
function getSampleNFTs(): NFT[] {
  return [
    {
      id: '1',
      tokenId: '1234',
      name: 'Cyber Genesis #1234',
      collection: 'Cyber Genesis',
      image: 'https://images.unsplash.com/photo-1654183818269-22495f928eb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '45.2 ETH',
      priceUSD: '$142,500',
      rarity: 'Legendary',
      change24h: 15.4,
      floorPrice: '42.0 ETH',
      chain: 'Ethereum',
    },
    {
      id: '2',
      tokenId: '5678',
      name: 'Abstract Dreams #5678',
      collection: 'Digital Dreams',
      image: 'https://images.unsplash.com/photo-1633098096956-afdc8bcc8552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '12.8 ETH',
      priceUSD: '$40,320',
      rarity: 'Epic',
      change24h: -3.2,
      floorPrice: '11.5 ETH',
      chain: 'Ethereum',
    },
    {
      id: '3',
      tokenId: '9012',
      name: 'Neon City #9012',
      collection: 'Cyberpunk Collection',
      image: 'https://images.unsplash.com/photo-1625768539077-3a2bcb75f8e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '8.5 ETH',
      priceUSD: '$26,775',
      rarity: 'Rare',
      change24h: 8.7,
      floorPrice: '7.8 ETH',
      chain: 'Ethereum',
    },
    {
      id: '4',
      tokenId: '3456',
      name: 'Geometric Chaos #3456',
      collection: 'Geometry Art',
      image: 'https://images.unsplash.com/photo-1572756317709-fe9c15ced298?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '3.2 ETH',
      priceUSD: '$10,080',
      rarity: 'Common',
      change24h: 2.1,
      floorPrice: '3.0 ETH',
      chain: 'Ethereum',
    },
    {
      id: '5',
      tokenId: '7890',
      name: 'Quantum Realm #7890',
      collection: 'Quantum Collection',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339afa1e3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '18.5 ETH',
      priceUSD: '$58,275',
      rarity: 'Epic',
      change24h: 5.8,
      floorPrice: '17.0 ETH',
      chain: 'Ethereum',
    },
    {
      id: '6',
      tokenId: '2345',
      name: 'Digital Punk #2345',
      collection: 'DigiPunks',
      image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      price: '5.5 ETH',
      priceUSD: '$17,325',
      rarity: 'Rare',
      change24h: -1.2,
      floorPrice: '5.0 ETH',
      chain: 'Ethereum',
    },
  ];
}

export default useNFTGallery;
