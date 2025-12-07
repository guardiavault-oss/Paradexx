import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

interface BurnTransitionProps {
    /** Whether the burn animation should play */
    isBurning: boolean;
    /** Callback when burn animation completes */
    onBurnComplete?: () => void;
    /** Duration of burn animation in seconds */
    duration?: number;
    /** Children to render inside the burn container */
    children: React.ReactNode;
    /** Z-index of the burn layer */
    zIndex?: number;
}

// CDN URLs for burn effect sprite sheets
const BURN_SPRITES = {
    burnMask: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/burnStrip.jpg",
    burnLine: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/burnlineStrip.jpg",
    ashInner: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/ashInnerStrip.jpg",
    ashOuter: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/ashOuterStrip.jpg",
};

/**
 * BurnTransition - A dramatic page transition effect that "burns away" content
 * 
 * Usage:
 * ```tsx
 * <BurnTransition 
 *   isBurning={isLoggingIn} 
 *   onBurnComplete={() => navigateToDashboard()}
 * >
 *   <LoginForm />
 * </BurnTransition>
 * ```
 */
export default function BurnTransition({
    isBurning,
    onBurnComplete,
    duration = 1.5,
    children,
    zIndex = 50,
}: BurnTransitionProps) {
    const [burnPhase, setBurnPhase] = useState<"idle" | "burning" | "burned">("idle");

    useEffect(() => {
        if (isBurning && burnPhase === "idle") {
            setBurnPhase("burning");

            // Trigger completion callback after burn animation
            const burnTimer = setTimeout(() => {
                setBurnPhase("burned");
                onBurnComplete?.();
            }, duration * 1000 + 500); // Extra 500ms for ash effect

            return () => clearTimeout(burnTimer);
        }
    }, [isBurning, burnPhase, duration, onBurnComplete]);

    // Reset when isBurning becomes false
    useEffect(() => {
        if (!isBurning) {
            setBurnPhase("idle");
        }
    }, [isBurning]);

    // Don't render if already burned
    if (burnPhase === "burned") {
        return null;
    }

    const burnAnimationDuration = `${duration}s`;
    const ashAnimationDuration = "2s";

    return (
        <div
            className="burn-container"
            style={{
                position: "fixed",
                inset: 0,
                zIndex,
                overflow: "hidden",
                pointerEvents: burnPhase === "burning" ? "none" : "auto",
            }}
        >
            {/* Burn mask layer - reveals/hides content */}
            <div
                className="burn-mask"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${BURN_SPRITES.burnMask})`,
                    backgroundSize: "auto 100%",
                    backgroundPosition: "0 0",
                    animation: burnPhase === "burning"
                        ? `burn ${burnAnimationDuration} forwards steps(50, end)`
                        : "none",
                }}
            />

            {/* Content layer with darken blend */}
            <div
                className="burn-content"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    mixBlendMode: "darken",
                }}
            >
                {children}
            </div>

            {/* Glowing burn edge */}
            <div
                className="burn-line"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${BURN_SPRITES.burnLine})`,
                    backgroundSize: "auto 100%",
                    backgroundPosition: "0 0",
                    mixBlendMode: "lighten",
                    animation: burnPhase === "burning"
                        ? `burn ${burnAnimationDuration} forwards steps(50, end)`
                        : "none",
                }}
            />

            {/* Inner ash particles */}
            <div
                className="ash-inner"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${BURN_SPRITES.ashInner})`,
                    backgroundSize: "auto 100%",
                    backgroundPosition: "0 0",
                    mixBlendMode: "screen",
                    animation: burnPhase === "burning"
                        ? `ash ${ashAnimationDuration} infinite steps(66, end)`
                        : "none",
                }}
            />

            {/* Outer ash particles */}
            <div
                className="ash-outer"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${BURN_SPRITES.ashOuter})`,
                    backgroundSize: "auto 100%",
                    backgroundPosition: "0 0",
                    mixBlendMode: "difference",
                    animation: burnPhase === "burning"
                        ? `ash ${ashAnimationDuration} infinite steps(66, end)`
                        : "none",
                }}
            />

            {/* CSS Keyframes injected via style tag */}
            <style>{`
        @keyframes burn {
          from { background-position: 0 0; }
          to { background-position: -38145px 0; }
        }
        
        @keyframes ash {
          from { background-position: 0 0; }
          to { background-position: -50190px 0; }
        }
      `}</style>
        </div>
    );
}

/**
 * Hook to manage burn transition state
 */
export function useBurnTransition() {
    const [isBurning, setIsBurning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const triggerBurn = useCallback(() => {
        setIsBurning(true);
    }, []);

    const handleBurnComplete = useCallback(() => {
        setIsComplete(true);
        setIsBurning(false);
    }, []);

    const reset = useCallback(() => {
        setIsBurning(false);
        setIsComplete(false);
    }, []);

    return {
        isBurning,
        isComplete,
        triggerBurn,
        handleBurnComplete,
        reset,
    };
}
