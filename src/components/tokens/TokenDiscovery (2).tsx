import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Zap,
  Star,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { SwipeableCard } from "../SwipeableCard";
import { getTrendingTokens, TrendingToken } from "../../utils/api-client";

interface TokenDiscoveryProps {
  onTrade: (token: any) => void;
  onAnalyze: (token: any) => void;
  type?: 'degen' | 'regen';
}

interface DisplayToken {
  symbol: string;
  name: string;
  logo: string;
  price: string;
  priceChange24h: number;
  marketCapRank: number;
  chain: string;
  tokenId: string;
}

export function TokenDiscovery({
  onTrade,
  onAnalyze,
  type = 'degen',
}: TokenDiscoveryProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "trending" | "new" | "safe" | "risky"
  >("trending");
  const [tokens, setTokens] = useState<DisplayToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrendingTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getTrendingTokens();
      
      if (response.trending && response.trending.length > 0) {
        const displayTokens: DisplayToken[] = response.trending.map((token: TrendingToken) => ({
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          logo: token.thumb || token.large || '',
          price: token.price ? `$${token.price.toFixed(6)}` : 'N/A',
          priceChange24h: token.priceChange24h || 0,
          marketCapRank: token.marketCapRank || 0,
          chain: "ETH",
          tokenId: token.id,
        }));
        
        setTokens(displayTokens);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch trending tokens:', err);
      setError('Unable to load trending tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingTokens();
    
    const intervalId = setInterval(fetchTrendingTokens, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchTrendingTokens]);

  const filterTokens = () => {
    let filtered = [...tokens];

    switch (activeFilter) {
      case "trending":
        filtered.sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999));
        break;
      case "new":
        filtered = filtered.slice().reverse();
        break;
      case "safe":
        filtered = filtered
          .filter((t) => (t.marketCapRank || 999) <= 100)
          .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999));
        break;
      case "risky":
        filtered = filtered
          .filter((t) => Math.abs(t.priceChange24h) > 10)
          .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));
        break;
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.symbol
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          t.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const filteredTokens = filterTokens();

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Token Discovery
            </h2>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">
              {lastUpdated 
                ? `Live • Updated ${lastUpdated.toLocaleTimeString()}`
                : 'Live feed • Auto-refreshes every 30s'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={fetchTrendingTokens}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: accentColor }} />
            </motion.button>
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{
                duration: 2,
                repeat: isLoading ? Infinity : 0,
                ease: "linear",
              }}
              className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-400'}`}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            className="w-full bg-black/40 rounded-xl pl-11 pr-11 py-3 text-sm text-white focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder-white/30 border border-white/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            {
              id: "trending",
              label: "Trending",
              icon: TrendingUp,
            },
            { id: "new", label: "New Launches", icon: Clock },
            { id: "safe", label: "Safe Picks", icon: Zap },
            { id: "risky", label: "High Risk", icon: Flame },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <motion.button
                key={filter.id}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setActiveFilter(filter.id as any)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs whitespace-nowrap transition-all font-black uppercase tracking-wider ${
                  activeFilter === filter.id
                    ? "text-white"
                    : "bg-white/5 text-white/50 hover:text-white/70 border border-white/10"
                }`}
                style={activeFilter === filter.id ? {
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                  boxShadow: `0 0 20px ${accentColor}40`,
                } : {}}
              >
                <Icon className="w-3 h-3" />
                {filter.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-white/70 mb-4">{error}</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchTrendingTokens}
              className="px-4 py-2 rounded-lg font-black uppercase tracking-wider text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : isLoading && tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" style={{ color: accentColor }} />
            <p className="text-white/50 uppercase tracking-wider font-bold">Loading trending tokens...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
                <motion.div
                  key={token.tokenId || token.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SwipeableCard
                    onSwipeLeft={() => console.log('Dismiss:', token.symbol)}
                    onSwipeRight={() => onTrade(token)}
                    leftAction={
                      <div className="flex items-center gap-2 text-red-400">
                        <Trash2 className="w-5 h-5" />
                        <span className="font-black uppercase tracking-wider">Hide</span>
                      </div>
                    }
                    rightAction={
                      <div className="flex items-center gap-2 text-green-400">
                        <Star className="w-5 h-5" />
                        <span className="font-black uppercase tracking-wider">Trade</span>
                      </div>
                    }
                  >
                    <div 
                      className="p-4 rounded-xl backdrop-blur-xl cursor-pointer hover:bg-white/5 transition-all bg-black/40 border border-white/10"
                      onClick={() => onAnalyze(token)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {token.logo ? (
                            <img 
                              src={token.logo} 
                              alt={token.symbol}
                              className="w-10 h-10 rounded-full bg-white/5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--color-purple)] flex items-center justify-center text-white font-black">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-black uppercase tracking-tight">{token.symbol}</h3>
                              {token.marketCapRank && token.marketCapRank <= 100 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded uppercase tracking-wider font-black" style={{
                                  background: `${accentColor}20`,
                                  color: accentColor,
                                }}>
                                  #{token.marketCapRank}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 uppercase tracking-wider">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black">{token.price}</p>
                          <p className={`text-xs flex items-center justify-end gap-1 font-black ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.priceChange24h >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </SwipeableCard>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-white/50"
              >
                <p className="uppercase tracking-wider font-bold">No tokens match your search</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Live Update Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-black/40 border-t border-white/10"
      >
        <div className="flex items-center justify-center gap-2 text-xs text-white/50 uppercase tracking-wider font-bold">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
          <span>Live data feed active</span>
        </div>
      </motion.div>
    </div>
  );
}
