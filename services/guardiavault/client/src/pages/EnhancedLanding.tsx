import { useEffect, useLayoutEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import VaultHero from "@/components/VaultHero";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/Footer";
import ThreeBackground from "@/components/ThreeBackground";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, ScrollSmoother, registerPlugin } from "@/lib/gsap-optimized";

registerPlugin(ScrollTrigger, "ScrollTrigger");
registerPlugin(ScrollSmoother, "ScrollSmoother");

export default function EnhancedLanding() {
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Initialize GSAP animations
  useGSAPAnimations();

  useLayoutEffect(() => {
    // Create smooth scroll wrapper
    const ctx = gsap.context(() => {
      // Smooth scrolling
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 2,
        effects: true,
        smoothTouch: 0.1,
      });

      // Parallax effects for hero
      gsap.to(".hero-parallax", {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Fade and scale animations for sections
      gsap.utils.toArray(".section-animate").forEach((section: any, i) => {
        gsap.fromTo(section,
          {
            opacity: 0,
            scale: 0.9,
            y: 100,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 20%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Text animations
      gsap.utils.toArray(".text-split").forEach((text: any) => {
        const chars = text.textContent.split("");
        text.innerHTML = "";
        chars.forEach((char: string) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          text.appendChild(span);
        });

        gsap.fromTo(text.children,
          {
            opacity: 0,
            y: 100,
            rotateZ: -10,
          },
          {
            opacity: 1,
            y: 0,
            rotateZ: 0,
            stagger: 0.02,
            duration: 0.5,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: text,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Floating cards animation
      gsap.utils.toArray(".float-card").forEach((card: any, i) => {
        gsap.to(card, {
          y: "random(-30, 30)",
          x: "random(-20, 20)",
          rotation: "random(-5, 5)",
          duration: "random(4, 6)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        });
      });

      // Counter animations
      gsap.utils.toArray(".counter").forEach((counter: any) => {
        const target = parseFloat(counter.getAttribute("data-value")) || 0;
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
            counter.textContent = Math.floor(obj.value);
          },
        });
      });

      // Magnetic buttons
      document.querySelectorAll(".magnetic").forEach((elem) => {
        const btn = elem as HTMLElement;
        
        btn.addEventListener("mousemove", (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
          });
        });
        
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.3,
          });
        });
      });

      // Skew effect on scroll
      let proxy = { skew: 0 };
      let skewSetter = gsap.quickSetter(".skew-scroll", "skewY", "deg");
      let clamp = gsap.utils.clamp(-10, 10);
      
      ScrollTrigger.create({
        onUpdate: (self) => {
          let skew = clamp(self.getVelocity() / -300);
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew;
            gsap.to(proxy, {
              skew: 0,
              duration: 0.8,
              ease: "power3",
              overwrite: true,
              onUpdate: () => skewSetter(proxy.skew),
            });
          }
        },
      });

      return () => smoother.kill();
    }, mainRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "";
    };
  }, []);

  return (
    <div ref={mainRef}>
      {/* Three.js Background */}
      <ThreeBackground />
      
      {/* Smooth Scroll Wrapper */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="min-h-screen relative z-10">
            <Navigation />
            
            {/* Hero Section with Parallax */}
            <div className="hero-section relative">
              <div className="hero-parallax">
                <VaultHero />
              </div>
            </div>

            {/* Animated Sections */}
            <div className="section-animate">
              <ProblemSection />
            </div>
            
            <div className="section-animate">
              <SolutionSection />
            </div>
            
            <div className="section-animate skew-scroll">
              <HowItWorksSection />
            </div>
            
            <div className="section-animate">
              <FeaturesSection />
            </div>
            
            <div className="section-animate">
              <PricingSection />
            </div>
            
            <div className="section-animate">
              <FAQSection />
            </div>
            
            <Footer />
          </div>
        </div>
      </div>

      {/* Custom Cursor */}
      <div className="custom-cursor" />
      <div className="custom-cursor-follower" />
    </div>
  );
}
