import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  X,
  Search,
  AlertCircle,
  CheckCircle,
  Loader,
  ExternalLink,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button, Badge, GlassCard } from "../ui";
import { StaggeredList } from "../ui";

interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  logo?: string;
  isVerified: boolean;
  isScam: boolean;
  holders?: number;
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

interface CustomTokenImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (token: TokenMetadata) => void;
  walletType?: "degen" | "regen";
}

export function CustomTokenImport({
  isOpen,
  onClose,
  onImport,
  walletType = "degen",
}: CustomTokenImportProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] =
    useState<TokenMetadata | null>(null);

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const fetchTokenMetadata = async (
    contractAddress: string,
  ): Promise<TokenMetadata> => {
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate different token types
    const mockTokens: Record<string, TokenMetadata> = {
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
        address: contractAddress,
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        totalSupply: "25000000000",
        isVerified: true,
        isScam: false,
        holders: 1500000,
        website: "https://www.circle.com/usdc",
        social: {
          twitter: "https://twitter.com/circle",
        },
      },
      "0x0000000000000000000000000000000000000001": {
        address: contractAddress,
        name: "Scam Token - Free ETH",
        symbol: "SCAM",
        decimals: 18,
        isVerified: false,
        isScam: true,
        holders: 10,
      },
    };

    const lowerAddress = contractAddress.toLowerCase();
    if (mockTokens[lowerAddress]) {
      return mockTokens[lowerAddress];
    }

    // Generate random token for demo
    return {
      address: contractAddress,
      name: "Custom Token",
      symbol: "CUSTOM",
      decimals: 18,
      totalSupply: "1000000000",
      isVerified: false,
      isScam: false,
      holders: Math.floor(Math.random() * 10000),
    };
  };

  const handleSearch = async () => {
    if (!address) {
      setError("Please enter a token contract address");
      return;
    }

    if (!isValidAddress(address)) {
      setError("Invalid Ethereum address format");
      return;
    }

    setLoading(true);
    setError(null);
    setTokenData(null);

    try {
      const metadata = await fetchTokenMetadata(address);
      setTokenData(metadata);

      if (metadata.isScam) {
        setError(
          "⚠️ Warning: This token shows signs of being a scam!",
        );
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to fetch token information",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (tokenData) {
      onImport(tokenData);
      handleClose();
    }
  };

  const handleClose = () => {
    setAddress("");
    setTokenData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-white/10 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Import Custom Token
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-wider">
                Add token by contract address
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6">
            <label className="text-sm text-white/70 mb-3 block font-black uppercase tracking-wider">
              Token Contract Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch()
                }
                placeholder="0x..."
                className="flex-1 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-white/30 outline-none font-mono"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleSearch}
                disabled={loading || !address}
                loading={loading}
                leftIcon={
                  !loading ? (
                    <Search className="w-5 h-5" />
                  ) : undefined
                }
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </motion.div>
            )}

            {/* Token Data */}
            {tokenData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                {/* Token Card */}
                <GlassCard
                  className={`${
                    tokenData.isScam
                      ? "border-red-500/50"
                      : "border-white/10"
                  }`}
                  style={
                    tokenData.isScam
                      ? {
                          background: "rgba(239, 68, 68, 0.1)",
                        }
                      : {}
                  }
                >
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                      }}
                    >
                      {tokenData.logo ? (
                        <img
                          src={tokenData.logo}
                          alt={tokenData.symbol}
                          className="w-full h-full rounded-2xl"
                        />
                      ) : (
                        "🪙"
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                          {tokenData.name}
                        </h3>
                        {tokenData.isVerified && (
                          <Badge
                            variant="success"
                            size="sm"
                            dot
                          >
                            Verified
                          </Badge>
                        )}
                        {tokenData.isScam && (
                          <Badge variant="error" size="sm">
                            SCAM
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-white/50 mb-3 uppercase tracking-wider font-bold">
                        {tokenData.symbol}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-white/40 block mb-1 uppercase tracking-wider">
                            Decimals:
                          </span>
                          <span className="text-white font-black">
                            {tokenData.decimals}
                          </span>
                        </div>
                        {tokenData.holders !== undefined && (
                          <div>
                            <span className="text-white/40 block mb-1 uppercase tracking-wider">
                              Holders:
                            </span>
                            <span className="text-white font-black">
                              {tokenData.holders.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract Address */}
                  <div className="mt-4 p-3 bg-black/40 backdrop-blur-xl rounded-xl">
                    <div className="text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">
                      Contract Address:
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-white/70 break-all font-mono">
                        {tokenData.address}
                      </code>
                      <a
                        href={`https://etherscan.io/token/${tokenData.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4 text-white/50" />
                      </a>
                    </div>
                  </div>

                  {/* Social Links */}
                  {tokenData.social && (
                    <div className="mt-3 flex gap-2">
                      {tokenData.social.twitter && (
                        <a
                          href={tokenData.social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg text-xs hover:bg-[#1DA1F2]/30 transition-colors font-black uppercase tracking-wider"
                        >
                          Twitter
                        </a>
                      )}
                      {tokenData.website && (
                        <a
                          href={tokenData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-xs hover:bg-white/10 transition-colors font-black uppercase tracking-wider"
                          style={{
                            background: `${accentColor}20`,
                            color: accentColor,
                          }}
                        >
                          Website
                        </a>
                      )}
                    </div>
                  )}
                </GlassCard>

                {/* Scam Warning */}
                {tokenData.isScam && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-200">
                        <strong className="block mb-2 font-black uppercase tracking-tight">
                          ⚠️ Warning: Potential Scam Token
                        </strong>
                        <p className="text-xs text-red-200/80">
                          This token shows characteristics of a
                          scam (suspicious name, low holders,
                          etc.). Importing this token may expose
                          you to phishing attacks. Proceed with
                          extreme caution.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Unverified Warning */}
                {!tokenData.isVerified && !tokenData.isScam && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-200">
                        <strong className="block mb-2 font-black uppercase tracking-tight">
                          Unverified Token
                        </strong>
                        <p className="text-xs text-yellow-200/80">
                          This token is not on our verified
                          list. Make sure you trust this token
                          before importing.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Import Button */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleClose}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleImport}
                    disabled={tokenData.isScam}
                    fullWidth
                  >
                    {tokenData.isScam
                      ? "Import Blocked"
                      : "Import Token"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tips */}
          {!tokenData && (
            <div className="p-6 pt-0">
              <GlassCard
                style={{
                  background: `linear-gradient(135deg, ${accentColor}10 0%, ${secondaryColor}05 100%)`,
                  borderColor: `${accentColor}30`,
                }}
              >
                <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: accentColor }}
                  />
                  💡 Tips
                </h3>
                <StaggeredList type="fade" staggerDelay={0.1}>
                  {[
                    "Paste the token's contract address from Etherscan",
                    "Only import tokens from sources you trust",
                    "Scam tokens may have similar names to popular tokens",
                    "Always verify the contract address on Etherscan",
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="text-xs text-white/70 mb-2 flex gap-2"
                    >
                      <span className="text-white/40">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </StaggeredList>
              </GlassCard>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CustomTokenImport;