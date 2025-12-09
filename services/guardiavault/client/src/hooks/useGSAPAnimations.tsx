import { useEffect } from "react";
// Optimized GSAP imports - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, ScrollSmoother, TextPlugin, registerPlugin } from "@/lib/gsap-optimized";
import { getPerformanceConfig } from "@/utils/performance";

// Register GSAP plugins conditionally (only when needed)
let pluginsRegistered = false;
function registerGSAPPlugins() {
  if (!pluginsRegistered) {
    registerPlugin(ScrollTrigger, "ScrollTrigger");
    registerPlugin(ScrollSmoother, "ScrollSmoother");
    registerPlugin(TextPlugin, "TextPlugin");
    pluginsRegistered = true;
  }
}

export function useGSAPAnimations() {
  const perfConfig = getPerformanceConfig();

  useEffect(() => {
    // Register plugins before use
    registerGSAPPlugins();
    
    // Configure ScrollTrigger
    ScrollTrigger.config({
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
    });

    // Create smooth scroller - only if enabled (disabled on mobile)
    let smoother: ScrollSmoother | null = null;
    if (perfConfig.enableScrollSmoother) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5, // Reduced from 2 for better performance
        smoothTouch: 0.1,
        normalizeScroll: true,
        ignoreMobileResize: true,
        effects: !perfConfig.isMobile, // Disable effects on mobile
      });
    }

    // Parallax effects for sections
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

    // Fade in animations
    gsap.utils.toArray(".fade-in").forEach((element: any) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 60,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Scale animations
    gsap.utils.toArray(".scale-in").forEach((element: any) => {
      gsap.fromTo(
        element,
        {
          scale: 0.8,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Text reveal animations - use composited properties (transform/opacity)
    gsap.utils.toArray(".text-reveal").forEach((text: any) => {
      // Use clip-path or mask for composited animation instead of backgroundSize
      gsap.fromTo(
        text,
        {
          clipPath: "inset(0 100% 0 0)",
          opacity: 0.3,
        },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 1.5,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: text,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Stagger animations for lists
    gsap.utils.toArray(".stagger-list").forEach((list: any) => {
      const items = list.querySelectorAll(".stagger-item");
      gsap.fromTo(
        items,
        {
          opacity: 0,
          x: -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: list,
            start: "top 80%",
          },
        }
      );
    });

    // Floating animation for cards - only if not reducing animations
    if (!perfConfig.reduceAnimations) {
      gsap.utils.toArray(".float-card").forEach((card: any) => {
        gsap.to(card, {
          y: "random(-20, 20)",
          rotation: "random(-5, 5)",
          duration: "random(4, 6)",
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }

    // Counter animations
    gsap.utils.toArray(".counter").forEach((counter: any) => {
      const target = parseFloat(counter.getAttribute("data-target")) || 0;
      const suffix = counter.getAttribute("data-suffix") || "";
      const prefix = counter.getAttribute("data-prefix") || "";
      
      const obj = { value: 0 };
      
      gsap.to(obj, {
        value: target,
        duration: 2,
        ease: "power1.out",
        scrollTrigger: {
          trigger: counter,
          start: "top 80%",
          once: true,
        },
        onUpdate: () => {
          counter.textContent = `${prefix}${Math.floor(obj.value)}${suffix}`;
        },
      });
    });

    // Magnetic buttons - only if not reducing animations
    if (!perfConfig.reduceAnimations) {
      document.querySelectorAll(".magnetic-btn").forEach((btn) => {
        const element = btn as HTMLElement;
        let mouseMoveHandler: (e: MouseEvent) => void;
        let mouseLeaveHandler: () => void;
        
        mouseMoveHandler = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(element, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
          });
        };
        
        mouseLeaveHandler = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.3,
          });
        };
        
        element.addEventListener("mousemove", mouseMoveHandler as EventListener);
        element.addEventListener("mouseleave", mouseLeaveHandler);
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      smoother?.kill();
    };
  }, []);
}

// Additional utility functions
export const animateOnScroll = (selector: string, animation: any) => {
  gsap.to(selector, {
    ...animation,
    scrollTrigger: {
      trigger: selector,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
    },
  });
};

export const animateText = (selector: string) => {
  const element = document.querySelector(selector);
  if (!element) return;
  
  const text = element.textContent || "";
  element.innerHTML = "";
  
  text.split("").forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.display = "inline-block";
    element.appendChild(span);
    
    gsap.fromTo(
      span,
      {
        opacity: 0,
        y: 50,
        rotationX: -90,
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.5,
        delay: i * 0.02,
        ease: "back.out(1.7)",
      }
    );
  });
};
