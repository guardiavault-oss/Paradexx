import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, X, Shield, Fingerprint, ArrowLeft, Key } from "lucide-react";
import { ParadexLogo } from "./ParadexLogo";
import ForgotPasswordModal from "./ForgotPasswordModal";
import BurnTransition from "./BurnTransition";
import { API_URL } from '../config/api';

interface LoginModalProps {
  onLogin: (email: string, password: string) => void;
  onClose: () => void;
  onBack: () => void;
  /** Enable burn transition effect on login */
  useBurnTransition?: boolean;
}

export default function LoginModal({ onLogin, onClose, onBack, useBurnTransition = true }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSeedImport, setShowSeedImport] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (useBurnTransition) {
      // Store credentials and trigger burn
      setPendingLogin({ email, password });
      setIsBurning(true);
    } else {
      onLogin(email, password);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);

    // Simulate biometric authentication
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (useBurnTransition) {
      setPendingLogin({ email: "biometric@user.com", password: "biometric" });
      setIsBurning(true);
    } else {
      onLogin("biometric@user.com", "biometric");
    }
  };

  const handleSeedImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate seed import
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (useBurnTransition) {
      setPendingLogin({ email: "seed@imported.wallet", password: "imported" });
      setIsBurning(true);
    } else {
      onLogin("seed@imported.wallet", "imported");
    }
  };

  const handleBurnComplete = () => {
    if (pendingLogin) {
      onLogin(pendingLogin.email, pendingLogin.password);
    }
  };

  // Render with burn transition wrapper
  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={!isBurning ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(40px)",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-all hover:bg-white/10"
        >
          <X size={20} color="rgba(255, 255, 255, 0.6)" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ParadexLogo className="w-32 h-32 object-contain" />
            </div>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#ffffff",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Welcome Back
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {showSeedImport ? (
              <motion.form
                key="seed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSeedImport}
                className="space-y-6"
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Seed Phrase or Private Key
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-4">
                      <Key size={20} color="rgba(255, 255, 255, 0.5)" />
                    </div>
                    <textarea
                      value={seedPhrase}
                      onChange={(e) => setSeedPhrase(e.target.value)}
                      placeholder="Enter your 12 or 24 word seed phrase, or private key"
                      required
                      rows={4}
                      className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all resize-none"
                      style={{
                        backdropFilter: "blur(20px)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#00d4ff";
                        e.target.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.3)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                  <p className="text-xs text-yellow-200">
                    ⚠️ Never share your seed phrase or private key. Paradex will never ask for it.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #ff3366, #00d4ff)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLoading ? "Importing..." : "Import Wallet"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSeedImport(false)}
                  className="w-full"
                  style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}
                >
                  Back to login
                </button>
              </motion.form>
            ) : useBiometric ? (
              <motion.div
                key="biometric"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                  className="inline-flex items-center justify-center rounded-full mb-6"
                  style={{
                    width: "96px",
                    height: "96px",
                    background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                    boxShadow: "0 0 40px rgba(0, 212, 255, 0.5)",
                  }}
                >
                  <Fingerprint size={48} color="#ffffff" />
                </motion.div>

                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "12px",
                  }}
                >
                  Touch Sensor
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "24px" }}>
                  Place your finger on the sensor to continue
                </p>

                <button
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: "#00d4ff",
                    color: "#000000",
                    fontWeight: 700,
                  }}
                >
                  {isLoading ? "Authenticating..." : "Authenticate"}
                </button>

                <button
                  onClick={() => setUseBiometric(false)}
                  className="w-full mt-4"
                  style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}
                >
                  Use password instead
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Email */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail size={20} color="rgba(255, 255, 255, 0.5)" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                      style={{
                        backdropFilter: "blur(20px)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#00d4ff";
                        e.target.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.3)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock size={20} color="rgba(255, 255, 255, 0.5)" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-12 py-4 rounded-2xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all pr-12"
                      style={{
                        backdropFilter: "blur(20px)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#00d4ff";
                        e.target.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.3)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.target.style.boxShadow = "none";
                      }}
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
                </div>

                {/* Forgot password & Import seed phrase */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowSeedImport(true)}
                    className="hover:underline"
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Another wallet? Import seed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      color: "#00d4ff",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Biometric Login Button */}
                <button
                  type="button"
                  onClick={() => setUseBiometric(true)}
                  className="w-full p-4 rounded-2xl border-2 transition-all hover:border-cyan-500"
                  style={{
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    borderColor: "rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Fingerprint size={24} color="#00d4ff" />
                    <span style={{ color: "#00d4ff", fontWeight: 700, fontSize: "16px" }}>
                      Use Biometric Login
                    </span>
                  </div>
                </button>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${API_URL}/api/auth/oauth/google`;
                  }}
                  className="w-full p-4 rounded-2xl border-2 transition-all hover:border-white/40"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 600, fontSize: "15px" }}>
                      Continue with Google
                    </span>
                  </div>
                </button>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #ff3366, #00d4ff)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Wrap with burn transition if enabled
  if (useBurnTransition) {
    return (
      <BurnTransition
        isBurning={isBurning}
        onBurnComplete={handleBurnComplete}
        duration={1.5}
        zIndex={60}
      >
        {modalContent}
      </BurnTransition>
    );
  }

  return modalContent;
}