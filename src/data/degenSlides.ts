// Import images using figma:asset scheme
import sniperBotImg from "figma:asset/2340eecfd964ff9ee695d6ef64137faa0205abe9.png";
import memeHunterImg from "figma:asset/e5c480cc2d10ccec69eb117a5a22c6ba31694a3a.png";
import whaleMirrorImg from "figma:asset/b76fb21d3f59d4bf8c6ea63b2dccad8c3f6b772f.png";
import gainsLockImg from "figma:asset/80681928285c15bfcb142df3c9cc076dcb0a090c.png";
import smartStopLossImg from "figma:asset/a2d7129efa488fcbdac8cf8c291ceb0d0a9abf7d.png";
import recoveryFundImg from "figma:asset/1e5d029d62744ccb5c7b74a499ee57acaf8bba68.png";
import commandCenterImg from "figma:asset/1c61b47440c93f91e20df0bd9c3210c63ea856d4.png";

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  description?: string;
  type?: 'pricing';
  pricing?: any;
  image?: string; // Add image property
}

export const degenSlides: Slide[] = [
  {
    id: "INTRO",
    subtitle: "ENTER THE ARENA",
    title: "Degen",
    content: "High risk. High reward. No apologies.",
    description: "The ultimate toolkit for alpha hunters, snipers, and traders who live on the edge of the blockchain."
  },
  {
    id: "FEATURE-01",
    subtitle: "CORE TRADING TOOLS",
    title: "Sniper Bot",
    content: "🎯 Execute first-block buys on new token pairs",
    description: "Active - Be the first to enter new opportunities with millisecond execution speed.",
    image: sniperBotImg
  },
  {
    id: "FEATURE-02",
    subtitle: "CORE TRADING TOOLS",
    title: "Meme Hunter",
    content: "🔍 AI-powered gem detection with scoring algorithm",
    description: "Scanning - Advanced ML algorithms analyze social sentiment, liquidity, and holder patterns to identify hidden gems.",
    image: memeHunterImg
  },
  {
    id: "FEATURE-03",
    subtitle: "CORE TRADING TOOLS",
    title: "Whale Mirror",
    content: "🐋 Auto-copy trades from top 100 wallets",
    description: "Mirroring - Mirror the moves of proven whale traders with customizable position sizing.",
    image: whaleMirrorImg
  },
  {
    id: "FEATURE-04",
    subtitle: "CORE TRADING TOOLS",
    title: "Gains Lock",
    content: "🔐 Auto-lock profits when targets hit",
    description: "Protected - Set your profit targets and let the system automatically secure your gains.",
    image: gainsLockImg
  },
  {
    id: "FEATURE-05",
    subtitle: "CORE TRADING TOOLS",
    title: "Smart Stop-Loss",
    content: "🧠 ML-powered dump detection to prevent losses",
    description: "Watching - Machine learning algorithms detect unusual sell pressure and protect your position before major dumps.",
    image: smartStopLossImg
  },
  {
    id: "FEATURE-06",
    subtitle: "CORE TRADING TOOLS",
    title: "Recovery Fund",
    content: "🛡 Community insurance pool against rug pulls",
    description: "Insured - Community-backed protection fund provides partial recovery if you fall victim to a verified rug pull.",
    image: recoveryFundImg
  },
  {
    id: "FEATURE-07",
    subtitle: "DEGENX HUB",
    title: "Command Center",
    content: "AI Command Center - Scarlette AI assistant for trading insights",
    description: "MEV Shield protects against sandwich attacks. Whale Tracker monitors 12+ wallets in real-time. Smart Signals for automated alerts.",
    image: commandCenterImg
  },
  {
    id: "OUTRO",
    subtitle: "THE MOON AWAITS",
    title: "Ape In",
    content: "Fortune favors the bold. Hesitation is expensive.",
    description: "Join the elite circle of traders who act while others sleep. Your journey to life-changing gains starts here."
  }
];