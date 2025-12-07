import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../../design-system";
import {
  X,
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Zap,
  Shield,
  Wallet,
  RefreshCw,
  Send,
  Download,
  Settings,
  AlertCircle,
} from "lucide-react";
import { GlassCard, Button, Badge, StaggeredList } from "../ui";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  popular?: boolean;
}

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  walletType?: "degen" | "regen";
}

const HELP_CATEGORIES = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Book,
    color: "#10B981",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    color: "#EF4444",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: Send,
    color: "#8B5CF6",
  },
  {
    id: "wallet",
    label: "Wallet Management",
    icon: Wallet,
    color: "#3B82F6",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: AlertCircle,
    color: "#F59E0B",
  },
];

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "what-is-paradex",
    title: "What is Paradex Wallet?",
    category: "getting-started",
    content: `Paradex Wallet is a next-generation crypto wallet with dual identities:

**Degen Mode (Fire 🔥):**
- High-risk, high-reward features
- Sniper bots, leverage trading
- Real-time memecoin tracking
- Aggressive trading tools

**Regen Mode (Ice ❄️):**
- Long-term wealth protection
- Inheritance planning
- Vault management
- Security-first approach

Choose the mode that fits your crypto journey, or switch between them as needed!`,
    tags: ["beginner", "overview"],
    popular: true,
  },
  {
    id: "first-transaction",
    title: "How to make your first transaction",
    category: "getting-started",
    content: `Making your first transaction is easy:

**1. Get some crypto:**
- Use the "Buy" button to purchase with card
- Receive crypto from another wallet
- Bridge from another chain

**2. Send or Swap:**
- **Send:** Transfer to another wallet address
- **Swap:** Exchange one token for another

**3. Review fees:**
- Network gas fee (paid to validators)
- Protocol fee (DEX/Bridge fee)
- Service fee (Paradox fee)

**4. Confirm:**
- Review all details
- Check the "You Receive" amount
- Confirm with PIN or biometrics

💡 **Tip:** Use our guided walkthrough for first-timers!`,
    tags: ["beginner", "transaction", "send", "swap"],
    popular: true,
  },
  {
    id: "decoy-wallet",
    title: "What is Decoy Wallet Mode?",
    category: "security",
    content: `Decoy Wallet Mode protects you from physical threats (wrench attacks):

**How it works:**
1. Set up a decoy PIN (different from your real PIN)
2. The decoy PIN shows a fake wallet with small amounts
3. Your real assets remain hidden and safe

**When to use:**
- Travel to high-risk areas
- Meeting strangers for crypto trades
- Any situation where you might be forced to unlock

**Setup:**
Settings → Security → Decoy Wallet Mode

⚠️ **Never tell anyone about this feature!**`,
    tags: ["security", "safety", "advanced"],
    popular: true,
  },
  {
    id: "gas-fees",
    title: "Understanding Gas Fees",
    category: "transactions",
    content: `Gas fees are the cost to process transactions on the blockchain.

**What affects gas fees:**
- Network congestion (higher demand = higher fees)
- Transaction complexity (swaps cost more than sends)
- Gas speed (faster = more expensive)

**How to save on gas:**
- Use "Slow" speed for non-urgent transactions
- Transact during low-traffic hours (weekends)
- Batch multiple transactions together
- Use Layer 2 networks (Arbitrum, Optimism)

**Fee breakdown:**
- **Network Gas:** Paid to validators
- **Protocol Fee:** DEX/Bridge fee
- **Service Fee:** Paradox fee (0.5% swaps, 0.1% bridges)

💡 Use our Gas Manager to find the best times!`,
    tags: ["fees", "gas", "transaction"],
    popular: true,
  },
  {
    id: "import-token",
    title: "How to import custom tokens",
    category: "wallet",
    content: `Add any ERC-20 token to your wallet:

**Steps:**
1. Go to More → Import Custom Token
2. Paste the token's contract address
3. Review token details (name, symbol, decimals)
4. Check security badges (Verified, Audited)
5. Import if safe

**Safety checks:**
✅ Verified contracts
✅ Holder count
✅ Audit reports
⚠️ Scam detection

**Where to find contract addresses:**
- CoinGecko
- CoinMarketCap
- Etherscan
- Project's official website

⚠️ **Never import tokens from unknown sources!**`,
    tags: ["token", "import", "wallet"],
    popular: false,
  },
  {
    id: "honeypot-scams",
    title: "What are honeypot scams?",
    category: "security",
    content: `Honeypot tokens are scams that let you buy but not sell.

**How they work:**
1. Scammers create a token with hidden code
2. You can buy the token easily
3. When you try to sell, the transaction fails
4. Your money is trapped

**How Paradox protects you:**
✅ Automatic honeypot detection
✅ Pre-transaction scanning
✅ Sell tax analysis
✅ Contract code review

**Red flags:**
- 99% sell tax
- Transfer restrictions
- Blacklist functions
- Anonymous team
- Unrealistic promises

💡 If it sounds too good to be true, it probably is!`,
    tags: ["security", "scam", "honeypot"],
    popular: true,
  },
  {
    id: "mev-protection",
    title: "What is MEV Protection?",
    category: "security",
    content: `MEV (Maximal Extractable Value) is when bots front-run your trades.

**How front-running works:**
1. Bot sees your pending transaction
2. Bot pays higher gas to execute first
3. Bot buys before you, driving up price
4. You pay more than expected

**Paradox MEV Protection:**
✅ Private transaction relay
✅ Flashbots integration
✅ Slippage protection
✅ Priority execution

**Enabled by default for all swaps!**

This ensures you get the best price without being exploited by MEV bots.`,
    tags: ["security", "mev", "trading", "advanced"],
    popular: false,
  },
  {
    id: "recovery-phrase",
    title: "How to backup your recovery phrase",
    category: "security",
    content: `Your recovery phrase is the ONLY way to restore your wallet.

**Critical rules:**
⚠️ NEVER share with anyone
⚠️ NEVER store digitally (no screenshots, cloud)
⚠️ NEVER type into websites or apps

**Backup methods:**
✅ Write on paper (2-3 copies)
✅ Use a metal backup plate
✅ Store in fireproof safe
✅ Consider multi-location storage

**Where to store:**
- Home safe
- Bank safe deposit box
- Trusted family member (sealed envelope)

**What NOT to do:**
❌ Screenshot on phone
❌ Save in notes app
❌ Email to yourself
❌ Store in cloud (Google Drive, iCloud)
❌ Share with support (we'll never ask)

💡 Your phrase = your crypto. Protect it like cash!`,
    tags: ["security", "backup", "recovery", "beginner"],
    popular: true,
  },
  {
    id: "transaction-stuck",
    title: "My transaction is stuck. What do I do?",
    category: "troubleshooting",
    content: `Transactions can get stuck due to low gas fees.

**Why it happens:**
- Gas price was too low
- Network congestion increased
- Transaction not picked up by miners

**Solutions:**

**Option 1: Wait it out**
- Most transactions process within 24 hours
- Check status on Etherscan

**Option 2: Speed up**
1. Go to Activity → Pending
2. Click "Speed Up"
3. Pay higher gas fee
4. New transaction replaces old one

**Option 3: Cancel**
1. Go to Activity → Pending
2. Click "Cancel"
3. Pay gas to cancel
4. Submit new transaction

💡 Use "Normal" or "Fast" gas to avoid this!`,
    tags: ["troubleshooting", "transaction", "gas"],
    popular: true,
  },
  {
    id: "dapp-store",
    title: "What is the Curated dApp Store?",
    category: "wallet",
    content: `The dApp Store is your gateway to verified DeFi apps.

**Why use it:**
✅ Every dApp is security-verified
✅ Trust scores (0-100)
✅ Audit reports displayed
✅ Scam filtering
✅ Beginner-safe mode

**Categories:**
- DEXs (Uniswap, SushiSwap)
- Lending (Aave, Compound)
- Staking (Lido, Rocket Pool)
- NFTs (OpenSea, Blur)
- Bridges (Stargate, Across)
- Gaming (Axie Infinity)

**Trust badges:**
🛡️ Audited
📊 High TVL
✅ Official
⭐ Popular
🆕 New

💡 Only use dApps from our curated store for maximum safety!`,
    tags: ["dapp", "defi", "safety"],
    popular: false,
  },
];

export function HelpCenter({
  isOpen,
  onClose,
  walletType = "degen",
}: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | null
  >(null);
  const [selectedArticle, setSelectedArticle] =
    useState<HelpArticle | null>(null);

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      article.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      !selectedCategory ||
      article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const popularArticles = HELP_ARTICLES.filter(
    (a) => a.popular,
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-[80] flex items-start justify-center overflow-y-auto py-8"
        onClick={() => {
          setSelectedArticle(null);
          setSelectedCategory(null);
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl mx-4 bg-[var(--bg-base)]/95 backdrop-blur-2xl rounded-2xl border border-[var(--border-neutral)]/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-[var(--border-neutral)]/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedArticle || selectedCategory ? (
                  <button
                    onClick={() => {
                      setSelectedArticle(null);
                      setSelectedCategory(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                ) : null}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                  }}
                >
                  <HelpCircle className="w-7 h-7 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                    Help Center
                  </h2>
                  <p className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                    Find answers and get support
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-primary)]/50" />
              </button>
            </div>

            {/* Search */}
            {!selectedArticle && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]/30" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl text-[var(--text-primary)] placeholder-white/30 focus:outline-none focus:bg-white/10 border border-[var(--border-neutral)]/10 focus:border-[var(--border-neutral)]/20 transition-all"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {selectedArticle ? (
                <ArticleView
                  article={selectedArticle}
                  accentColor={accentColor}
                />
              ) : selectedCategory ? (
                <CategoryView
                  category={selectedCategory}
                  articles={filteredArticles}
                  onSelectArticle={setSelectedArticle}
                  accentColor={accentColor}
                />
              ) : (
                <HomeView
                  searchQuery={searchQuery}
                  popularArticles={popularArticles}
                  filteredArticles={filteredArticles}
                  onSelectCategory={setSelectedCategory}
                  onSelectArticle={setSelectedArticle}
                  accentColor={accentColor}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Contact Support */}
          <div className="p-6 border-t border-[var(--border-neutral)]/10 bg-[var(--bg-base)]/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={
                    <MessageCircle className="w-4 h-4" />
                  }
                  onClick={() =>
                    window.open(
                      "https://discord.gg/paradexwallet",
                      "_blank",
                    )
                  }
                >
                  Discord
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Mail className="w-4 h-4" />}
                  onClick={() =>
                  (window.location.href =
                    "mailto:support@paradexwallet.app")
                  }
                >
                  Email Support
                </Button>
              </div>
              <p className="text-xs text-[var(--text-primary)]/40 uppercase tracking-wider">
                24/7 Community Support
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function HomeView({
  searchQuery,
  popularArticles,
  filteredArticles,
  onSelectCategory,
  onSelectArticle,
  accentColor,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Categories */}
      {!searchQuery && (
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-4">
            Browse by Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {HELP_CATEGORIES.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(category.id)}
                className="p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-[var(--border-neutral)]/10 hover:border-[var(--border-neutral)]/20 transition-all text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${category.color}20` }}
                >
                  <category.icon
                    className="w-5 h-5"
                    style={{ color: category.color }}
                  />
                </div>
                <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">
                  {category.label}
                </h4>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Articles */}
      {!searchQuery && (
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-4 flex items-center gap-2">
            <Zap
              className="w-5 h-5"
              style={{ color: accentColor }}
            />
            Popular Articles
          </h3>
          <StaggeredList
            type="slide"
            direction="up"
            staggerDelay={0.05}
          >
            {popularArticles.map((article: HelpArticle) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => onSelectArticle(article)}
                accentColor={accentColor}
              />
            ))}
          </StaggeredList>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-4">
            Search Results ({filteredArticles.length})
          </h3>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-[var(--text-primary)]/20 mx-auto mb-4" />
              <p className="text-[var(--text-primary)]/50">No articles found</p>
              <p className="text-[var(--text-primary)]/30 text-sm mt-2">
                Try different keywords
              </p>
            </div>
          ) : (
            <StaggeredList
              type="slide"
              direction="up"
              staggerDelay={0.05}
            >
              {filteredArticles.map((article: HelpArticle) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => onSelectArticle(article)}
                  accentColor={accentColor}
                />
              ))}
            </StaggeredList>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CategoryView({
  category,
  articles,
  onSelectArticle,
  accentColor,
}: any) {
  const categoryInfo = HELP_CATEGORIES.find(
    (c) => c.id === category,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        {categoryInfo && (
          <>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${categoryInfo.color}20` }}
            >
              <categoryInfo.icon
                className="w-6 h-6"
                style={{ color: categoryInfo.color }}
              />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                {categoryInfo.label}
              </h3>
              <p className="text-sm text-[var(--text-primary)]/50">
                {articles.length} articles
              </p>
            </div>
          </>
        )}
      </div>

      <StaggeredList
        type="slide"
        direction="up"
        staggerDelay={0.05}
      >
        {articles.map((article: HelpArticle) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={() => onSelectArticle(article)}
            accentColor={accentColor}
          />
        ))}
      </StaggeredList>
    </motion.div>
  );
}

function ArticleView({
  article,
  accentColor,
}: {
  article: HelpArticle;
  accentColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-3">
          {article.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div
        className="prose prose-invert max-w-none"
        style={{
          whiteSpace: "pre-line",
        }}
      >
        {article.content.split("\n").map((paragraph, i) => {
          if (
            paragraph.startsWith("**") &&
            paragraph.endsWith("**")
          ) {
            return (
              <h3
                key={i}
                className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mt-6 mb-3"
              >
                {paragraph.replace(/\*\*/g, "")}
              </h3>
            );
          }
          if (
            paragraph.startsWith("✅") ||
            paragraph.startsWith("⚠️") ||
            paragraph.startsWith("❌")
          ) {
            return (
              <p key={i} className="text-[var(--text-primary)]/80 my-2">
                {paragraph}
              </p>
            );
          }
          if (paragraph.startsWith("💡")) {
            return (
              <div
                key={i}
                className="p-4 rounded-xl my-4"
                style={{
                  background: `${accentColor}10`,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                <p className="text-[var(--text-primary)]/90">{paragraph}</p>
              </div>
            );
          }
          if (paragraph.trim()) {
            return (
              <p key={i} className="text-[var(--text-primary)]/70 my-3">
                {paragraph}
              </p>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-[var(--border-neutral)]/10">
        <p className="text-sm text-[var(--text-primary)]/40">
          Was this helpful?
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            👍 Yes
          </Button>
          <Button variant="outline" size="sm">
            👎 No
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ArticleCard({
  article,
  onClick,
  accentColor,
}: {
  article: HelpArticle;
  onClick: () => void;
  accentColor: string;
}) {
  const categoryInfo = HELP_CATEGORIES.find(
    (c) => c.id === article.category,
  );

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-[var(--border-neutral)]/10 hover:border-[var(--border-neutral)]/20 transition-all text-left"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">
              {article.title}
            </h4>
            {article.popular && (
              <Badge variant="warning" size="sm">
                Popular
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-primary)]/50 line-clamp-2">
            {article.content.split("\n")[0]}
          </p>
          {categoryInfo && (
            <div className="flex items-center gap-2 mt-2">
              <categoryInfo.icon
                className="w-3 h-3"
                style={{ color: categoryInfo.color }}
              />
              <span className="text-xs text-[var(--text-primary)]/40 uppercase tracking-wider font-bold">
                {categoryInfo.label}
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/30 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

export default HelpCenter;