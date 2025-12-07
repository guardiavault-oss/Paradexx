import { Slide } from './degenSlides';

// Import regen feature images using figma:asset scheme
import walletGuardImg from "figma:asset/3a7be8f7e3921a7608a38dce25f052dccfcaa7b0.png";
import inheritanceVaultImg from "figma:asset/d5cd4cb5e94aeb3e9321610d787fd524308d0061.png";
import mevProtectionImg from "figma:asset/c6eddb4fd4d2599dd1d441337c279378a015bdc8.png";
import panicButtonImg from "figma:asset/c27a305f775121206c0bccbc9e190e3e21bc5ee3.png";
import socialRecoveryImg from "figma:asset/9c318caeae9555de029a418ebcff2fa1f0efd135.png";
import privacyShieldImg from "figma:asset/89c058f66b59bb5340c6f05ee3fc36761daf9a5a.png";
import defiDashboardImg from "figma:asset/7738355c5b5b76d279efb31ea1c1781f8b8acf7f.png";
import portfolioAnalyticsImg from "figma:asset/9fa9b12965601318cbffe057cc0859be1adc986c.png";

export const regenSlides: Slide[] = [
  {
    id: "INTRO",
    type: "content",
    title: "Regen",
    subtitle: "Sustainable Wealth",
    content: "Build legacy. Preserve wealth. Create generational impact.",
    description: "Purpose-built crypto wallet for long-term holders focused on sustainable growth, inheritance planning, and wealth preservation."
  },
  {
    id: "FEATURE-01",
    type: "content",
    title: "Wallet Guard",
    subtitle: "Active Protection",
    content: "Real-time wallet protection system against malicious threats.",
    description: "Monitors for malicious contracts, simulates transactions before signing, and blocks known scam addresses to keep your assets safe.",
    image: walletGuardImg
  },
  {
    id: "FEATURE-02",
    type: "content",
    title: "Inheritance Platform",
    subtitle: "GuardianX Legacy Vault",
    content: "Secure crypto estate planning with automated transfer protocols.",
    description: "Features Dead Man's Switch, beneficiary management, and encrypted messages to ensure your digital legacy is passed on securely.",
    image: inheritanceVaultImg
  },
  {
    id: "FEATURE-03",
    type: "content",
    title: "MEV Protection",
    subtitle: "Anti-Extraction Shield",
    content: "Protects your trades against value extraction attacks.",
    description: "Utilizes private mempools and sandwich protection to prevent front-running and slippage exploitation by bots.",
    image: mevProtectionImg
  },
  {
    id: "FEATURE-04",
    type: "content",
    title: "Panic Mode",
    subtitle: "Emergency Protocol",
    content: "One-click emergency asset evacuation and lockdown.",
    description: "Instantly move assets to a safe wallet, batch revoke all approvals, and alert your emergency contacts during security events.",
    image: panicButtonImg
  },
  {
    id: "FEATURE-05",
    type: "content",
    title: "Social Recovery",
    subtitle: "Smart Vault",
    content: "Seedless recovery system powered by your trusted network.",
    description: "Recover your wallet through a multi-sig guardian network and time-locked protocols, eliminating the single point of failure of seed phrases.",
    image: socialRecoveryImg
  },
  {
    id: "FEATURE-06",
    type: "content",
    title: "Privacy Shield",
    subtitle: "Transaction Privacy",
    content: "Advanced privacy tools to obfuscate your financial footprint.",
    description: "Features address mixing, stealth address generation, and encrypted private notes to maintain your financial confidentiality.",
    image: privacyShieldImg
  },
  {
    id: "FEATURE-07",
    type: "content",
    title: "DeFi Dashboard",
    subtitle: "Yield & Staking",
    content: "Comprehensive yield aggregation and position management.",
    description: "Track all DeFi positions, assess protocol risks, and auto-compound yields to maximize your long-term returns.",
    image: defiDashboardImg
  },
  {
    id: "FEATURE-08",
    type: "content",
    title: "Portfolio Analytics",
    subtitle: "Wealth Tracking",
    content: "Deep insights into your long-term wealth performance.",
    description: "Visual performance charts, asset allocation breakdowns, and automated tax reporting to keep your financial goals on track.",
    image: portfolioAnalyticsImg
  },
  {
    id: "OUTRO",
    type: "content",
    title: "Build Your Legacy",
    subtitle: "The Future Is Built Today",
    content: "Wealth is not what you keep. It's what you leave behind.",
    description: "Join the movement of builders who think in decades, not minutes. Secure your family's future with Regen."
  }
];