import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
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
} from "lucide-react";

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  price: string;
  priceUSD: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  change24h: number;
  floorPrice: string;
}

interface NFTGalleryProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function NFTGallery({ type, onClose }: NFTGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [filter, setFilter] = useState<"all" | "rare" | "legendary">("all");

  const isDegen = type === "degen";

  // Color system based on tribe
  const colors = {
    primary: isDegen ? "#ff3366" : "#00d4ff",
    secondary: isDegen ? "#ff9500" : "#00ff88",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 149, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)",
    border: isDegen ? "rgba(255, 51, 102, 0.2)" : "rgba(0, 212, 255, 0.2)",
    glow: isDegen
      ? "0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 149, 0, 0.2)"
      : "0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 255, 136, 0.2)",
  };

  const nfts: NFT[] = [
    {
      id: "1",
      name: "Cyber Genesis #1234",
      collection: "Cyber Genesis",
      image: "https://images.unsplash.com/photo-1654183818269-22495f928eb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "45.2 ETH",
      priceUSD: "$142,500",
      rarity: "Legendary",
      change24h: 15.4,
      floorPrice: "42.0 ETH",
    },
    {
      id: "2",
      name: "Abstract Dreams #5678",
      collection: "Digital Dreams",
      image: "https://images.unsplash.com/photo-1633098096956-afdc8bcc8552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "12.8 ETH",
      priceUSD: "$40,320",
      rarity: "Epic",
      change24h: -3.2,
      floorPrice: "11.5 ETH",
    },
    {
      id: "3",
      name: "Neon City #9012",
      collection: "Cyberpunk Collection",
      image: "https://images.unsplash.com/photo-1625768539077-3a2bcb75f8e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "8.5 ETH",
      priceUSD: "$26,775",
      rarity: "Rare",
      change24h: 8.7,
      floorPrice: "7.8 ETH",
    },
    {
      id: "4",
      name: "Geometric Chaos #3456",
      collection: "Geometry Art",
      image: "https://images.unsplash.com/photo-1572756317709-fe9c15ced298?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "3.2 ETH",
      priceUSD: "$10,080",
      rarity: "Common",
      change24h: 2.1,
      floorPrice: "3.0 ETH",
    },
    {
      id: "5",
      name: "Neon Waves #7890",
      collection: "Abstract Neon",
      image: "https://images.unsplash.com/photo-1626908013351-800ddd734b8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "22.0 ETH",
      priceUSD: "$69,300",
      rarity: "Epic",
      change24h: 12.3,
      floorPrice: "20.5 ETH",
    },
    {
      id: "6",
      name: "Future Vision #2468",
      collection: "Futuristic Art",
      image: "https://images.unsplash.com/photo-1684355277143-69c991fa052a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: "67.5 ETH",
      priceUSD: "$212,625",
      rarity: "Legendary",
      change24h: 24.6,
      floorPrice: "65.0 ETH",
    },
  ];

  const filteredNFTs = nfts.filter((nft) => {
    if (filter === "all") return true;
    if (filter === "rare") return nft.rarity === "Rare" || nft.rarity === "Epic";
    if (filter === "legendary") return nft.rarity === "Legendary";
    return true;
  });

  const totalValue = nfts.reduce((sum, nft) => {
    const ethValue = parseFloat(nft.price.replace(" ETH", ""));
    return sum + ethValue;
  }, 0);

  const avgChange = nfts.reduce((sum, nft) => sum + nft.change24h, 0) / nfts.length;

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
      className="fixed inset-0 bg-black z-50 overflow-y-auto pb-24"
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
                  <h2 className="text-white">NFT Collection</h2>
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
              <div className="text-xs text-white/60">Total Value</div>
              <div className="text-white mt-1">{totalValue.toFixed(1)} ETH</div>
              <div className="text-xs text-white/40 mt-0.5">
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
              <div className="text-xs text-white/60">Items</div>
              <div className="text-white mt-1">{nfts.length}</div>
              <div className="text-xs text-white/40 mt-0.5">
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
              <div className="text-xs text-white/60">Avg Change</div>
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
              <div className="text-xs text-white/40 mt-0.5">24h</div>
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
                className={`rounded-xl border backdrop-blur-sm overflow-hidden cursor-pointer transition-all ${
                  viewMode === "list" ? "flex items-center gap-4" : ""
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
                      <div className="text-sm text-white mb-1">
                        {nft.name}
                      </div>
                      <div className="text-xs text-white/50 mb-3">
                        {nft.collection}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white/50">Price</div>
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
                      <div className="text-sm text-white mb-1">
                        {nft.name}
                      </div>
                      <div className="text-xs text-white/50 mb-2">
                        {nft.collection}
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-xs" style={{ color: colors.primary }}>
                            {nft.price}
                          </div>
                          <div className="text-xs text-white/40">
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
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50"
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
                <h3 className="text-xl text-white mb-1">
                  {selectedNFT.name}
                </h3>
                <p className="text-sm text-white/60 mb-6">
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
                    <div className="text-xs text-white/60 mb-1">Current Price</div>
                    <div className="text-lg text-white">
                      {selectedNFT.price}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
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
                    <div className="text-xs text-white/60 mb-1">Floor Price</div>
                    <div className="text-lg text-white">
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
                    <Heart className="w-5 h-5 text-white/60" />
                    <span className="text-white/60 text-sm">Like</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Share2 className="w-5 h-5 text-white/60" />
                    <span className="text-white/60 text-sm">Share</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <ExternalLink className="w-5 h-5 text-white/60" />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedNFT(null)}
                  className="w-full py-3 rounded-xl transition-all text-white"
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
