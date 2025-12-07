import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  X,
  Search,
  Plus,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  address?: string;
  isVisible: boolean;
  isCustom?: boolean;
  icon?: string;
}

interface TokenManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'degen' | 'regen';
}

export function TokenManagementModal({
  isOpen,
  onClose,
  type = 'degen',
}: TokenManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "import">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [hideSpam, setHideSpam] = useState(true);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const [tokens, setTokens] = useState<Token[]>([
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "12.45",
      value: "$24,890",
      isVisible: true,
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.234",
      value: "$10,450",
      isVisible: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: "5,000",
      value: "$5,000",
      isVisible: true,
    },
    {
      symbol: "ARB",
      name: "Arbitrum",
      balance: "450",
      value: "$890",
      isVisible: true,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      balance: "0.00",
      value: "$0.00",
      isVisible: false,
    },
    {
      symbol: "UNI",
      name: "Uniswap",
      balance: "0.00",
      value: "$0.00",
      isVisible: false,
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      balance: "0.00",
      value: "$0.00",
      isVisible: false,
    },
  ]);

  const toggleVisibility = (symbol: string) => {
    setTokens(
      tokens.map((t) =>
        t.symbol === symbol
          ? { ...t, isVisible: !t.isVisible }
          : t,
      ),
    );
  };

  const handleImport = () => {
    // Simulate token import
    if (customAddress) {
      setTokens([
        ...tokens,
        {
          symbol: "PEPE",
          name: "Pepe",
          balance: "0.00",
          value: "$0.00",
          address: customAddress,
          isVisible: true,
          isCustom: true,
        },
      ]);
      setCustomAddress("");
      setActiveTab("list");
    }
  };

  const filteredTokens = tokens.filter(
    (t) =>
      t.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      t.symbol
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-black text-white uppercase tracking-tight">
              Manage Tokens
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-2 gap-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "list"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Token List
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "import"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Import Custom
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "list" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search name or symbol..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-white/30 outline-none text-sm placeholder:text-white/30"
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-white/50 uppercase tracking-wider">
                    {filteredTokens.length} tokens
                  </span>
                  <button
                    onClick={() => setHideSpam(!hideSpam)}
                    className={`text-xs flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                      hideSpam
                        ? "text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                    style={hideSpam ? {
                      background: `${accentColor}20`,
                      color: accentColor,
                    } : {}}
                  >
                    {hideSpam ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-white/40" />
                    )}
                    <span className="font-black uppercase tracking-wider">Hide Spam</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--color-purple)] rounded-full flex items-center justify-center text-xs font-black text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm text-white font-bold">
                            {token.name}
                          </div>
                          <div className="text-xs text-white/50">
                            {token.balance} {token.symbol}
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={token.isVisible}
                          onChange={() =>
                            toggleVisibility(token.symbol)
                          }
                        />
                        <div 
                          className="w-11 h-6 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            background: token.isVisible ? accentColor : 'rgba(255,255,255,0.1)',
                          }}
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div className="text-xs text-yellow-200">
                    Anyone can create a token, including fake
                    versions of existing tokens. Learn about
                    scams and security risks.
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-bold">
                      Token Contract Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customAddress}
                      onChange={(e) =>
                        setCustomAddress(e.target.value)
                      }
                      className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-white/30 outline-none font-mono text-sm placeholder:text-white/30"
                    />
                  </div>

                  {customAddress.length > 10 && (
                    <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50 uppercase tracking-wider">
                          Symbol
                        </span>
                        <span className="text-white font-bold">
                          PEPE
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50 uppercase tracking-wider">
                          Decimals
                        </span>
                        <span className="text-white font-bold">
                          18
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={!customAddress}
                    className="w-full py-3 text-white font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${isDegen ? '#8B0000' : '#000080'} 100%)`,
                      boxShadow: `0 0 30px ${accentColor}40`,
                    }}
                  >
                    Import Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
