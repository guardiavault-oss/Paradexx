import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";
import { getPerformanceConfig } from "@/utils/performance";

registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  accentColor: string;
}

interface Features3DCarouselProps {
  features: Feature[];
}

export default function Features3DCarousel({ features }: Features3DCarouselProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current || !carouselRef.current) return;

    const section = sectionRef.current;
    const carousel = carouselRef.current;
    let horizontalScroll: gsap.core.Tween | null = null;

    // Initialize after a short delay to ensure DOM is ready
    const initAnimation = () => {
      const cards = cardsRef.current.filter(Boolean);
      if (cards.length === 0) return;

      // Ensure ScrollTrigger is properly registered and available
      if (!ScrollTrigger || typeof ScrollTrigger.create !== 'function' || typeof ScrollTrigger.getAll !== 'function') {
        console.warn('[Features3DCarousel] ScrollTrigger not available, skipping animation');
        return;
      }

      // Ensure ScrollTrigger is registered
      if (typeof registerPlugin === 'function') {
        try {
          registerPlugin(ScrollTrigger, "ScrollTrigger");
        } catch (e) {
          // Plugin already registered, ignore
        }
      }

      // Clean up any existing ScrollTriggers
      if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger.vars && (trigger.vars.trigger === section || trigger.vars.trigger === carousel)) {
            trigger.kill();
          }
        });
      }

      // Get performance config for mobile optimization
      const perfConfig = getPerformanceConfig();
      
      // Horizontal scroll animation - use functions to recalculate on refresh
      horizontalScroll = gsap.to(carousel, {
        x: () => {
          const distance = carousel.scrollWidth - window.innerWidth;
          return -Math.max(distance, 0);
        },
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => {
            const distance = carousel.scrollWidth - window.innerWidth;
            // Add extra padding to ensure last card is fully visible and scroll goes all the way
            return `+=${distance + window.innerWidth * 1.5}`;
          },
          scrub: perfConfig.isMobile ? 0.5 : 0.8, // Less sticky - smoother scroll
          pin: true,
          anticipatePin: perfConfig.isMobile ? 0 : 0.5, // Less sticky
          id: "carouselScroll",
          onRefresh: () => {
            // Ensure ScrollTrigger is refreshed
          },
        },
      });

      // Use a small delay to ensure ScrollTrigger is fully created
      gsap.delayedCall(0.1, () => {
        const horizontalScrollTrigger = horizontalScroll?.scrollTrigger;
        
        // Only create card animations if horizontal scroll trigger exists and has bind method
        if (horizontalScrollTrigger && typeof horizontalScrollTrigger.bind === 'function') {
          // Bloom + 3D effect for each card - simplified on mobile
          cards.forEach((card, i) => {
            if (!card) return;

            // Simplified animations on mobile
            const initialY = perfConfig.isMobile ? 60 : 120;
            const initialRotateY = perfConfig.isMobile ? -20 : -40;
            const initialScale = perfConfig.isMobile ? 0.9 : 0.8;
            const initialBlur = perfConfig.isMobile ? 5 : 10;
            const finalBrightness = perfConfig.isMobile ? 1.0 : 1.2;

            // Add safety check before creating gsap animation
            try {
              gsap.fromTo(
                card,
                {
                  opacity: 0,
                  y: initialY,
                  rotateY: initialRotateY,
                  scale: initialScale,
                  filter: `brightness(0.6) blur(${initialBlur}px)`,
                },
                {
                  opacity: 1,
                  y: 0,
                  rotateY: 0,
                  scale: 1,
                  filter: `brightness(${finalBrightness}) blur(0px)`,
                  duration: perfConfig.isMobile ? 0.8 : 1.2,
                  scrollTrigger: {
                    trigger: card,
                    containerAnimation: horizontalScrollTrigger,
                    start: "left center",
                    end: "right center",
                    scrub: perfConfig.isMobile ? 0.5 : true, // Less smooth on mobile
                  },
                }
              );
            } catch (error) {
              console.warn('[Features3DCarousel] Failed to create card animation:', error);
              // Fallback: simple fade-in animation without ScrollTrigger
              gsap.fromTo(
                card,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, delay: i * 0.1 }
              );
            }
          });
        } else {
          console.warn('[Features3DCarousel] ScrollTrigger not properly initialized, using fallback animations');
          // Fallback animations without ScrollTrigger
          cards.forEach((card, i) => {
            if (!card) return;
            gsap.fromTo(
              card,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1 }
            );
          });
        }
      });

      // Refresh ScrollTrigger after initialization to recalculate scroll distance
      setTimeout(() => {
        if (ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
      }
        // Force recalculation of scroll distance
        if (horizontalScroll && horizontalScroll.scrollTrigger) {
          horizontalScroll.scrollTrigger.refresh();
        }
      }, 200);
      
      setTimeout(() => {
        if (ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
      }
      }, 500);
    };

    const timeoutId = setTimeout(initAnimation, 100);

    // Refresh on resize
    const handleResize = () => {
      if (ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("load", () => {
      setTimeout(() => ScrollTrigger.refresh(), 100);
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      if (horizontalScroll) {
        horizontalScroll.kill();
      }
      if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger.vars && (trigger.vars.trigger === section || trigger.vars.trigger === carousel)) {
            trigger.kill();
          }
        });
      }
    };
  }, [features.length]);

  return (
    <div
      ref={sectionRef}
      className="h-screen flex items-center justify-start relative overflow-hidden"
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        perspective: "2000px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={carouselRef}
        className="flex gap-12 transform-style-preserve-3d w-max px-10vw"
        style={{
          display: "flex",
          gap: "60px",
          transformStyle: "preserve-3d",
          width: "max-content",
          padding: "0 10vw",
        }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="card min-w-[320px] h-[420px] rounded-3xl overflow-hidden flex flex-col transform-style-preserve-3d transition-all duration-500"
              style={{
                minWidth: "320px",
                height: "420px",
                willChange: "transform, opacity, filter", // GPU acceleration
                borderRadius: "28px",
                background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(249,249,249,0.02))",
                border: `1px solid ${feature.accentColor}66`,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15), inset 0 0 20px rgba(223,156,55,0.08)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transformStyle: "preserve-3d",
                transition: "transform 0.5s ease, box-shadow 0.5s ease",
                filter: "brightness(0.9) blur(0px)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Icon/Image Section */}
              <div
                className="w-full h-[55%] flex items-center justify-center border-b-2"
                style={{
                  height: "55%",
                  borderBottom: `2px solid ${feature.accentColor}66`,
                  background: `linear-gradient(135deg, ${feature.accentColor}20, ${feature.accentColor}10)`,
                }}
              >
                <div
                  className="p-6 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${feature.accentColor}, ${feature.accentColor}80)`,
                    boxShadow: `0 10px 30px ${feature.accentColor}40`,
                  }}
                >
                  <Icon className="w-14 h-14 text-white" />
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900/90 to-slate-950/90">
                <div>
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#fff",
                      margin: "0 0 8px 0",
                    }}
                  >
                    {feature.title}
                  </h3>

                  <div
                    className="w-12 h-1 rounded mb-3"
                    style={{
                      width: "50px",
                      height: "3px",
                      background: `linear-gradient(90deg, ${feature.accentColor}, ${feature.accentColor}CC)`,
                      borderRadius: "2px",
                      marginBottom: "12px",
                    }}
                  />

                  <p
                    className="text-sm leading-relaxed text-slate-300"
                    style={{
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: "#ccc",
                      margin: "0",
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .card {
          will-change: transform, opacity, filter;
          transform: translateZ(0); /* Force GPU acceleration */
        }
        .card:hover {
          transform: scale(1.05) translateY(-8px) translateZ(0) !important;
          box-shadow: 0 25px 60px rgba(0,0,0,0.25), inset 0 0 30px rgba(223,156,55,0.12) !important;
          filter: brightness(1.1) blur(0px) !important;
        }
        @media (max-width: 768px) {
          .card {
            /* Reduce hover effects on mobile for better performance */
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
        }
      `}</style>
    </div>
  );
}
