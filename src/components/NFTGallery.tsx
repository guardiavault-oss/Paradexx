import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  Grid3x3,
  List,
  ExternalLink,
  Heart,
  Share2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useNFTGallery, type NFT } from "../hooks/useNFTGallery";

interface NFTGalleryProps {
  type: "degen" | "regen";
  onClose: () => void;
  walletAddress?: string;
}

export function NFTGallery({ type, onClose, walletAddress }: NFTGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [filter, setFilter] = useState<"all" | "rare" | "legendary">("all");

  const isDegen = type === "degen";

  // Use real API hook for NFT gallery
  const { nfts, loading, refresh, totalValue: calculatedTotal, totalCount } = useNFTGallery(walletAddress);

  // Color system based on tribe
  const colors = {
    primary: isDegen ? getThemeStyles().colors.degenPrimary : getThemeStyles().colors.regenPrimary,
    secondary: isDegen ? getThemeStyles().colors.degenSecondary : getThemeStyles().colors.regenSecondary,
    gradient: isDegen
      ? `linear-gradient(135deg, ${getThemeStyles().colors.degenGradientStart} 0%, ${getThemeStyles().colors.degenGradientEnd} 100%)`
      : `linear-gradient(135deg, ${getThemeStyles().colors.regenGradientStart} 0%, ${getThemeStyles().colors.regenGradientEnd} 100%)`,
    border: isDegen ? getThemeStyles().colors.degenBorder : getThemeStyles().colors.regenBorder,
    glow: isDegen
      ? `0 0 20px ${getThemeStyles().colors.degenGlow}, 0 0 40px ${getThemeStyles().colors.degenGlowSecondary}`
      : `0 0 20px ${getThemeStyles().colors.regenGlow}, 0 0 40px ${getThemeStyles().colors.regenGlowSecondary}`,
  };

  const filteredNFTs = nfts.filter((nft) => {
    if (filter === "all") return true;
    if (filter === "rare") return nft.rarity === "Rare" || nft.rarity === "Epic";
    if (filter === "legendary") return nft.rarity === "Legendary";
    return true;
  });

  const totalValue = nfts.reduce((sum, nft) => {
    if (nft.price) {
      const ethValue = Number.parseFloat(nft.price.replaceAll(" ETH", "").replaceAll(",", ""));
      return sum + (Number.isNaN(ethValue) ? 0 : ethValue);
    }
    return sum;
  }, 0);

  const avgChange = nfts.length > 0 
    ? nfts.reduce((sum, nft) => sum + (nft.change24h || 0), 0) / nfts.length
    : 0;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return isDegen ? "#ff3366" : "#00d4ff";
      case "Epic":
        return isDegen ? "#ff9500" : "#00ff88";
      case "Rare":
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return isDegen ? "rgba(255, 51, 102, 0.1)" : "rgba(0, 212, 255, 0.1)";
      case "Epic":
        return isDegen ? "rgba(255, 149, 0, 0.1)" : "rgba(0, 255, 136, 0.1)";
      case "Rare":
        return "rgba(168, 85, 247, 0.1)";
      default:
        return "rgba(107, 114, 128, 0.1)";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--bg-base)] z-50 overflow-y-auto pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          borderColor: colors.border,
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: colors.primary }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: colors.primary }} />
                  <h2 className="text-[var(--text-primary)]">NFT Collection</h2>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("grid")}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: viewMode === "grid" ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${viewMode === "grid" ? colors.primary : colors.border}`,
                }}
              >
                <Grid3x3 className="w-5 h-5" style={{ color: viewMode === "grid" ? colors.primary : "#6b7280" }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: viewMode === "list" ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${viewMode === "list" ? colors.primary : colors.border}`,
                }}
              >
                <List className="w-5 h-5" style={{ color: viewMode === "list" ? colors.primary : "#6b7280" }} />
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Total Value</div>
              <div className="text-[var(--text-primary)] mt-1">{totalValue.toFixed(1)} ETH</div>
              <div className="text-xs text-[var(--text-primary)]/40 mt-0.5">
                ${(totalValue * 3150).toLocaleString()}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Items</div>
              <div className="text-[var(--text-primary)] mt-1">{nfts.length}</div>
              <div className="text-xs text-[var(--text-primary)]/40 mt-0.5">
                Collections: 6
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Avg Change</div>
              <div className="flex items-center gap-1 mt-1">
                {avgChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className="text-sm"
                  style={{ color: avgChange >= 0 ? colors.secondary : "#ef4444" }}
                >
                  {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-[var(--text-primary)]/40 mt-0.5">24h</div>
            </motion.div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["all", "rare", "legendary"].map((f) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f as any)}
                className="px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm"
                style={{
                  background: filter === f ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${filter === f ? colors.primary : colors.border}`,
                  color: filter === f ? colors.primary : "#9ca3af",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* NFT Grid/List */}
      <div className="px-4 pt-4">
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3"
              : "space-y-3"
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredNFTs.map((nft, index) => (
              <motion.div
                key={nft.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedNFT(nft)}
                className={`rounded-xl border backdrop-blur-sm overflow-hidden cursor-pointer transition-all ${viewMode === "list" ? "flex items-center gap-4" : ""
                  }`}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs backdrop-blur-xl border"
                        style={{
                          background: getRarityBg(nft.rarity),
                          borderColor: getRarityColor(nft.rarity),
                          color: getRarityColor(nft.rarity),
                        }}
                      >
                        {nft.rarity}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-[var(--text-primary)] mb-1">
                        {nft.name}
                      </div>
                      <div className="text-xs text-[var(--text-primary)]/50 mb-3">
                        {nft.collection}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-[var(--text-primary)]/50">Price</div>
                          <div className="text-sm" style={{ color: colors.primary }}>
                            {nft.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {nft.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className="text-xs"
                            style={{ color: nft.change24h >= 0 ? colors.secondary : "#ef4444" }}
                          >
                            {nft.change24h >= 0 ? "+" : ""}{nft.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 m-3 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-3 pr-3">
                      <div className="text-sm text-[var(--text-primary)] mb-1">
                        {nft.name}
                      </div>
                      <div className="text-xs text-[var(--text-primary)]/50 mb-2">
                        {nft.collection}
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-xs" style={{ color: colors.primary }}>
                            {nft.price}
                          </div>
                          <div className="text-xs text-[var(--text-primary)]/40">
                            {nft.priceUSD}
                          </div>
                        </div>
                        <div
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: getRarityBg(nft.rarity),
                            color: getRarityColor(nft.rarity),
                          }}
                        >
                          {nft.rarity}
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          {nft.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className="text-xs"
                            style={{ color: nft.change24h >= 0 ? colors.secondary : "#ef4444" }}
                          >
                            {nft.change24h >= 0 ? "+" : ""}{nft.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNFT(null)}
              className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border z-50 overflow-hidden"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: colors.border,
                boxShadow: colors.glow,
              }}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-xl backdrop-blur-xl border"
                  style={{
                    background: getRarityBg(selectedNFT.rarity),
                    borderColor: getRarityColor(selectedNFT.rarity),
                    color: getRarityColor(selectedNFT.rarity),
                  }}
                >
                  {selectedNFT.rarity}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl text-[var(--text-primary)] mb-1">
                  {selectedNFT.name}
                </h3>
                <p className="text-sm text-[var(--text-primary)]/60 mb-6">
                  {selectedNFT.collection}
                </p>

                {/* Price Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: colors.gradient,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-xs text-[var(--text-primary)]/60 mb-1">Current Price</div>
                    <div className="text-lg text-[var(--text-primary)]">
                      {selectedNFT.price}
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/40 mt-1">
                      {selectedNFT.priceUSD}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: colors.gradient,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-xs text-[var(--text-primary)]/60 mb-1">Floor Price</div>
                    <div className="text-lg text-[var(--text-primary)]">
                      {selectedNFT.floorPrice}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {selectedNFT.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span
                        className="text-xs"
                        style={{ color: selectedNFT.change24h >= 0 ? colors.secondary : "#ef4444" }}
                      >
                        {selectedNFT.change24h >= 0 ? "+" : ""}{selectedNFT.change24h}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Heart className="w-5 h-5 text-[var(--text-primary)]/60" />
                    <span className="text-[var(--text-primary)]/60 text-sm">Like</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Share2 className="w-5 h-5 text-[var(--text-primary)]/60" />
                    <span className="text-[var(--text-primary)]/60 text-sm">Share</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <ExternalLink className="w-5 h-5 text-[var(--text-primary)]/60" />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedNFT(null)}
                  className="w-full py-3 rounded-xl transition-all text-[var(--text-primary)]"
                  style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.primary}`,
                    boxShadow: `0 0 20px ${colors.primary}40`,
                  }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
