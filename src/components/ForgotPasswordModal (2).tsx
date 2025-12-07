import { useState } from "react";
import { motion } from "motion/react";
import { X, Shield, Users, Mail, AlertTriangle, CheckCircle } from "lucide-react";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'options' | 'guardian' | 'email-sent'>('options');

  const handleGuardianRecovery = async () => {
    setStep('guardian');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setStep('email-sent');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg"
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
          {step === 'options' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center rounded-full mb-4"
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "linear-gradient(135deg, #ff3366, #00d4ff)",
                  }}
                >
                  <Shield size={32} color="#ffffff" />
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
                  Account Recovery
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px" }}>
                  Choose a recovery method
                </p>
              </div>

              {/* Important Notice */}
              <div 
                className="mb-6 p-4 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(255, 165, 0, 0.1)",
                  borderColor: "rgba(255, 165, 0, 0.3)",
                }}
              >
                <div className="flex gap-3">
                  <AlertTriangle size={24} className="text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-orange-200 font-bold mb-2" style={{ fontSize: "14px" }}>
                      Non-Custodial Wallet Notice
                    </p>
                    <p className="text-orange-200/80" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                      Paradex is a non-custodial wallet. We do not store or have access to your private keys. 
                      If you lose your credentials, we cannot directly retrieve them for you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recovery Options */}
              <div className="space-y-4">
                {/* Guardian Recovery */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGuardianRecovery}
                  className="w-full p-6 rounded-2xl border-2 transition-all text-left"
                  style={{
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    borderColor: "rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor: "rgba(0, 212, 255, 0.2)",
                      }}
                    >
                      <Users size={24} color="#00d4ff" />
                    </div>
                    <div className="flex-1">
                      <h3 
                        className="text-white font-bold mb-2"
                        style={{ fontSize: "18px" }}
                      >
                        Guardian Recovery
                      </h3>
                      <p 
                        className="text-white/60 mb-3"
                        style={{ fontSize: "14px", lineHeight: 1.6 }}
                      >
                        If you set up guardians during signup, they can help you recover your wallet.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-green-400 text-xs font-semibold">RECOMMENDED</span>
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Email Support */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('guardian')}
                  className="w-full p-6 rounded-2xl border-2 transition-all text-left"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Mail size={24} color="rgba(255, 255, 255, 0.6)" />
                    </div>
                    <div className="flex-1">
                      <h3 
                        className="text-white font-bold mb-2"
                        style={{ fontSize: "18px" }}
                      >
                        Contact Support
                      </h3>
                      <p 
                        className="text-white/60"
                        style={{ fontSize: "14px", lineHeight: 1.6 }}
                      >
                        Get help from our support team. Limited recovery options available.
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Additional Help */}
              <div className="mt-6 p-4 rounded-xl bg-white/5">
                <p className="text-white/50 text-xs text-center">
                  Don't have guardians set up?{" "}
                  <span className="text-cyan-400">
                    You may need to create a new wallet and manually transfer your assets if you have access to your seed phrase.
                  </span>
                </p>
              </div>
            </>
          )}

          {step === 'guardian' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center rounded-full mb-4"
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                  }}
                >
                  <Users size={32} color="#ffffff" />
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
                  Guardian Recovery
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px" }}>
                  We'll contact your guardians
                </p>
              </div>

              {/* Info */}
              <div className="space-y-4 mb-6">
                <div 
                  className="p-4 rounded-2xl border"
                  style={{
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    borderColor: "rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <p className="text-cyan-200" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                    🛡️ Your designated guardians will receive recovery requests. 
                    A threshold of guardians must approve before your wallet can be recovered.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold" style={{ fontSize: "16px" }}>
                    What happens next:
                  </h3>
                  <div className="space-y-2">
                    {[
                      "We'll send recovery requests to your guardians",
                      "Each guardian verifies your identity",
                      "Once threshold is met, recovery key is generated",
                      "You'll receive instructions to restore your wallet",
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-cyan-400 text-xs font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-white/70 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label
                    className="block mb-2 text-white/80 font-semibold"
                    style={{ fontSize: "14px" }}
                  >
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-black/40 text-white placeholder-white/40 outline-none transition-all"
                    style={{
                      backdropFilter: "blur(20px)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                    color: "#000000",
                    fontWeight: 700,
                    fontSize: "16px",
                    textTransform: "uppercase",
                  }}
                >
                  {isLoading ? "Sending Requests..." : "Contact My Guardians"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('options')}
                  className="w-full py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
                >
                  Back to options
                </button>
              </form>
            </>
          )}

          {step === 'email-sent' && (
            <>
              {/* Success Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center justify-center rounded-full mb-4"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #00ff88, #00d4ff)",
                  }}
                >
                  <CheckCircle size={40} color="#ffffff" />
                </motion.div>
                <h2
                  style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Requests Sent!
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px" }}>
                  Your guardians have been notified
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-6">
                <div 
                  className="p-5 rounded-2xl border"
                  style={{
                    backgroundColor: "rgba(0, 255, 136, 0.1)",
                    borderColor: "rgba(0, 255, 136, 0.3)",
                  }}
                >
                  <p className="text-green-200 font-semibold mb-2" style={{ fontSize: "16px" }}>
                    ✅ What to do next:
                  </p>
                  <ul className="space-y-2 text-green-200/80" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                    <li>• Check your email ({email}) for updates</li>
                    <li>• Your guardians will verify your identity</li>
                    <li>• Once approved, you'll receive recovery instructions</li>
                    <li>• This process typically takes 24-48 hours</li>
                  </ul>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-xs text-center">
                    Need immediate help? Contact{" "}
                    <span className="text-cyan-400">support@paradex.app</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl transition-all"
                style={{
                  background: "linear-gradient(135deg, #ff3366, #00d4ff)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "16px",
                  textTransform: "uppercase",
                }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
