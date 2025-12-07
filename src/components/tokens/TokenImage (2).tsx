import { useState } from "react";

interface TokenImageProps {
  symbol: string;
  contractAddress: string;
  chain: string;
  logo?: string;
  size?: "sm" | "md" | "lg";
}

// Map chain abbreviations to 1inch chain IDs
const CHAIN_ID_MAP: Record<string, number> = {
  ETH: 1,
  BSC: 56,
  BASE: 8453,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
  FANTOM: 250,
};

// Get Trust Wallet asset URL
const getTrustWalletUrl = (contractAddress: string, chain: string): string => {
  const chainName = chain === "ETH" ? "ethereum" : 
                    chain === "BSC" ? "smartchain" :
                    chain === "BASE" ? "base" :
                    chain === "POLYGON" ? "polygon" :
                    chain === "ARBITRUM" ? "arbitrum" :
                    chain === "OPTIMISM" ? "optimism" :
                    chain === "AVALANCHE" ? "avalanche" :
                    "ethereum";
  
  // Trust Wallet uses checksummed addresses
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${contractAddress}/logo.png`;
};

// Get 1inch token icon URL
const get1inchUrl = (contractAddress: string, chain: string): string => {
  const chainId = CHAIN_ID_MAP[chain] || 1;
  return `https://tokens.1inch.io/v1.2/${chainId}/${contractAddress.toLowerCase()}`;
};

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const TEXT_SIZES = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl",
};

export function TokenImage({ 
  symbol, 
  contractAddress, 
  chain, 
  logo,
  size = "md" 
}: TokenImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(
    logo || getTrustWalletUrl(contractAddress, chain)
  );
  const [fallbackAttempted, setFallbackAttempted] = useState(0);

  const handleImageError = () => {
    if (fallbackAttempted === 0) {
      // First fallback: Try 1inch
      setImgSrc(get1inchUrl(contractAddress, chain));
      setFallbackAttempted(1);
    } else if (fallbackAttempted === 1 && !logo) {
      // Second fallback: Try Trust Wallet if we started with something else
      setImgSrc(getTrustWalletUrl(contractAddress, chain));
      setFallbackAttempted(2);
    } else {
      // All fallbacks exhausted, show placeholder
      setImgSrc(null);
    }
  };

  if (!imgSrc) {
    return (
      <div className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--color-purple)] flex items-center justify-center text-white font-black ${TEXT_SIZES[size]}`}>
        {symbol[0]}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={symbol}
      className={`${SIZE_CLASSES[size]} rounded-full bg-[var(--bg-surface)]`}
      onError={handleImageError}
    />
  );
}
