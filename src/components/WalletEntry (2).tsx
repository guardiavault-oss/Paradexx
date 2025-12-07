import { useState } from "react";
import FlowingShaderBackground from "./FlowingShaderBackground";

interface WalletEntryProps {
  onCreateWallet: () => void;
  onLoginWallet: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export default function WalletEntry({ onCreateWallet, onLoginWallet, onShowTerms, onShowPrivacy }: WalletEntryProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <FlowingShaderBackground />

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-16 md:pt-24 pb-12">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="inline-block">
            <h1
              className="mb-4 relative"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "clamp(64px, 12vw, 140px)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                textTransform: "uppercase",
                // Chrome Prism Effect
                color: "transparent",
                background: "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 20%, #888888 45%, #444444 50%, #CCCCCC 70%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
              }}
            >
              Paradex
            </h1>
          </div>
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(14px, 2vw, 18px)",
              fontWeight: 500,
              letterSpacing: "0.05em",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Two Worlds. One Platform.
          </p>
        </div>

        {/* Spacer to push content */}
        <div className="flex-1" />

        {/* Wallet Options - Moved to bottom */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mb-8">
          {/* Create Wallet */}
          <button
            onClick={onCreateWallet}
            onMouseEnter={() => setHoveredButton("create")}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex-1 group relative overflow-hidden"
            style={{
              cursor: "pointer",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "2px solid rgba(220, 20, 60, 0.5)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(20px)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              boxShadow:
                hoveredButton === "create"
                  ? "0 15px 40px rgba(220, 20, 60, 0.4), 0 0 30px rgba(220, 20, 60, 0.3)"
                  : "0 8px 20px rgba(220, 20, 60, 0.2)",
            }}
          >
            {/* Gradient overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{
                background: "linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(139, 0, 0, 0.1) 100%)",
                borderRadius: "14px",
              }}
            />

            <div className="relative z-10 text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  color: "#DC143C",
                  textTransform: "uppercase",
                }}
              >
                New User
              </div>
              <h3
                className="mb-2"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Create Wallet
              </h3>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Start your journey with a brand new wallet. Choose your path between Degen and Regen.
              </p>

              {/* Icon */}
              <div className="mt-3 flex justify-center">
                <div
                  className="rounded-full transition-transform duration-400"
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "2px solid #DC143C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: hoveredButton === "create" ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  <span style={{ fontSize: "20px", color: "#DC143C", fontWeight: 900 }}>+</span>
                </div>
              </div>
            </div>
          </button>

          {/* Login to Existing Wallet */}
          <button
            onClick={onLoginWallet}
            onMouseEnter={() => setHoveredButton("login")}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex-1 group relative overflow-hidden"
            style={{
              padding: "1.25rem",
              borderRadius: "16px",
              border: "2px solid rgba(0, 212, 255, 0.5)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(20px)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hoveredButton === "login" ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
              boxShadow:
                hoveredButton === "login"
                  ? "0 15px 40px rgba(0, 212, 255, 0.4), 0 0 30px rgba(0, 212, 255, 0.3)"
                  : "0 8px 20px rgba(0, 212, 255, 0.2)",
            }}
          >
            {/* Gradient overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{
                background: "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%)",
                borderRadius: "14px",
              }}
            />

            <div className="relative z-10 text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  color: "#00d4ff",
                  textTransform: "uppercase",
                }}
              >
                Returning User
              </div>
              <h3
                className="mb-2"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Login to Wallet
              </h3>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Access your existing wallet with your credentials.
              </p>

              {/* Icon */}
              <div className="mt-3 flex justify-center">
                <div
                  className="rounded-full transition-transform duration-400"
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "2px solid #00d4ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: hoveredButton === "login" ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Legal Links Footer */}
        <div className="text-center">
          <p style={{ 
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "11px", 
            color: "rgba(255, 255, 255, 0.3)",
            letterSpacing: "0.05em"
          }}>
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}
              className="hover:underline transition-colors duration-200"
              onClick={onShowTerms}
            >
              Terms of Service
            </a>
            {" • "}
            <a 
              href="/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}
              className="hover:underline transition-colors duration-200"
              onClick={onShowPrivacy}
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}