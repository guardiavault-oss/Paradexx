import { ArrowRight, UserPlus, Shield, Fingerprint, TrendingUp, Key, CheckCircle } from "lucide-react";
import { useEffect, useRef } from "react";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, MotionPathPlugin, registerPlugin } from "@/lib/gsap-optimized";
import { getPerformanceConfig } from "@/utils/performance";
import { OptimizedImage } from "@/components/OptimizedImage";

registerPlugin(ScrollTrigger, "ScrollTrigger");
registerPlugin(MotionPathPlugin, "MotionPathPlugin");

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Vault",
    description: "Set up your secure vault and define your inheritance plan in minutes.",
    image: "/dashboard-create-vault.png",
    details: [
      "Connect your wallet",
      "Set check-in frequency",
      "Define beneficiaries",
    ],
  },
  {
    number: "02",
    icon: Shield,
    title: "Add Guardians",
    description: "Choose 3 trusted guardians who will hold encrypted key fragments.",
    image: "/dashboard-guardians-setup.png",
    details: [
      "Invite via email/SMS",
      "Automatic encryption",
      "2-of-3 threshold recovery",
    ],
  },
  {
    number: "03",
    icon: Fingerprint,
    title: "Regular Check-ins",
    description: "Prove you're alive with biometric verification on your schedule.",
    image: "/dashboard-checkin.png",
    details: [
      "Face ID / Touch ID",
      "Flexible scheduling",
      "Grace periods",
    ],
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Earn Yield",
    description: "Your protected assets automatically generate 5-8% APY.",
    image: "/dashboard-yield-earnings.png",
    details: [
      "Auto-compound daily",
      "Multiple DeFi protocols",
      "Only 1% performance fee",
    ],
  },
  {
    number: "05",
    icon: Key,
    title: "Secure Recovery",
    description: "If needed, guardians can help beneficiaries recover access.",
    image: "/dashboard-recovery.png",
    details: [
      "Death certificate verification",
      "Guardian consensus required",
      "Time-locked for security",
    ],
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineSvgRef = useRef<SVGSVGElement>(null);
  const timelinePathRef = useRef<SVGPathElement>(null);
  const timelineBallRef = useRef<SVGCircleElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);
  const imagesRef = useRef<HTMLDivElement[]>([]);
  const circlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const perfConfig = getPerformanceConfig();

    const ctx = gsap.context(() => {
      // Header animation
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
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
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Timeline line animation
      if (timelineRef.current) {
        gsap.fromTo(
          timelineRef.current,
          {
            scaleY: 0,
            transformOrigin: "top",
          },
          {
            scaleY: 1,
            duration: 2,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: timelineRef.current,
              start: "top 80%",
              end: "bottom 20%",
              scrub: 1.5,
            },
          }
        );
      }

      // Animate each step with advanced scroll effects
      stepsRef.current.forEach((step, index) => {
        if (!step) return;
        const image = imagesRef.current[index];
        const circle = circlesRef.current[index];
        const isEven = index % 2 === 0;

        // Step container entrance
        gsap.fromTo(
          step,
          {
            opacity: 0,
            y: 100,
            x: isEven ? -80 : 80,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              end: "top 50%",
              scrub: 1.5,
            },
          }
        );

        // Image 3D parallax effect
        if (image) {
          gsap.fromTo(
            image,
            {
              opacity: 0,
              scale: 0.85,
              rotateY: isEven ? -15 : 15,
              z: -100,
            },
            {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              z: 0,
              duration: 1.5,
              ease: "power3.out",
              scrollTrigger: {
                trigger: image,
                start: "top 85%",
                end: "top 40%",
                scrub: 2,
              },
            }
          );

          // Continuous parallax on scroll
          gsap.to(image, {
            y: -30,
            scrollTrigger: {
              trigger: image,
              start: "top 85%",
              end: "bottom 15%",
              scrub: 1,
            },
          });
        }

        // Circle pulse animation
        if (circle) {
          gsap.fromTo(
            circle,
            {
              scale: 0,
              opacity: 0,
            },
            {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: circle,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );

          // Continuous pulse effect
          gsap.to(circle, {
            scale: 1.2,
            opacity: 0.8,
            repeat: -1,
            yoyo: true,
            duration: 2,
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: circle,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none none",
            },
          });
        }

        // Number and icon stagger animation
        const numberElement = step.querySelector('[data-step-number]');
        const iconElement = step.querySelector('[data-step-icon]');
        const titleElement = step.querySelector('[data-step-title]');
        const descriptionElement = step.querySelector('[data-step-description]');
        const detailsList = step.querySelector('[data-step-details]');

        if (numberElement) {
          gsap.fromTo(
            numberElement,
            {
              opacity: 0,
              scale: 0.5,
              rotation: -180,
            },
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 1,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: step,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (iconElement) {
          gsap.fromTo(
            iconElement,
            {
              opacity: 0,
              scale: 0,
              rotation: 180,
            },
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 0.8,
              ease: "back.out(1.7)",
              delay: 0.2,
              scrollTrigger: {
                trigger: step,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (titleElement) {
          gsap.fromTo(
            titleElement,
            {
              opacity: 0,
              y: 30,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              delay: 0.3,
              scrollTrigger: {
                trigger: step,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (descriptionElement) {
          gsap.fromTo(
            descriptionElement,
            {
              opacity: 0,
              y: 20,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              delay: 0.4,
              scrollTrigger: {
                trigger: step,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (detailsList) {
          const details = detailsList.querySelectorAll("li");
          gsap.fromTo(
            details,
            {
              opacity: 0,
              x: -20,
            },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.1,
              delay: 0.5,
              scrollTrigger: {
                trigger: detailsList,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // Animated Timeline Path
      if (timelinePathRef.current && timelineBallRef.current && timelineSvgRef.current) {
        const path = timelinePathRef.current;
        const ball = timelineBallRef.current;
        const svg = timelineSvgRef.current;

        // Calculate path length and set up stroke-dasharray animation
        const pathLength = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        // Create pulse animations for circles at each step
        const pulseTimeline = gsap.timeline({
          defaults: {
            duration: 0.05,
            autoAlpha: 1,
            scale: 2,
            transformOrigin: "center",
            ease: "elastic(2.5, 1)"
          }
        });

        // Pulse each circle at different progress points
        circlesRef.current.forEach((circle, index) => {
          if (circle) {
            const progress = (index + 1) / steps.length;
            pulseTimeline.to(circle, {}, progress * 0.8);
          }
        });

        // Main timeline animation
        const mainTimeline = gsap.timeline({
          defaults: { duration: 1 },
          scrollTrigger: {
            trigger: timelineRef.current || svg,
            scrub: true,
            start: "top center",
            end: "bottom center"
          }
        })
        .to(ball, { duration: 0.01, autoAlpha: 1 })
        .to(path, {
          strokeDashoffset: 0,
          duration: 1,
          ease: "none"
        }, 0)
        .to(ball, {
          motionPath: {
            path: path,
            align: path,
            alignOrigin: [0.5, 0.5]
          },
          duration: 1,
          ease: "none"
        }, 0)
        .add(pulseTimeline, 0);
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-12 overflow-hidden">

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Five simple steps to complete digital asset protection and inheritance planning.
          </p>
        </div>

        {/* Process Timeline */}
        <div className="space-y-60 relative">
          {/* Animated Timeline SVG */}
          <div 
            ref={timelineRef}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-full h-full overflow-visible pointer-events-none"
          >
            <svg 
              ref={timelineSvgRef}
              className="w-full h-full"
              viewBox="0 0 600 1200"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                  <stop offset="20%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="80%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Animated Path - curves through the steps */}
              <path
                ref={timelinePathRef}
                className="theLine"
                d="M 300,0
                   Q 350 200 300 240 
                   Q 250 300 300 480 
                   Q 350 600 300 720
                   Q 250 840 300 960
                   Q 350 1080 300 1200"
                fill="none"
                stroke="url(#timelineGradient)"
                strokeWidth="4px"
                strokeLinecap="round"
              />
              
              {/* Ball that follows the path */}
              <circle
                ref={timelineBallRef}
                className="ball"
                r="10"
                cx="300"
                cy="0"
                fill="#fff"
                opacity="0"
                filter="url(#glow)"
              />
            </svg>
          </div>

          {/* Steps */}
          <div className="space-y-40">
            {steps.map((step, index) => (
              <div
                key={step.number}
                ref={(el) => {
                  if (el) stepsRef.current[index] = el;
                }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 0 ? "" : "lg:flex-row-reverse"
                }`}
              >
                {/* Step Content */}
                <div className={`flex-1 lg:max-w-2xl ${index % 2 === 0 ? "lg:pr-8" : "lg:pl-8"}`}>
                  <div className={index % 2 === 0 ? "text-left" : "text-right"}>
                    {/* Step Number */}
                    <div
                      data-step-number
                      className={`inline-flex items-center gap-4 mb-8 ${
                        index % 2 === 0 ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div 
                        data-step-icon
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0"
                      >
                        <step.icon className="w-10 h-10 text-purple-400" />
                      </div>
                      <span className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                        {step.number}
                      </span>
                    </div>

                    <h3 data-step-title className={`text-4xl md:text-5xl font-bold text-white mb-6 leading-tight ${index % 2 !== 0 ? "lg:ml-auto lg:max-w-2xl" : ""}`}>{step.title}</h3>
                    <p data-step-description className={`text-xl md:text-2xl text-slate-400 mb-8 leading-relaxed max-w-2xl ${index % 2 !== 0 ? "lg:ml-auto" : ""}`}>{step.description}</p>

                    {/* Details List */}
                    <ul data-step-details className={`space-y-4 ${index % 2 === 0 ? "" : "lg:ml-auto lg:max-w-xl"}`}>
                      {step.details.map((detail) => (
                        <li key={detail} className={`flex items-start gap-3 ${index % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
                          <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-lg md:text-xl text-slate-300 leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Center Circle for Timeline */}
                <div className="relative">
                  <div
                    ref={(el) => {
                      if (el) circlesRef.current[index] = el;
                    }}
                    className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                  />
                </div>

                {/* Dashboard Image - Enhanced and Larger */}
                <div className="flex-1 lg:max-w-4xl w-full">
                  <div
                    ref={(el) => {
                      if (el) imagesRef.current[index] = el;
                    }}
                    className="relative"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Enhanced Glow */}
                    <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-3xl blur-3xl opacity-60" />
                    
                    {/* Image Container with Enhanced Shadow */}
                    <div className="relative bg-slate-900/70 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-3 overflow-hidden shadow-2xl">
                      {/* Premium Browser Chrome */}
                      <div className="absolute top-3 left-3 right-3 h-10 bg-slate-900/90 backdrop-blur-sm flex items-center px-5 gap-3 rounded-t-2xl z-10 border-b border-slate-700/50">
                        <div className="flex gap-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                          <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
                        </div>
                        <div className="flex-1 bg-slate-800/70 rounded-lg mx-4 px-4 py-1.5 text-sm text-slate-400 font-mono">
                          https://guardiavault.com/dashboard
                        </div>
                      </div>
                      
                      {/* Larger Dashboard Screenshot */}
                      <div className="aspect-[16/9] overflow-hidden rounded-2xl mt-10">
                        <OptimizedImage 
                          src={step.image.replace('/', '').replace('.png', '')} 
                          alt={`${step.title} Dashboard Screenshot`}
                          width={1920}
                          height={1080}
                          className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${
                            step.number === "02" ? "scale-110 object-[center_-8%]" : 
                            step.number === "05" ? "scale-90 object-contain" : 
                            "object-top"
                          }`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1024px"
                          aspectRatio="16/9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

