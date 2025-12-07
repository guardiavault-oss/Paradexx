import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import NoiseBackground from "./NoiseBackground";
import { gsap } from "gsap";

interface SplashScreenProps {
  onComplete: () => void;
  type?: 'degen' | 'regen';
}

export function SplashScreen({ onComplete, type = 'degen' }: SplashScreenProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!textRef.current) return;

    const text = textRef.current.innerText;
    const chars = text.split('');
    
    // Clear and rebuild with individual character spans
    textRef.current.innerHTML = chars
      .map((char) => `<span class="char" style="display: inline-block; transform-style: preserve-3d;">${char}</span>`)
      .join('');

    const charElements = textRef.current.querySelectorAll('.char');
    const depth = -window.innerWidth / 8;
    const transformOrigin = `50% 50% ${depth}px`;

    gsap.set(textRef.current, { 
      perspective: 700, 
      transformStyle: "preserve-3d" 
    });

    gsap.set(charElements, {
      transformStyle: "preserve-3d",
      transformOrigin
    });

    // Create animation timeline
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.fromTo(
      charElements,
      { rotationX: -90, opacity: 0 },
      { 
        rotationX: 0, 
        opacity: 1,
        stagger: 0.08, 
        duration: 0.45, 
        ease: "power2.out", 
        transformOrigin 
      }
    ).to(
      charElements,
      { 
        rotationX: 90, 
        opacity: 0,
        stagger: 0.08, 
        duration: 0.45, 
        ease: "power2.in", 
        transformOrigin 
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
    >
      {/* Noise Background */}
      <NoiseBackground />

      {/* Logo with 3D Text Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
        }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10"
      >
        <div
          ref={textRef}
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(80px, 15vw, 180px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            textTransform: "uppercase",
            color: "transparent",
            background: "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 20%, #888888 45%, #444444 50%, #CCCCCC 70%, #FFFFFF 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
          }}
        >
          PARADEX
        </div>
      </motion.div>
    </motion.div>
  );
}
