import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, Users, ArrowRight, ArrowLeft, Copy, Check, X, Shield, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { copyToClipboard } from '../utils/clipboard';

interface Guardian {
  name: string;
  email: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  biometricEnabled: boolean;
  guardians: Guardian[];
  useCloudBackup: boolean;
  walletSetupType: "easy" | "advanced" | null;
  verificationCode: string;
}

interface GlassOnboardingProps {
  onComplete: (data: FormData, seedPhrase?: string[]) => void;
  type: "degen" | "regen";
  onBack?: () => void;
}

// BIP39-style word list (simplified for demo - in production use full BIP39 list)
const WORD_LIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "afford", "afraid", "again", "age", "agent", "agree",
  "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol",
  "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha",
  "already", "also", "alter", "always", "amateur", "amazing", "among", "amount",
  "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal",
  "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety",
  "any", "apart", "apology", "appear", "apple", "approve", "april", "arch",
  "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army",
  "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist",
  "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma",
  "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit",
  "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid",
  "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby",
  "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo",
  "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic",
  "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef",
  "before", "begin", "behave", "behind", "believe", "below", "belt", "bench",
  "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid",
  "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade",
  "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom",
  "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil",
  "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow",
  "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand",
  "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright",
  "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown",
  "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk",
  "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business",
  "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus",
  "cage", "cake", "call", "calm", "camera", "camp", "can", "canal",
  "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital",
  "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart",
  "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch",
  "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery",
  "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion"
];

const generateSeedPhrase = (): string[] => {
  const phrase: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    phrase.push(WORD_LIST[randomIndex]);
  }
  return phrase;
};

export default function GlassOnboarding({ onComplete, type, onBack }: GlassOnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    biometricEnabled: false,
    guardians: [],
    useCloudBackup: false,
    walletSetupType: null,
    verificationCode: "",
  });
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] = useState(false);
  const [seedPhraseCopied, setSeedPhraseCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Guardian form state
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#00d4ff";
  const bgGradient = isDegen
    ? "linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(139, 0, 0, 0.05) 100%)"
    : "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)";

  const updateData = (updates: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Generate seed phrase when moving to step 7 with easy setup
    if (step === 6 && data.walletSetupType === "easy" && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 1 && onBack) {
      onBack();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const addGuardian = () => {
    if (guardianName && guardianEmail && data.guardians.length < 5) {
      updateData({
        guardians: [...data.guardians, { name: guardianName, email: guardianEmail }],
      });
      setGuardianName("");
      setGuardianEmail("");
    }
  };

  const removeGuardian = (index: number) => {
    updateData({
      guardians: data.guardians.filter((_, i) => i !== index),
    });
  };

  const copySeedPhrase = () => {
    const text = seedPhrase.join(" ");
    copyToClipboard(text)
      .then(() => {
        setSeedPhraseCopied(true);
        setTimeout(() => setSeedPhraseCopied(false), 2000);
      })
      .catch(() => {
        console.error('Failed to copy seed phrase to clipboard');
      });
  };

  const handleComplete = () => {
    if (data.walletSetupType === "easy") {
      onComplete(data, seedPhrase);
    } else {
      onComplete(data);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.walletSetupType !== null;
      case 2:
        return data.name.length > 0;
      case 3:
        return data.email.includes("@");
      case 4:
        return data.password.length >= 8;
      case 5:
        return data.verificationCode.length === 6;
      case 6:
        return true; // Biometric is optional
      case 7:
        if (data.walletSetupType === "easy") {
          return seedPhraseConfirmed;
        } else {
          return data.guardians.length >= 2;
        }
      case 8:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                Choose Setup Method
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "18px" }}>
                Select how you want to secure your wallet
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Easy Setup */}
              <button
                onClick={() => {
                  updateData({ walletSetupType: "easy", useCloudBackup: false });
                  handleNext();
                }}
                className="group relative p-8 rounded-3xl border-2 transition-all duration-300 text-left"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor:
                    data.walletSetupType === "easy" ? primaryColor : "rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    data.walletSetupType === "easy"
                      ? `0 0 40px ${primaryColor}40`
                      : "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    fontWeight: 800,
                  }}
                >
                  Quick
                </div>

                <h3
                  className="mb-4"
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  Easy Setup
                </h3>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color={primaryColor} className="mt-0.5 flex-shrink-0" />
                    <span>12-word recovery phrase</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color={primaryColor} className="mt-0.5 flex-shrink-0" />
                    <span>You control your keys</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color={primaryColor} className="mt-0.5 flex-shrink-0" />
                    <span>Industry standard</span>
                  </li>
                </ul>

                <div
                  className="flex items-center gap-2 group-hover:gap-3 transition-all"
                  style={{ color: primaryColor, fontWeight: 700 }}
                >
                  Continue with Easy Setup
                  <ArrowRight size={20} />
                </div>
              </button>

              {/* Advanced Setup */}
              <button
                onClick={() => {
                  updateData({ walletSetupType: "advanced", useCloudBackup: true });
                  handleNext();
                }}
                className="group relative p-8 rounded-3xl border-2 transition-all duration-300 text-left"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor:
                    data.walletSetupType === "advanced" ? "#00AAFF" : "rgba(0, 170, 255, 0.3)",
                  boxShadow:
                    data.walletSetupType === "advanced"
                      ? "0 0 40px rgba(0, 170, 255, 0.4)"
                      : "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs uppercase tracking-wider"
                  style={{
                    backgroundColor: "#00AAFF",
                    color: "#ffffff",
                    fontWeight: 800,
                  }}
                >
                  Recommended
                </div>

                <h3
                  className="mb-4"
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  Advanced Setup
                </h3>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color="#00AAFF" className="mt-0.5 flex-shrink-0" />
                    <span>No seed phrase needed</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color="#00AAFF" className="mt-0.5 flex-shrink-0" />
                    <span>Trusted contacts help recover</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <Check size={20} color="#00AAFF" className="mt-0.5 flex-shrink-0" />
                    <span>Inheritance ready</span>
                  </li>
                </ul>

                <div
                  className="flex items-center gap-2 group-hover:gap-3 transition-all"
                  style={{ color: "#00AAFF", fontWeight: 700 }}
                >
                  Continue with Advanced Setup
                  <ArrowRight size={20} />
                </div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                What's your name?
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>This helps personalize your experience</p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User size={20} color="rgba(255, 255, 255, 0.5)" />
              </div>
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                style={{
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  fontSize: "18px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 20px ${primaryColor}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Your Email
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                We'll send you a verification code
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail size={20} color="rgba(255, 255, 255, 0.5)" />
              </div>
              <input
                type="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                placeholder="Enter your email"
                className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                style={{
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  fontSize: "18px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 20px ${primaryColor}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Create Password
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                Choose a strong password (min. 8 characters)
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock size={20} color="rgba(255, 255, 255, 0.5)" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => updateData({ password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all pr-12"
                style={{
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  fontSize: "18px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 20px ${primaryColor}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} color="rgba(255, 255, 255, 0.5)" />
                ) : (
                  <Eye size={20} color="rgba(255, 255, 255, 0.5)" />
                )}
              </button>
            </div>

            {data.password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {data.password.length >= 8 ? (
                    <Check size={16} color={primaryColor} />
                  ) : (
                    <X size={16} color="rgba(255, 255, 255, 0.3)" />
                  )}
                  <span
                    style={{
                      color: data.password.length >= 8 ? primaryColor : "rgba(255, 255, 255, 0.5)",
                      fontSize: "14px",
                    }}
                  >
                    At least 8 characters
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Verify Email
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                Enter the 6-digit code sent to {data.email}
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={data.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  updateData({ verificationCode: value });
                }}
                placeholder="000000"
                className="w-full px-6 py-4 rounded-2xl border-2 bg-black/40 text-white text-center tracking-[0.5em] outline-none transition-all"
                style={{
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  fontSize: "32px",
                  fontWeight: 700,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 20px ${primaryColor}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              className="w-full text-center"
              style={{ color: primaryColor, fontSize: "14px", fontWeight: 600 }}
            >
              Resend code
            </button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Enable Biometrics
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>Optional: Use fingerprint or face ID</p>
            </div>

            <button
              onClick={() => updateData({ biometricEnabled: !data.biometricEnabled })}
              className="w-full p-8 rounded-3xl border-2 transition-all duration-300"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(20px)",
                borderColor: data.biometricEnabled ? primaryColor : "rgba(255, 255, 255, 0.1)",
                boxShadow: data.biometricEnabled
                  ? `0 0 40px ${primaryColor}40`
                  : "0 10px 30px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="rounded-2xl flex items-center justify-center"
                    style={{
                      width: "56px",
                      height: "56px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Shield size={28} color={primaryColor} />
                  </div>
                  <div className="text-left">
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
                      Biometric Authentication
                    </div>
                    <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                      Quick and secure access
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: "24px",
                    height: "24px",
                    border: `2px solid ${data.biometricEnabled ? primaryColor : "rgba(255, 255, 255, 0.3)"}`,
                    backgroundColor: data.biometricEnabled ? primaryColor : "transparent",
                  }}
                >
                  {data.biometricEnabled && <Check size={16} color="#ffffff" className="m-auto" />}
                </div>
              </div>
            </button>

            <p
              className="text-center"
              style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}
            >
              You can skip this and enable it later in settings
            </p>
          </div>
        );

      case 7:
        if (data.walletSetupType === "easy") {
          // Seed Phrase Display
          return (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2
                  className="mb-4"
                  style={{
                    fontSize: "clamp(32px, 5vw, 48px)",
                    fontWeight: 900,
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  Your Recovery Phrase
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Write down these 12 words in order
                </p>
              </div>

              {/* Warning Banner */}
              <div
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{
                  backgroundColor: "rgba(255, 100, 100, 0.1)",
                  border: "1px solid rgba(255, 100, 100, 0.3)",
                }}
              >
                <Shield size={20} color="#ff6464" className="mt-0.5 flex-shrink-0" />
                <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.9)" }}>
                  <strong>Never share your recovery phrase!</strong> Anyone with these words can access
                  your wallet.
                </div>
              </div>

              {/* Seed Phrase Grid */}
              <div className="grid grid-cols-3 gap-4">
                {seedPhrase.map((word, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.5)",
                        marginBottom: "4px",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>{word}</div>
                  </div>
                ))}
              </div>

              {/* Copy Button */}
              <button
                onClick={copySeedPhrase}
                className="w-full py-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              >
                {seedPhraseCopied ? (
                  <>
                    <Check size={20} color={primaryColor} />
                    Copied to clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy to clipboard
                  </>
                )}
              </button>

              {/* Confirmation Checkbox */}
              <button
                onClick={() => setSeedPhraseConfirmed(!seedPhraseConfirmed)}
                className="w-full p-6 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 text-left"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: seedPhraseConfirmed ? primaryColor : "rgba(255, 255, 255, 0.1)",
                  boxShadow: seedPhraseConfirmed ? `0 0 20px ${primaryColor}40` : "none",
                }}
              >
                <div
                  className="rounded-lg transition-all flex-shrink-0"
                  style={{
                    width: "24px",
                    height: "24px",
                    border: `2px solid ${seedPhraseConfirmed ? primaryColor : "rgba(255, 255, 255, 0.3)"}`,
                    backgroundColor: seedPhraseConfirmed ? primaryColor : "transparent",
                  }}
                >
                  {seedPhraseConfirmed && <Check size={16} color="#ffffff" className="m-auto" />}
                </div>
                <span style={{ color: "#ffffff", fontSize: "16px" }}>
                  I have written down my recovery phrase and stored it in a safe place. I understand
                  that if I lose it, I won't be able to recover my wallet.
                </span>
              </button>
            </div>
          );
        } else {
          // Guardian Setup
          return (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2
                  className="mb-4"
                  style={{
                    fontSize: "clamp(32px, 5vw, 48px)",
                    fontWeight: 900,
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  Add Guardians
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Add 2-5 trusted contacts who can help you recover your wallet
                </p>
              </div>

              {/* Cloud Backup Banner */}
              <div
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                <Shield size={20} color={primaryColor} className="mt-0.5 flex-shrink-0" />
                <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.9)" }}>
                  <strong>Cloud backup included!</strong> Your wallet will be securely backed up and
                  encrypted.
                </div>
              </div>

              {/* Add Guardian Form */}
              <div
                className="p-6 rounded-2xl space-y-4"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Guardian name"
                  className="w-full px-4 py-3 rounded-xl border bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="Guardian email"
                  className="w-full px-4 py-3 rounded-xl border bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
                <button
                  onClick={addGuardian}
                  disabled={!guardianName || !guardianEmail || data.guardians.length >= 5}
                  className="w-full py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                  style={{
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    fontWeight: 700,
                  }}
                >
                  Add Guardian ({data.guardians.length}/5)
                </button>
              </div>

              {/* Guardian List */}
              {data.guardians.length > 0 && (
                <div className="space-y-3">
                  {data.guardians.map((guardian, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>
                          {guardian.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                          {guardian.email}
                        </div>
                      </div>
                      <button
                        onClick={() => removeGuardian(index)}
                        className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                      >
                        <X size={20} color="#ff6464" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {data.guardians.length < 2 && (
                <p
                  className="text-center"
                  style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}
                >
                  Add at least 2 guardians to continue
                </p>
              )}
            </div>
          );
        }

      case 8:
        return (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2
                className="mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Review & Confirm
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                Check your details before creating your wallet
              </p>
            </div>

            <div className="space-y-4">
              {/* Setup Type */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginBottom: "8px",
                  }}
                >
                  Setup Type
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                  {data.walletSetupType === "easy" ? "Easy Setup" : "Advanced Setup"}
                </div>
              </div>

              {/* Personal Info */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginBottom: "8px",
                  }}
                >
                  Name
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "16px",
                  }}
                >
                  {data.name}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginBottom: "8px",
                  }}
                >
                  Email
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                  {data.email}
                </div>
              </div>

              {/* Security */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginBottom: "8px",
                  }}
                >
                  Security Features
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check size={16} color={primaryColor} />
                    <span style={{ color: "#ffffff" }}>Password protected</span>
                  </div>
                  {data.biometricEnabled && (
                    <div className="flex items-center gap-2">
                      <Check size={16} color={primaryColor} />
                      <span style={{ color: "#ffffff" }}>Biometric authentication</span>
                    </div>
                  )}
                  {data.walletSetupType === "easy" && (
                    <div className="flex items-center gap-2">
                      <Check size={16} color={primaryColor} />
                      <span style={{ color: "#ffffff" }}>12-word recovery phrase</span>
                    </div>
                  )}
                  {data.walletSetupType === "advanced" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check size={16} color={primaryColor} />
                        <span style={{ color: "#ffffff" }}>
                          {data.guardians.length} guardians configured
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} color={primaryColor} />
                        <span style={{ color: "#ffffff" }}>Cloud backup enabled</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center p-4 overflow-y-auto">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: bgGradient,
          opacity: 0.3,
        }}
      />

      {/* Glass container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl my-8"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(40px)",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Back Arrow - Top Left */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 p-2 rounded-full transition-all hover:bg-white/10 z-10"
          style={{
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <ArrowLeft size={24} />
        </button>

        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <motion.div
            className="h-full"
            style={{ backgroundColor: primaryColor }}
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 8) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 md:p-12">
          {/* Step indicator */}
          <div className="text-center mb-8">
            <span
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              Step {step} of 8
            </span>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step > 1 && (
            <div className="flex justify-end mt-12">
              <button
                onClick={step === 8 ? handleComplete : handleNext}
                disabled={!canProceed()}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl transition-all disabled:opacity-50"
                style={{
                  backgroundColor: canProceed() ? primaryColor : "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
              >
                {step === 8 ? "Create Wallet" : "Continue"}
                <ArrowRight size={20} />
              </button>
            </div>
          )}
          
          {/* Legal Links Footer */}
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
              By continuing, you agree to our{" "}
              <a 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: primaryColor, textDecoration: "none" }}
                className="hover:underline"
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: primaryColor, textDecoration: "none" }}
                className="hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}