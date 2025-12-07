import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Pricing } from "./Pricing";
import {
  ArrowRight,
  Shield,
  Lock,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";

interface Feature {
  name: string;
  desc: string;
  icon: string;
}

interface FeatureSection {
  title: string;
  subtitle: string;
  features: Feature[];
}

// Updated Professional Wording for Degen
const DEGEN_FEATURES: FeatureSection[] = [
  {
    title: "OFFENSE",
    subtitle: "Market Domination",
    features: [
      {
        name: "Liquidity Sniper",
        desc: "Microsecond entry into new pools before public trading",
        icon: "⚡",
      },
      {
        name: "Alpha Scout",
        desc: "Real-time sentiment analysis & whale movement tracking",
        icon: "🎯",
      },
      {
        name: "Smart Money Copy",
        desc: "Automated mirroring of high-PnL wallet clusters",
        icon: "🐋",
      },
    ],
  },
  {
    title: "DEFENSE",
    subtitle: "Profit Preservation",
    features: [
      {
        name: "Profit Lock",
        desc: "Automated scale-out triggers at key Fibonacci levels",
        icon: "🔒",
      },
      {
        name: "Dynamic Trailing",
        desc: "Volatility-adjusted stop losses to secure gains",
        icon: "🛡️",
      },
      {
        name: "Rug Shield",
        desc: "Liquidity unlock detection & front-run exit execution",
        icon: "💰",
      },
    ],
  },
];

const REGEN_FEATURES: FeatureSection[] = [
  {
    title: "PROTECTION",
    subtitle: "Asset Fortification",
    features: [
      {
        name: "Wallet Guard",
        desc: "Multi-signature requirements for large outflows",
        icon: "🛡️",
      },
      {
        name: "MEV Shield",
        desc: "Private RPC endpoints to prevent sandwich attacks",
        icon: "🔐",
      },
      {
        name: "Risk Scanner",
        desc: "Contract auditing & interaction simulation",
        icon: "🎯",
      },
    ],
  },
  {
    title: "GROWTH",
    subtitle: "Wealth Compounding",
    features: [
      {
        name: "Smart Rebalance",
        desc: "Automated portfolio adjustment based on market cap",
        icon: "⚖️",
      },
      {
        name: "Yield Optimizer",
        desc: "Cross-chain APY aggregation & auto-staking",
        icon: "📈",
      },
      {
        name: "Tax Efficiency",
        desc: "Loss harvesting & long-term gain optimization",
        icon: "📊",
      },
    ],
  },
];

interface LandingPageProps {
  type: "degen" | "regen";
  onBack: () => void;
  children: React.ReactNode;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  type,
  onBack,
  children,
}) => {
  const isDegen = type === "degen";
  const features = isDegen ? DEGEN_FEATURES : REGEN_FEATURES;
  const primaryColor = isDegen
    ? "text-red-500"
    : "text-blue-500";

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(
    scrollYProgress,
    [0, 0.2],
    [1, 0],
  );
  const heroScale = useTransform(
    scrollYProgress,
    [0, 0.2],
    [1, 0.95],
  );

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden selection:bg-white/20 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        {children}
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

      <Header type={type} />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative pt-20">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="container mx-auto px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div
                className={`inline-block px-4 py-1.5 mb-6 rounded-full border backdrop-blur-md ${isDegen ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400"}`}
              >
                <span className="text-xs font-bold tracking-[0.2em] uppercase">
                  {isDegen
                    ? "High Frequency • High Alpha"
                    : "Secure • Sustainable • Scalable"}
                </span>
              </div>

              <h1
                className={`text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 leading-tight ${isDegen ? "font-[Rajdhani] uppercase tracking-tight" : "font-[Montserrat] tracking-tight"}`}
              >
                {isDegen ? "Dominate" : "Master"} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                  The Market
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                {isDegen
                  ? "Institutional-grade execution for the modern trader. Snipe liquidity, track smart money, and secure profits with millisecond precision."
                  : "The ultimate fortress for your digital wealth. Automate growth strategies while ensuring your legacy is preserved for generations."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className={`h-14 px-8 text-lg ${isDegen ? "bg-red-600 hover:bg-red-700 rounded-none skew-x-[-10deg]" : "bg-blue-600 hover:bg-blue-700 rounded-full"}`}
                >
                  Get Started Now{" "}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onBack}
                  className={`h-14 px-8 text-lg bg-transparent border-white/20 text-white hover:bg-white/10 ${isDegen ? "rounded-none skew-x-[-10deg]" : "rounded-full"}`}
                >
                  Switch Sides
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
          >
            <span className="text-xs uppercase tracking-widest">
              Scroll
            </span>
            <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent" />
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 relative">
          <div className="container mx-auto px-6">
            {features.map((section, sIndex) => (
              <div
                key={section.title}
                className="mb-32 last:mb-0"
              >
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="mb-16 border-l-4 pl-6 border-white/20"
                  style={{
                    borderColor: isDegen
                      ? "#ff3333"
                      : "#3399ff",
                  }}
                >
                  <h2
                    className={`text-5xl md:text-7xl font-bold text-white mb-4 ${isDegen ? "font-[Rajdhani] uppercase" : "font-[Montserrat]"}`}
                  >
                    {section.title}
                  </h2>
                  <p className={`text-2xl ${primaryColor}`}>
                    {section.subtitle}
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {section.features.map((feature, fIndex) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: fIndex * 0.1,
                      }}
                      className="group relative p-1"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${isDegen ? "from-red-500/20 to-transparent" : "from-blue-500/20 to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
                      />
                      <div
                        className={`relative h-full p-8 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors overflow-hidden ${isDegen ? "rounded-none" : "rounded-2xl"}`}
                      >
                        <div
                          className={`w-12 h-12 mb-6 rounded-lg flex items-center justify-center text-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300 ${primaryColor}`}
                        >
                          {feature.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                          {feature.name}
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Inheritance Platform Section (Regen Only) */}
        {!isDegen && (
          <section className="py-32 relative bg-blue-900/5 border-y border-blue-500/10">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <span className="text-xs font-bold tracking-wider uppercase">
                      Legacy Protocol
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-[Montserrat]">
                    Digital Inheritance <br />
                    <span className="text-blue-500">
                      Secured Forever
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    Ensure your wealth is passed down exactly as
                    you intend. Our decentralized Dead Man's
                    Switch monitors your activity and
                    automatically triggers asset transfer
                    protocols to your designated beneficiaries
                    if you go offline.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-1">
                        <Clock className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">
                          Activity Monitoring
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Customizable check-in periods (30 days
                          - 5 years).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-1">
                        <Lock className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">
                          Time-Locked Vaults
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Assets remain frozen until transfer
                          conditions are fully met.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-1">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">
                          Legal Integration
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Optional hash-linking to legal wills
                          and trust documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
                  <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-blue-500" />
                        <span className="text-white font-bold">
                          Legacy Vault Status
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-500 text-sm font-mono">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Primary Owner</span>
                        <span className="text-white">
                          0x71C...9A2
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Last Check-in</span>
                        <span className="text-white">
                          2 days ago
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Next Check-in</span>
                        <span className="text-white">
                          28 days remaining
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400 pt-4 border-t border-white/5">
                        <span>Beneficiary 1 (50%)</span>
                        <span className="text-white">
                          0x3d2...b41
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Beneficiary 2 (50%)</span>
                        <span className="text-white">
                          0x8f1...c22
                        </span>
                      </div>
                    </div>

                    <Button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                      Configure Protocol
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        <Pricing type={type} />

        <section className="py-32 relative overflow-hidden">
          <div
            className={`absolute inset-0 opacity-20 bg-gradient-to-r ${isDegen ? "from-red-900 to-black" : "from-blue-900 to-black"}`}
          />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2
              className={`text-4xl md:text-6xl font-bold text-white mb-8 ${isDegen ? "font-[Rajdhani] uppercase" : "font-[Montserrat]"}`}
            >
              Ready to{" "}
              {isDegen ? "Dominate?" : "Build Your Legacy?"}
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join 50,000+ users who have already chosen their
              path. The portal closes soon.
            </p>
            <Button
              size="lg"
              className={`h-16 px-12 text-xl ${isDegen ? "bg-white text-black hover:bg-gray-200 rounded-none" : "bg-white text-blue-900 hover:bg-gray-100 rounded-full"}`}
            >
              Launch App Now
            </Button>
          </div>
        </section>
      </main>

      <Footer type={type} />
    </div>
  );
};