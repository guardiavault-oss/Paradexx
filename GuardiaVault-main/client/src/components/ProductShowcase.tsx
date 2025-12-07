import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";

import { logError } from "@/utils/logger";

// Import screenshots from public folder
const wizardStep1Img = "/wizard-step1.png";
const wizardStep2Img = "/wizard-step2.png";
const wizardStep3Img = "/wizard-step3.png";
const passphraseDisplayImg = "/passphrase-display.png";
const dashboardWithVaultImg = "/dashboard-with-vault.png";
const recoveryPageImg = "/recovery-page.png";

registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Screenshot {
  title: string;
  description: string;
  image: string;
}

const screenshots: Screenshot[] = [
  {
    title: "Your Protection Dashboard",
    description: "See everything in one place—your protection plan, check-in status, and the people helping your family.",
    image: dashboardWithVaultImg,
  },
  {
    title: "Step 1: Choose Your Schedule",
    description: "Pick when you want to check in—weekly, monthly, or whatever works for your life.",
    image: wizardStep1Img,
  },
  {
    title: "Step 2: Pick Your Helpers",
    description: "Choose trusted friends or family members who will help protect your assets for your loved ones.",
    image: wizardStep2Img,
  },
  {
    title: "Step 3: Choose Your Family",
    description: "Select who will receive your assets when the time comes.",
    image: wizardStep3Img,
  },
  {
    title: "Secure Information Sharing",
    description: "Your helpers receive secure information they'll need later—all encrypted and protected.",
    image: passphraseDisplayImg,
  },
  {
    title: "Easy Recovery For Your Family",
    description: "When needed, your family can easily collect the secure pieces from your helpers.",
    image: recoveryPageImg,
  },
];

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  useEffect(() => {
    if (!horizontalRef.current || !scrollContainerRef.current) return;

    // Check if mobile (disable horizontal scroll on mobile)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, make it a simple vertical scroll
      const horizontal = horizontalRef.current;
      horizontal.style.display = 'flex';
      horizontal.style.flexDirection = 'column';
      horizontal.style.gap = '3rem';
      horizontal.style.padding = '2rem 1rem';
      
      // Animate cards in on scroll
      const cards = horizontal.querySelectorAll('.screenshot-card');
      cards.forEach((card, index) => {
        const cardElement = card as HTMLElement;
        gsap.fromTo(cardElement.parentElement, 
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardElement.parentElement,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
      
      return;
    }

    // Desktop: Horizontal scroll animation
    const horizontal = horizontalRef.current;
    const scrollContainer = scrollContainerRef.current;
    const cards = horizontal.querySelectorAll('.screenshot-card');

    // Reset mobile styles
    horizontal.style.display = '';
    horizontal.style.flexDirection = '';
    horizontal.style.gap = '';
    horizontal.style.padding = '';

    // Calculate total scroll width
    const scrollWidth = horizontal.scrollWidth - scrollContainer.offsetWidth;

    // Smooth horizontal scroll animation
    const scrollTween = gsap.to(horizontal, {
      x: -scrollWidth,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: () => `+=${scrollWidth + 100}`,
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Keep all cards at full size - no scale animations
    cards.forEach((card) => {
      const cardElement = card as HTMLElement;
      gsap.set(cardElement, {
        scale: 1,
        opacity: 1,
      });
    });

    // Handle resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      scrollTween.kill();
      ScrollTrigger.refresh();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pt-20 sm:pt-32 md:pt-40 pb-12 md:pb-24 relative overflow-hidden"
      id="product"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10 mb-6 sm:mb-8 md:mb-12 lg:mb-16">
        <div ref={titleRef} className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-display mb-3 sm:mb-4 md:mb-5 tracking-tight">
            See It In Action
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Earn yield on your crypto while it's automatically protected for your family. Simple, clear, and designed for everyone.
          </p>
        </div>
      </div>

      {/* Horizontal Scroll Container - Vertically Centered */}
      {/* Mobile: Use vertical stack, Desktop: Horizontal scroll */}
      <div 
        ref={scrollContainerRef} 
        className="min-h-screen md:min-h-screen flex flex-col justify-center overflow-hidden"
      >
        <div ref={horizontalRef} className="flex gap-6 md:gap-8 px-4 md:px-12 items-center will-change-transform">
          {screenshots.map((screenshot, index) => (
            <div
              key={`screenshot-${screenshot.image}-${index}`}
              className="flex-shrink-0 w-[90vw] sm:w-[85vw] md:w-[70vw] lg:w-[55vw] flex flex-col"
            >
              {/* Fixed height image container - responsive height */}
              <div className="h-[50vh] sm:h-[60vh] md:h-[70vh] flex items-center justify-center">
                <div 
                  className="screenshot-card bg-card rounded-xl md:rounded-2xl p-2 w-full h-full"
                  style={{
                    opacity: 1,
                    transform: 'scale(1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={screenshot.image}
                    alt={screenshot.title}
                    key={`img-${screenshot.image}-${index}`}
                    className="rounded-lg md:rounded-xl border border-border/50"
                    style={{
                      height: '100%',
                      width: 'auto',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
                      opacity: 1,
                      backgroundColor: 'transparent',
                    }}
                    loading="lazy"
                    onError={(e) => {
                      logError(new Error(`Failed to load image: ${screenshot.image}`), {
                        context: "ProductShowcase",
                        image: screenshot.image,
                      });
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                </div>
              </div>

              {/* Description below the image */}
              <div className="mt-4 md:mt-6 text-center px-2">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-display mb-2 md:mb-3 gradient-text-primary">
                  {screenshot.title}
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  {screenshot.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <div className="hidden md:block text-center mt-12 text-sm text-muted-foreground">
        <p>↓ Scroll down to explore →</p>
      </div>
      <div className="md:hidden text-center mt-8 text-sm text-muted-foreground px-4">
        <p>↓ Swipe or scroll to see more →</p>
      </div>
    </section>
  );
}
