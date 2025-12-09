import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Shield,
  Zap,
  Brain,
  Lock,
  Radio,
  TrendingUp,
  Bell,
  FileText,
  Gauge,
  Database,
  Users,
  GitBranch,
  ArrowRight,
  Activity,
  Sparkles,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import logoImage from 'figma:asset/306e2061f29e3889bf71aa552b80f03f126168a8.png';
import analyticsImage from 'figma:asset/f7f527e121af9be4908825c4b9c4ddae8ce08452.png';
import liveMonitorImage from 'figma:asset/61423bdd3ddc9f2776b82cf92b56f76ad251027f.png';
import protectionImage from 'figma:asset/cbe0fe275a1e2adfc6a1794b517cd044cadd2786.png';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const teamSectionRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Team Section Animation
  useEffect(() => {
    const teamSection = teamSectionRef.current;
    if (!teamSection) return;

    const teamMembers = gsap.utils.toArray('.team-member');
    const teamMemberCards = gsap.utils.toArray('.team-member-card');

    let cardPlaceholderEntrance: ScrollTrigger | null = null;
    let cardSlideInAnimation: ScrollTrigger | null = null;

    function initTeamAnimations() {
      if (window.innerWidth < 1000) {
        if (cardPlaceholderEntrance) cardPlaceholderEntrance.kill();
        if (cardSlideInAnimation) cardSlideInAnimation.kill();

        teamMembers.forEach((member: any) => {
          gsap.set(member, { clearProps: 'all' });
          const teamMemberInitial = member.querySelector('.team-member-name-initial h1');
          gsap.set(teamMemberInitial, { clearProps: 'all' });
        });

        teamMemberCards.forEach((card: any) => {
          gsap.set(card, { clearProps: 'all' });
        });

        return;
      }

      if (cardPlaceholderEntrance) cardPlaceholderEntrance.kill();
      if (cardSlideInAnimation) cardSlideInAnimation.kill();

      cardPlaceholderEntrance = ScrollTrigger.create({
        trigger: teamSection,
        start: 'top bottom',
        end: 'top top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          teamMembers.forEach((member: any, index: number) => {
            const entranceDelay = 0.15;
            const entranceDuration = 0.7;
            const entranceStart = index * entranceDelay;
            const entranceEnd = entranceStart + entranceDuration;

            if (progress >= entranceStart && progress <= entranceEnd) {
              const memberEntranceProgress = (progress - entranceStart) / entranceDuration;

              const entranceY = 125 - memberEntranceProgress * 125;
              gsap.set(member, { y: `${entranceY}%` });

              const teamMemberInitial = member.querySelector('.team-member-name-initial h1');
              const initialLetterScaleDelay = 0.4;
              const initialLetterScaleProgress = Math.max(
                0,
                (memberEntranceProgress - initialLetterScaleDelay) / (1 - initialLetterScaleDelay)
              );
              gsap.set(teamMemberInitial, { scale: initialLetterScaleProgress });
            } else if (progress > entranceEnd) {
              gsap.set(member, { y: `0%` });
              const teamMemberInitial = member.querySelector('.team-member-name-initial h1');
              gsap.set(teamMemberInitial, { scale: 1 });
            }
          });
        },
      });

      cardSlideInAnimation = ScrollTrigger.create({
        trigger: teamSection,
        start: 'top top',
        end: `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          teamMemberCards.forEach((card: any, index: number) => {
            const slideInStagger = 0.075;
            const xRotationDuration = 0.4;
            const xRotationStart = index * slideInStagger;
            const xRotationEnd = xRotationStart + xRotationDuration;

            if (progress >= xRotationStart && progress <= xRotationEnd) {
              const cardProgress = (progress - xRotationStart) / xRotationDuration;

              const cardInitialX = 300 - index * 100;
              const cardTargetX = -50;
              const cardSlideInX = cardInitialX + cardProgress * (cardTargetX - cardInitialX);

              const cardSlideInRotation = 20 - cardProgress * 20;

              gsap.set(card, {
                x: `${cardSlideInX}%`,
                rotation: cardSlideInRotation,
              });
            } else if (progress > xRotationEnd) {
              gsap.set(card, {
                x: `-50%`,
                rotation: 0,
              });
            }

            const cardScaleStagger = 0.12;
            const cardScaleStart = 0.4 + index * cardScaleStagger;
            const cardScaleEnd = 1;

            if (progress >= cardScaleStart && progress <= cardScaleEnd) {
              const scaleProgress = (progress - cardScaleStart) / (cardScaleEnd - cardScaleStart);
              const scaleValue = 0.75 + scaleProgress * 0.25;

              gsap.set(card, {
                scale: scaleValue,
              });
            } else if (progress > cardScaleEnd) {
              gsap.set(card, {
                scale: 1,
              });
            }
          });
        },
      });
    }

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initTeamAnimations();
        ScrollTrigger.refresh();
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    initTeamAnimations();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cardPlaceholderEntrance) cardPlaceholderEntrance.kill();
      if (cardSlideInAnimation) cardSlideInAnimation.kill();
    };
  }, []);

  // Pricing Cards Horizontal Scroll Animation
  useEffect(() => {
    const pricingCards = document.querySelectorAll('.pricing-card-animated');
    if (!pricingCards || pricingCards.length === 0) return;

    const windowWidth = window.innerWidth;
    const numCards = pricingCards.length;

    // Card width and gap ratios - increased gap for more spacing
    const cardWidthRatio = 4;
    const cardGapRatio = 2;

    // Calculate dimensions
    const totalRatioUnits = numCards * cardWidthRatio + (numCards + 1) * cardGapRatio;
    const ratioUnit = windowWidth / totalRatioUnits;
    const cardWidth = cardWidthRatio * ratioUnit;
    const cardGap = cardGapRatio * ratioUnit;

    // Set initial positions (all off-screen to the left)
    gsap.set(pricingCards, {
      x: -windowWidth - 100,
      opacity: 0,
      scale: 0.8,
    });

    // Create timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pricing-cards-section',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: '.pricing-sticky-container',
        anticipatePin: 1,
      },
    });

    // Stage 1: Cards enter one by one from left
    for (let i = 0; i < numCards; i++) {
      const xPos = cardGap + i * (cardWidth + cardGap);

      tl.to(
        pricingCards[i],
        {
          x: xPos,
          opacity: 1,
          scale: 1,
          duration: 0.15,
          ease: 'power2.out',
        },
        i * 0.1
      );
    }

    // Add a pause
    tl.to({}, { duration: 0.3 });

    // Stage 2: Cards exit together (stacking effect)
    tl.to(pricingCards, {
      x: (i) => windowWidth + i * 50,
      y: (i) => i * -20,
      rotate: (i) => i * 3,
      scale: 0.9,
      opacity: (i) => 1 - i * 0.15,
      stagger: 0.03,
      duration: 0.3,
      ease: 'power3.in',
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === '.pricing-cards-section') {
          trigger.kill();
        }
      });
    };
  }, []);

  // Progress Bar Animation
  useEffect(() => {
    gsap.to('.progress-bar', {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    });
  }, []);

  // Three.js Background Effect (without mouse tracking)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    // Create particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation loop (removed mouse parallax)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate particle system
      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.03;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from('.hero-badge', {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Hero title now uses CSS text-main-reveal animation, so removed from here

      gsap.from('.hero-description', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.4,
        ease: 'power3.out',
      });

      gsap.from('.hero-cta', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.6,
        ease: 'power3.out',
      });

      gsap.from('.hero-stats', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // Features card stack animation
      const featureCards = gsap.utils.toArray('.feature-card');
      const numFeatureCards = featureCards.length;
      const featureCardWidth = 400;
      const featureCardHeight = 280;

      ScrollTrigger.matchMedia({
        '(max-width: 767px)': function () {
          // Mobile: stacked cards
          const viewportHeight = window.innerHeight;
          const cardRevealGap = 80;
          const firstCardPinY = viewportHeight * 0.05 + 20;

          gsap.set(featureCards, {
            top: '0',
            left: '50%',
            xPercent: -50,
            yPercent: 0,
            x: 0,
            y: viewportHeight,
            scale: 1,
            rotationZ: 0,
            opacity: 0,
            visibility: 'hidden',
            zIndex: (i: number) => i + 1,
          });

          const tlMobile = gsap.timeline({
            scrollTrigger: {
              trigger: '.feature-card-stack-container',
              pin: true,
              scrub: 1.0,
              start: 'top top',
              end: `+=${numFeatureCards * 400 + 1000}`,
              invalidateOnRefresh: true,
            },
          });

          tlMobile.addLabel('mobileIntroStart');

          featureCards.forEach((card: any, index: number) => {
            const yFinal = firstCardPinY + index * cardRevealGap;
            const cardIntroTime = `mobileIntroStart+=${index * 0.5}`;
            tlMobile.fromTo(
              card,
              { y: viewportHeight + 50, opacity: 0, visibility: 'hidden' },
              { y: yFinal, opacity: 1, visibility: 'visible', duration: 0.6, ease: 'power2.out' },
              cardIntroTime
            );
          });

          tlMobile.addLabel('mobileIntroEnd', '>');
          tlMobile.addLabel('mobileOutroStart', '>+0.5');
          tlMobile.to({}, { duration: 0.1 }, 'mobileOutroStart');

          return () => tlMobile.kill();
        },
        '(min-width: 768px)': function () {
          // Desktop: expanding grid (3 columns)
          const gridConfig = {
            cols: 3,
            gapX: 40,
            gapY: 40,
            cardWidth: featureCardWidth,
            cardHeight: featureCardHeight,
          };

          gsap.set(featureCards, {
            top: '50%',
            left: '50%',
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
            visibility: 'hidden',
            rotationZ: 0,
            zIndex: 'auto',
          });

          const tlDesktop = gsap.timeline({
            scrollTrigger: {
              trigger: '.feature-card-stack-container',
              pin: true,
              scrub: 1.1,
              start: 'top top',
              end: '+=4000',
              invalidateOnRefresh: true,
            },
          });

          // Build expanding grid timeline
          const { cols, gapX, gapY, cardWidth, cardHeight } = gridConfig;
          tlDesktop.addLabel('introStart');

          featureCards.forEach((card: any, index: number) => {
            const totalRows = Math.ceil(numFeatureCards / cols);
            const col = index % cols;
            const row = Math.floor(index / cols);
            const gridWidth = cols * cardWidth + (cols - 1) * gapX;
            const gridHeight = totalRows * cardHeight + (totalRows - 1) * gapY;
            const gridOriginX = -gridWidth / 2;
            const gridOriginY = -gridHeight / 2;
            const cardCenterXInGrid = gridOriginX + col * (cardWidth + gapX) + cardWidth / 2;
            const cardCenterYInGrid = gridOriginY + row * (cardHeight + gapY) + cardHeight / 2;
            const targetX = cardCenterXInGrid;
            const targetY = cardCenterYInGrid;
            const cardStartTime = `introStart+=${index * 0.2}`;

            tlDesktop.to(
              card,
              {
                x: targetX,
                y: targetY,
                scale: 1,
                opacity: 1,
                visibility: 'visible',
                duration: 0.8,
                ease: 'expo.out',
              },
              cardStartTime
            );
          });

          tlDesktop.addLabel('introEnd', '>');
          tlDesktop.addLabel('outroStart', '>+1.5');
          tlDesktop.to(
            featureCards,
            {
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: 'power2.in',
              onComplete: () => {
                gsap.set(featureCards, { visibility: 'hidden' });
              },
            },
            'outroStart'
          );
          tlDesktop.addLabel('outroEnd', '>');

          return () => tlDesktop.kill();
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Sandwich Attack Protection',
      description: 'Real-time detection and prevention of sandwich attacks that exploit transaction ordering.',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Zap,
      title: 'Flash Loan Detection',
      description: 'Identify and mitigate flash loan attacks before they can manipulate your transactions.',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
    },
    {
      icon: Brain,
      title: 'Quantum-Aware Models',
      description: 'Advanced threat detection using quantum-resistant algorithms for future-proof security.',
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-400',
    },
    {
      icon: Lock,
      title: 'Private Mempool Routing',
      description: 'Route through Flashbots, MEV-Share, and Eden Network for complete transaction privacy.',
      gradient: 'from-orange-500/10 to-red-500/10',
      iconColor: 'text-orange-400',
    },
    {
      icon: Radio,
      title: 'Cross-Chain Correlation',
      description: 'Track and correlate MEV threats across multiple chains for comprehensive protection.',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-400',
    },
    {
      icon: TrendingUp,
      title: 'Historical MEV Trends',
      description: 'Analyze historical patterns to predict and prevent future MEV attacks.',
      gradient: 'from-indigo-500/10 to-purple-500/10',
      iconColor: 'text-indigo-400',
    },
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      description: 'Instant notifications via email, Slack, and webhooks for critical threat events.',
      gradient: 'from-yellow-500/10 to-orange-500/10',
      iconColor: 'text-yellow-400',
    },
    {
      icon: FileText,
      title: 'Compliance Reporting',
      description: 'Enterprise-grade compliance reports with detailed audit trails and risk assessments.',
      gradient: 'from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Gauge,
      title: 'Advanced Risk Scoring',
      description: 'Multi-factor risk analysis with customizable thresholds and automated responses.',
      gradient: 'from-red-500/10 to-pink-500/10',
      iconColor: 'text-red-400',
    },
    {
      icon: Database,
      title: 'Extended Data Retention',
      description: 'Up to 30-day historical data retention for forensic analysis and investigations.',
      gradient: 'from-teal-500/10 to-emerald-500/10',
      iconColor: 'text-teal-400',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description: 'Granular permissions management for teams with multi-user collaboration.',
      gradient: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-400',
    },
    {
      icon: GitBranch,
      title: 'Custom Integrations',
      description: 'Tailored builder and relay integrations with dedicated support for your workflow.',
      gradient: 'from-pink-500/10 to-rose-500/10',
      iconColor: 'text-pink-400',
    },
  ];

  const stats = [
    { value: '10', label: 'Networks Supported', prefix: '', suffix: '+' },
    { value: '6', label: 'Attack Types Detected', prefix: '', suffix: '' },
    { value: '3', label: 'Private Relay Integrations', prefix: '', suffix: '' },
    { value: '40', label: 'API Endpoints', prefix: '', suffix: '+' },
  ];

  const pricingTiers = [
    {
      name: 'Observability',
      price: 249,
      description: 'Monitor and analyze MEV threats',
      features: [
        'Basic multi-chain dashboards',
        'Historical MEV trends analysis',
        'Daily threat summaries',
        'Configurable email/Slack alerts',
        'Limited report exports',
        'Community support',
        'Standard data retention (7 days)',
      ],
      cta: 'Start Observability',
      popular: false,
    },
    {
      name: 'Active Defense',
      price: 699,
      description: 'Real-time protection and automation',
      features: [
        'Everything in Observability plus:',
        'Real-time sandwich/flash-loan detection',
        'Automated mitigation playbooks',
        'Private mempool routing',
        'Cross-chain correlation views',
        'Role-based access control',
        'REST & WebSocket API access',
        'Priority support',
      ],
      cta: 'Start Active Defense',
      popular: true,
    },
    {
      name: 'Quantum Shield',
      price: 1499,
      description: 'Enterprise-grade security',
      features: [
        'Includes Active Defense plus:',
        'Quantum-aware attack models (Shor/Grover/hybrid)',
        'Custom profit estimation engine',
        'Enterprise compliance reporting',
        'Advanced risk scoring',
        '30-day data retention',
        'Dedicated support manager',
        'SLA guarantee',
      ],
      cta: 'Start Quantum Shield',
      popular: false,
    },
    {
      name: 'Strategic Alliance',
      price: null,
      customPrice: '$3k–6k',
      description: 'Fully customized solution',
      features: [
        'Full Quantum Shield plus:',
        'Tailored builder/relay integrations',
        'On-prem or VPC deployment',
        'Bespoke reputation models',
        'Dedicated threat intelligence feeds',
        '24/7 on-call SLA',
        'Quarterly strategy reviews',
        'White-label options',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Text Reveal Animation Styles */}
      <style>{`
        @keyframes text-main-reveal {
          0%, 10% {
            opacity: 0;
            transform: scale(1.5);
            background-size: 0% 100%;
          }
          20% {
            opacity: 1;
            background-size: 0% 100%;
          }
          40% {
            transform: scale(1);
          }
          100% {
            background-size: 100% 100%;
            opacity: 1;
          }
        }

        .text-main-reveal {
          background: linear-gradient(to right, #0a0a0a, #0a0a0a) left no-repeat, 
                      linear-gradient(to right, #10b981, #14b8a6);
          background-size: 0% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-main-reveal 1.8s ease-in-out forwards;
          display: inline-block;
        }

        .text-main-reveal-line2 {
          background: linear-gradient(to right, #0a0a0a, #0a0a0a) left no-repeat,
                      linear-gradient(to right, #10b981, #14b8a6);
          background-size: 0% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-main-reveal 1.8s ease-in-out 0.3s forwards;
          display: inline-block;
        }
      `}</style>

      {/* Progress Bar */}
      <div className="progress-bar fixed top-0 left-0 h-1 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 z-[100]" />

      {/* Three.js Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-2000" />
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#2a2a2a]/50 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img src={logoImage} alt="MEVGUARD" className="h-16" />
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </a>
                <a href="#docs" className="text-gray-400 hover:text-white transition-colors">
                  Docs
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={onGetStarted}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-transform"
                >
                  Launch App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="hero-badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 hover:scale-110 transition-transform cursor-default">
              <Sparkles className="w-3 h-3 mr-1" />
              Advanced MEV Protection
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-main-reveal block">Protect Your Transactions</span>
              <span className="text-main-reveal-line2 block">From MEV Attacks</span>
            </h1>

            <p className="hero-description text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              MEVGUARD provides comprehensive protection against sandwich attacks, front-running,
              and all MEV threats across 10+ blockchain networks with real-time detection and
              private relay routing.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#2a2a2a] bg-[#1a1a1a]/50 backdrop-blur text-white hover:bg-[#2a2a2a] text-lg px-8 py-6 hover:scale-105 transition-all"
              >
                <Activity className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="hero-stats group cursor-default"
                >
                  <div className="bg-[#1a1a1a]/50 backdrop-blur border border-[#2a2a2a] rounded-xl p-6 hover:border-emerald-500/50 transition-all hover:scale-105">
                    <div className="text-3xl font-bold text-white mb-2 font-mono group-hover:text-emerald-400 transition-colors">
                      {stat.prefix}{stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </section>

        {/* Scroll Spacer Before Features */}
        <div className="scroll-spacer h-screen flex justify-center items-center text-2xl text-gray-600 text-center">
          Scroll down to see our features
        </div>

        {/* Features Section - Card Stack Animation */}
        <section ref={featuresRef} id="features" className="feature-card-stack-container relative" style={{ height: '700vh' }}>
          <div className="feature-card-stack sticky top-0 h-screen w-full flex justify-center items-center bg-[#0a0a0a]">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx} 
                  className="feature-card absolute left-1/2 top-1/2 w-[400px] h-[280px] max-w-[90vw] rounded-xl p-6 shadow-2xl opacity-0 invisible"
                  style={{
                    zIndex: idx + 1,
                    transform: 'translateZ(0)',
                  }}
                >
                  <div className={`w-full h-full rounded-xl p-6 bg-gradient-to-br ${feature.gradient} border-2 border-[#2a2a2a] flex flex-col justify-between`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-xs uppercase tracking-wider opacity-70 font-semibold">
                        Protection Feature
                      </div>
                      <div className="text-xs uppercase tracking-wider opacity-60">
                        #{String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                      <div className={`w-16 h-16 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4`}>
                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                        {feature.title}
                      </h3>
                    </div>
                    
                    <div className="text-xs leading-relaxed opacity-80 text-white/90">
                      {feature.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Scroll Spacer After Features */}
        <div className="scroll-spacer h-screen flex justify-center items-center text-2xl text-gray-600 text-center">
          That's all our protection features!
        </div>

        {/* Team Section with Animated Cards */}
        <section ref={teamSectionRef} className="team-section relative h-screen overflow-hidden px-4">
          <div className="flex gap-4 h-full">
            {/* Dashboard Page 1 - Analytics */}
            <div className="team-member flex-1 relative border-2 border-dashed border-[#2a2a2a] rounded-3xl will-change-transform">
              <div className="team-member-name-initial absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-[20rem] font-bold text-emerald-500/30 leading-none will-change-transform">
                  A
                </h1>
              </div>
              <div className="team-member-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-8 flex flex-col items-center gap-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl will-change-transform">
                <div className="rounded-2xl overflow-hidden w-[90%] shadow-2xl border border-emerald-500/30">
                  <img 
                    src={analyticsImage}
                    alt="Analytics Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-emerald-400 uppercase tracking-wider font-mono">( MEV Analytics )</p>
                  <h1 className="text-5xl font-bold text-white leading-tight">
                    Advanced <span className="text-emerald-400">Analytics</span>
                  </h1>
                  <p className="text-gray-400 text-sm max-w-md">
                    Comprehensive MEV metrics with attack type distribution, network-specific savings, and weekly performance trends
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Page 2 - Live Monitor */}
            <div className="team-member flex-1 relative border-2 border-dashed border-[#2a2a2a] rounded-3xl will-change-transform">
              <div className="team-member-name-initial absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-[20rem] font-bold text-blue-500/30 leading-none will-change-transform">
                  L
                </h1>
              </div>
              <div className="team-member-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-8 flex flex-col items-center gap-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/20 rounded-3xl will-change-transform">
                <div className="rounded-2xl overflow-hidden w-[90%] shadow-2xl border border-blue-500/30">
                  <img 
                    src={liveMonitorImage}
                    alt="Live Monitor Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-blue-400 uppercase tracking-wider font-mono">( Real-Time Detection )</p>
                  <h1 className="text-5xl font-bold text-white leading-tight">
                    Live <span className="text-blue-400">Monitor</span>
                  </h1>
                  <p className="text-gray-400 text-sm max-w-md">
                    Real-time threat detection with live event feeds tracking protection events, relay activations, and MEV activities
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Page 3 - Protection & Rules */}
            <div className="team-member flex-1 relative border-2 border-dashed border-[#2a2a2a] rounded-3xl will-change-transform">
              <div className="team-member-name-initial absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-[20rem] font-bold text-purple-500/30 leading-none will-change-transform">
                  P
                </h1>
              </div>
              <div className="team-member-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-8 flex flex-col items-center gap-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-3xl will-change-transform">
                <div className="rounded-2xl overflow-hidden w-[90%] shadow-2xl border border-purple-500/30">
                  <img 
                    src={protectionImage}
                    alt="Protection Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-purple-400 uppercase tracking-wider font-mono">( Protection System )</p>
                  <h1 className="text-5xl font-bold text-white leading-tight">
                    Smart <span className="text-purple-400">Protection</span>
                  </h1>
                  <p className="text-gray-400 text-sm max-w-md">
                    Configure protection rules, monitor MEV trends across networks, and analyze threat levels with detailed metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Horizontal Scroll Animation */}
        <section className="pricing-cards-section relative" style={{ height: '500vh' }}>
          <div className="pricing-sticky-container h-screen w-full sticky top-0 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              {pricingTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="pricing-card-animated absolute top-1/2 -translate-y-1/2 h-[500px] rounded-3xl overflow-hidden shadow-2xl"
                  style={{ transformOrigin: 'center' }}
                >
                  <Card
                    className={`p-8 h-full flex flex-col ${
                      tier.popular
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
                        : 'bg-[#1a1a1a] border-[#2a2a2a]'
                    }`}
                  >
                    <div className="mb-4">
                      {tier.popular && (
                        <Badge className="bg-emerald-500 text-white border-0 mb-2 uppercase text-xs tracking-wider">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-3">{tier.name}</h3>
                      <p className="text-gray-400 text-sm mb-6 opacity-85">{tier.description}</p>
                      
                      <div className="mb-6">
                        {tier.price !== null ? (
                          <>
                            <span className="text-5xl font-bold text-white font-mono block mb-1">
                              ${tier.price}
                            </span>
                            <span className="text-gray-500 text-sm">/mo</span>
                          </>
                        ) : (
                          <span className="text-4xl font-bold text-white font-mono block">
                            {tier.customPrice}
                          </span>
                        )}
                      </div>
                      
                      <ul className="space-y-2.5 mb-6">
                        {tier.features.slice(0, 6).map((feature, featureIdx) => (
                          <li key={featureIdx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-400 text-sm leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-auto">
                      <Button
                        onClick={onGetStarted}
                        className={
                          tier.popular
                            ? 'w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                            : 'w-full bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                        }
                      >
                        {tier.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    
                    <div className="mt-6 text-right">
                      <span className="text-[4rem] font-bold text-white/10 leading-none">
                        0{idx + 1}
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 md:p-16 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border-emerald-500/30 text-center parallax-fast">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Protect Your Transactions?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of traders already protecting their assets with MEVGUARD
              </p>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-12 py-6 hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#2a2a2a] py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="text-white font-bold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Guides</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">License</a></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="MEVGUARD" className="h-8" />
                <span className="text-gray-500">© 2024 MEVGUARD. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}