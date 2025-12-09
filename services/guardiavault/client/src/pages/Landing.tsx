import { useEffect, lazy, Suspense, useLayoutEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import VaultHero from "../components/VaultHero";
import UnifiedBackground from "../components/landing/UnifiedBackground";
// Lazy load heavy components below the fold
const YieldCalculator = lazy(() => import("../components/landing/YieldCalculator"));
const YieldStrategiesSection = lazy(() => import("../components/landing/YieldStrategiesSection"));
const ProblemSection = lazy(() => import("../components/landing/ProblemSection"));
const SolutionSection = lazy(() => import("../components/landing/SolutionSection"));
const HowItWorksSection = lazy(() => import("../components/landing/HowItWorksSection"));
const FeaturesSection = lazy(() => import("../components/landing/FeaturesSection"));
const PricingSection = lazy(() => import("../components/landing/PricingSection"));
const FAQSection = lazy(() => import("../components/landing/FAQSection"));
const MarqueeSection = lazy(() => import("../components/landing/MarqueeSection"));
import Footer from "../components/Footer";
import { useGsapScroll } from "../hooks/useGsapScroll";
import { useTextReveal } from "../hooks/useTextReveal";
import { getPerformanceConfig } from "../utils/performance";
import { gsap, ScrollTrigger, ScrollSmoother, registerPlugin } from "../lib/gsap-optimized";
import "../styles/animations.css";

registerPlugin(ScrollTrigger, "ScrollTrigger");
registerPlugin(ScrollSmoother, "ScrollSmoother");

export default function Landing() {
  useGsapScroll();
  useTextReveal();
  const perfConfig = getPerformanceConfig();
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only hide horizontal overflow on desktop - allow native scrolling on mobile
    if (!perfConfig.isMobile) {
      document.body.style.overflowX = "hidden";
    }
    return () => {
      document.body.style.overflowX = "";
    };
  }, [perfConfig.isMobile]);

  // Enhanced GSAP animations with ScrollSmoother
  useLayoutEffect(() => {
    const cleanupFunctions: (() => void)[] = [];
    const ctx = gsap.context(() => {
      // Create smooth scroller - COMPLETELY DISABLED on mobile for native scrolling
      let smoother: ScrollSmoother | null = null;
      // Only enable ScrollSmoother on desktop - mobile uses native scrolling
      if (!perfConfig.isMobile && perfConfig.enableScrollSmoother && smoothWrapperRef.current && smoothContentRef.current) {
        smoother = ScrollSmoother.create({
          wrapper: smoothWrapperRef.current,
          content: smoothContentRef.current,
          smooth: 1.5,
          smoothTouch: 0.1,
          normalizeScroll: true,
          effects: true,
          ignoreMobileResize: true,
        });
      }

      // Parallax effects for hero - disabled on mobile for performance
      if (!perfConfig.isMobile) {
        gsap.utils.toArray(".parallax-section").forEach((section: any) => {
          const bg = section.querySelector(".parallax-bg");
          if (bg) {
            gsap.to(bg, {
              yPercent: -50,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            });
          }
        });
      }

      // Enhanced section animations
      gsap.utils.toArray(".section-animate").forEach((section: any, i) => {
        if (!section) return;

        const animationType = section.classList.contains("fade-in") ? "fade-in" :
                            section.classList.contains("scale-in") ? "scale-in" :
                            section.classList.contains("skew-scroll") ? "skew-scroll" : "fade-in";

        // Simplified animations on mobile
        const duration = perfConfig.reduceAnimations ? 0.6 : 1.2;
        const delay = perfConfig.reduceAnimations ? i * 0.05 : i * 0.1;

        if (animationType === "fade-in") {
          gsap.fromTo(
            section,
            { opacity: 0, y: perfConfig.reduceAnimations ? 40 : 80, rotationX: perfConfig.reduceAnimations ? 0 : -5 },
            {
              opacity: 1,
              y: 0,
              rotationX: 0,
              duration,
              ease: "power3.out",
              delay,
              scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        } else if (animationType === "scale-in") {
          gsap.fromTo(
            section,
            { opacity: 0, scale: perfConfig.reduceAnimations ? 0.95 : 0.85, y: perfConfig.reduceAnimations ? 30 : 50, rotationY: perfConfig.reduceAnimations ? 0 : -10 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              rotationY: 0,
              duration: 1,
              ease: "back.out(1.4)",
              delay: i * 0.1,
              scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        } else if (animationType === "skew-scroll") {
          // Skew scroll effect
          let skewSetter = gsap.quickSetter(section, "skewY", "deg");
          let clamp = gsap.utils.clamp(-8, 8);

          ScrollTrigger.create({
            trigger: section,
            onUpdate: (self) => {
              const velocity = clamp(self.getVelocity() / -300);
              skewSetter(velocity);
            },
          });
        }
      });

      // Rolling number animations
      gsap.utils.toArray(".rolling-number").forEach((counter: any) => {
        const target = parseFloat(counter.getAttribute("data-value")) || 0;
        const prefix = counter.getAttribute("data-prefix") || "";
        const suffix = counter.getAttribute("data-suffix") || "";
        const decimals = parseInt(counter.getAttribute("data-decimals") || "0");

        const obj = { value: 0 };

        gsap.to(obj, {
          value: target,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 80%",
            once: true,
          },
          onUpdate: () => {
            const val = decimals > 0 ? obj.value.toFixed(decimals) : Math.floor(obj.value);
            counter.textContent = `${prefix}${val}${suffix}`;
          },
        });
      });

      // Magnetic button effects - disabled on mobile (touch devices don't have mouse)
      if (!perfConfig.isMobile) {
        const magneticButtons = gsap.utils.toArray(".magnetic-btn") as HTMLElement[];

        magneticButtons.forEach((btn: HTMLElement) => {
          const handleMouseMove = (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
              x: x * 0.3,
              y: y * 0.3,
              rotation: x * 0.05,
              duration: 0.5,
              ease: "power2.out",
            });
          };

          const handleMouseLeave = () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.5,
              ease: "power2.out",
            });
          };

          btn.addEventListener("mousemove", handleMouseMove);
          btn.addEventListener("mouseleave", handleMouseLeave);

          cleanupFunctions.push(() => {
            btn.removeEventListener("mousemove", handleMouseMove);
            btn.removeEventListener("mouseleave", handleMouseLeave);
          });
        });
      }

      // Floating card animations - reduced on mobile
      gsap.utils.toArray(".float-card").forEach((card: any, i) => {
        const floatDistance = perfConfig.isMobile ? 20 : 40;
        const floatX = perfConfig.isMobile ? 15 : 30;
        const floatRotation = perfConfig.isMobile ? 4 : 8;
        const duration = perfConfig.isMobile ? "random(4, 6)" : "random(3, 5)";

        gsap.to(card, {
          y: `random(-${floatDistance}, ${floatDistance})`,
          x: `random(-${floatX}, ${floatX})`,
          rotation: `random(-${floatRotation}, ${floatRotation})`,
          duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * (perfConfig.isMobile ? 0.4 : 0.3),
        });
      });

      // Text reveal with character splitting - simplified on mobile
      gsap.utils.toArray(".text-reveal-split").forEach((text: any) => {
        if (perfConfig.isMobile) {
          // Simple fade-in on mobile instead of character splitting
          gsap.fromTo(
            text,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: text,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        } else {
          // Full character splitting animation on desktop
          const chars = text.textContent?.split("") || [];
          text.innerHTML = "";

          chars.forEach((char: string) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            span.style.opacity = "0";
            span.style.transform = "translateY(100%) rotateX(-90deg)";
            text.appendChild(span);
          });

          gsap.to(text.querySelectorAll("span"), {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.8,
            stagger: 0.03,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: text,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          });
        }
      });

      // Refresh ScrollTrigger after a delay to ensure all components are loaded
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      // Cleanup magnetic button listeners
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Unified Background - Fixed position covering entire viewport, stays in place while scrolling */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <UnifiedBackground />
      </div>

      {/* Navigation - Outside smooth wrapper so it stays fixed */}
      <Navigation />

      {/* On mobile: Use native scrolling without ScrollSmoother wrapper */}
      {perfConfig.isMobile ? (
        <div className="relative z-10">
          <div className="pt-18">
          {/* Hero - Yield-focused */}
          <div className="parallax-section">
            <VaultHero />
          </div>

          {/* The Silent Crisis in Crypto */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProblemSection />
            </Suspense>
          </div>

          {/* The Solution */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <SolutionSection />
            </Suspense>
          </div>

          {/* How It Works */}
          <div className="section-animate skew-scroll">
            <Suspense fallback={<div className="min-h-[600px]" />}>
              <HowItWorksSection />
            </Suspense>
          </div>

          {/* Choose Your Perfect Earning Strategy */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <YieldStrategiesSection />
            </Suspense>
          </div>

          {/* See How Much You Can Earn - Compare vs traditional savings */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <YieldCalculator />
            </Suspense>
          </div>

          {/* Built for Tomorrow */}
          <div className="section-animate scale-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <FeaturesSection />
            </Suspense>
          </div>

          {/* Pricing */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <PricingSection />
            </Suspense>
          </div>

          {/* FAQ */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <FAQSection />
            </Suspense>
          </div>

          {/* Social Proof */}
          <div className="section-animate">
            <Suspense fallback={<div className="min-h-[200px]" />}>
              <MarqueeSection />
            </Suspense>
          </div>

          <Footer />
          </div>
        </div>
      ) : (
        /* Desktop: Use ScrollSmoother wrapper */
        <div
          id="smooth-wrapper"
          ref={smoothWrapperRef}
          className="relative z-10"
        >
          <div
            id="smooth-content"
            ref={smoothContentRef}
          >
          <div className="pt-18">
          {/* Hero - Yield-focused */}
          <div className="parallax-section">
            <VaultHero />
          </div>

          {/* The Silent Crisis in Crypto */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProblemSection />
            </Suspense>
          </div>

          {/* The Solution */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <SolutionSection />
            </Suspense>
          </div>

          {/* How It Works */}
          <div className="section-animate skew-scroll">
            <Suspense fallback={<div className="min-h-[600px]" />}>
              <HowItWorksSection />
            </Suspense>
          </div>

          {/* Choose Your Perfect Earning Strategy */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <YieldStrategiesSection />
            </Suspense>
          </div>

          {/* See How Much You Can Earn - Compare vs traditional savings */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <YieldCalculator />
            </Suspense>
          </div>

          {/* Built for Tomorrow */}
          <div className="section-animate scale-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <FeaturesSection />
            </Suspense>
          </div>

          {/* Pricing */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <PricingSection />
            </Suspense>
          </div>

          {/* FAQ */}
          <div className="section-animate fade-in">
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <FAQSection />
            </Suspense>
          </div>

          {/* Social Proof */}
          <div className="section-animate">
            <Suspense fallback={<div className="min-h-[200px]" />}>
              <MarqueeSection />
            </Suspense>
          </div>

          <Footer />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
