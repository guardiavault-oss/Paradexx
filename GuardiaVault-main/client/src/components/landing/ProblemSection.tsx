import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { TrendingDown, Lock, ShieldOff, Users, Clock, Brain, Shield } from "lucide-react";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";
import { getPerformanceConfig } from "@/utils/performance";

registerPlugin(ScrollTrigger, "ScrollTrigger");

// Get performance config at module level
const perfConfig = getPerformanceConfig();

// --------------------------------------
// Data
// --------------------------------------
const problems = [
  {
    icon: ShieldOff,
    title: "7M+ Bitcoin Lost",
    description:
      "An estimated third of mined Bitcoin is currently inaccessible due to lost keys and destroyed wallets",
    statValue: 33,
    statUnit: "%",
    color: "#ef4444",
    trend: "+3.3% annually",
    impactScore: 95,
    dataPoints: [30, 31, 31.5, 32, 32.5, 33],
    severity: "critical",
  },
  {
    icon: Users,
    title: "No Inheritance Plan",
    description: "Most crypto holders don’t have a plan for heirs, putting assets at risk",
    statValue: 90,
    statUnit: "%",
    color: "#eab308",
    trend: "$6T at risk by 2045",
    impactScore: 88,
    dataPoints: [85, 86, 87, 88, 89, 90],
    severity: "high",
  },
  {
    icon: Lock,
    title: "Single Point of Failure",
    description: "Seed phrases and single-device storage are fragile: one mistake can be permanent",
    statValue: 4,
    statUnit: "M+",
    color: "#a855f7",
    trend: "200k new losses/year",
    impactScore: 92,
    dataPoints: [3.2, 3.4, 3.6, 3.8, 3.9, 4.0],
    severity: "critical",
  },
  {
    icon: Clock,
    title: "Time-Sensitive Recovery",
    description: "Breaches and compromises require fast action — windows can be small",
    statValue: 24,
    statUnit: "hrs",
    color: "#3b82f6",
    trend: "Average hack duration",
    impactScore: 85,
    dataPoints: [28, 26, 25, 24, 24, 24],
    severity: "high",
  },
];

const prefersReducedMotion = () => {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

// --------------------------------------
// Particle system: subtle, low-cost
// --------------------------------------
function ParticleSystem({ count = 28 }: { count?: number }) {
  // Reduce particle count on low-end devices
  const actualCount = perfConfig.reduceAnimations ? Math.min(count, 14) : count;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * ratio);
      canvas.height = Math.floor(canvas.offsetHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    setSize();
    window.addEventListener('resize', setSize, { passive: true });

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    particles.current = Array.from({ length: actualCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.45 + 0.15,
      color: ['#ef4444', '#f97316', '#eab308', '#a855f7'][Math.floor(Math.random() * 4)]
    }));

    let last = performance.now();

    const loop = (now = performance.now()) => {
      const dt = Math.min(32, now - last) / 16;
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', setSize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particles.current = [];
    };
  }, [count]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-30" style={{ height: '100%' }} aria-hidden />;
}

// --------------------------------------
// Small reusable chart: subtle animation
// --------------------------------------
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathId = useMemo(() => `path_${color.replace('#','')}_${Math.random().toString(36).substr(2, 9)}`, [color]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || prefersReducedMotion()) return;

    const poly = el.querySelector('polyline');
    const fillPath = el.querySelector(`.fill-path`);
    const circles = el.querySelectorAll('circle');
    if (!poly) return;

    // Animate line drawing
    gsap.fromTo(
      poly,
      { strokeDashoffset: 1000 },
      {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Animate fill area
    if (fillPath) {
      gsap.fromTo(
        fillPath,
        { opacity: 0, scaleY: 0, transformOrigin: 'bottom' },
        {
          opacity: 0.3,
          scaleY: 1,
          duration: 1.5,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Animate circles appearing
    circles.forEach((circle, index) => {
      gsap.fromTo(
        circle,
        {
          scale: 0,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          delay: 0.8 + (index * 0.1),
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Continuous pulse animation
      gsap.to(circle, {
        scale: 1.3,
        opacity: 0.6,
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          end: 'bottom 10%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Continuous subtle glow animation
    gsap.to(poly, {
      opacity: 0.8,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        end: 'bottom 10%',
        toggleActions: 'play none none none',
      },
    });
  }, [data, pathId]);

  const { points, pathData, circles } = useMemo(() => {
    const width = 200;
    const height = 40;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const pointCoords = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return { x, y };
    });

    const pointsStr = pointCoords.map(p => `${p.x},${p.y}`).join(' ');
    
    // Create path for fill area
    const fillPathStr = pointCoords.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x},${height} L ${p.x},${p.y}`;
      return `${acc} L ${p.x},${p.y}`;
    }, '') + ` L ${pointCoords[pointCoords.length - 1].x},${height} Z`;

    return {
      points: pointsStr,
      pathData: fillPathStr,
      circles: pointCoords,
    };
  }, [data]);

  return (
    <svg ref={svgRef} viewBox="0 0 200 40" className="w-full h-10 opacity-70" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`g_${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`fill_${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <filter id={`glow_${color.replace('#','')}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Fill area */}
      <path
        className="fill-path"
        d={pathData}
        fill={`url(#fill_${color.replace('#','')})`}
        opacity={0}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={`url(#g_${color.replace('#','')})`}
        strokeWidth={2.2}
        strokeDasharray={1000}
        strokeDashoffset={1000}
        strokeLinecap="round"
        filter={`url(#glow_${color.replace('#','')})`}
      />
      {/* Animated data points */}
      {circles.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={2.5}
          fill={color}
          opacity={0}
          filter={`url(#glow_${color.replace('#','')})`}
        />
      ))}
    </svg>
  );
}

// --------------------------------------
// Counters: calm and professional
// --------------------------------------
function NumberRoll({ value, unit = '', decimals = 0 }: { value: number; unit?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { v: 0 };
    const st = ScrollTrigger.create({ trigger: ref.current, start: 'top 90%', onEnter: () => {
      gsap.to(obj, { v: value, duration: 1.4, ease: 'power2.out', onUpdate: () => setDisplay(Number(obj.v.toFixed(decimals))) });
    }});

    return () => st.kill();
  }, [value, decimals]);

  return <span ref={ref}>{display.toLocaleString()}{unit}</span>;
}

function SimpleCounter({ endValue, prefix = '', suffix = '', isCurrency = false }: { endValue: number; prefix?: string; suffix?: string; isCurrency?: boolean }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { v: 0 };
    const st = ScrollTrigger.create({ trigger: ref.current, start: 'top 90%', onEnter: () => {
      gsap.to(obj, { v: endValue, duration: 1.6, ease: 'power2.out', onUpdate: () => setValue(Math.floor(obj.v)) });
    }});

    return () => st.kill();
  }, [endValue]);

  const fmt = isCurrency ? (() => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  })() : value.toLocaleString();

  return <span ref={ref} aria-live="polite">{prefix}{fmt}{suffix}</span>;
}

// --------------------------------------
// Subtle magnetic card
// --------------------------------------
function MagneticCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    gsap.to(el, { x: x * 8, y: y * 8, rotationY: x * 6, rotationX: -y * 6, duration: 0.35, ease: 'power2.out' });
  }, []);

  const onLeave = useCallback(() => { const el = ref.current; if (!el) return; gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }); }, []);

  return <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} role="button" tabIndex={0}>{children}</div>;
}

// --------------------------------------
// Impact gauge: simplified
// --------------------------------------
function ImpactGauge({ score, color }: { score: number; color: string }) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const c = 2 * Math.PI * 36;

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = c - (score / 100) * c;
    gsap.fromTo(circleRef.current, { strokeDashoffset: c }, { strokeDashoffset: offset, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: circleRef.current, start: 'top 90%' } });
  }, [score]);

  return (
    <div className="relative w-20 h-20" aria-hidden>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="8" />
        <circle ref={circleRef} cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-medium text-white">{score}</span></div>
    </div>
  );
}

// --------------------------------------
// Main component: calmer visuals, professional spacing
// --------------------------------------
export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const centerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        if (headerRef.current) {
          gsap.from(headerRef.current, { y: 24, opacity: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: headerRef.current, start: 'top 92%' } });
        }

        if (stickyRef.current) {
          const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
          
          if (cards.length === 0) {
            import("@/utils/logger").then(({ logWarn }) => {
              logWarn('No cards found for scroll effect', {
                context: "ProblemSection",
              });
            });
            return;
          }
          
          // Animate each card as it comes into view
          cards.forEach((card, index) => {
            if (!card) return;
            
            gsap.fromTo(
              card,
              {
                opacity: 0,
                y: 60,
                scale: 0.9,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: perfConfig.reduceAnimations ? 0.5 : 0.8,
                ease: "power3.out",
                delay: perfConfig.reduceAnimations ? index * 0.05 : index * 0.15,
                scrollTrigger: {
                  trigger: card,
                  start: "top 85%",
                  end: "top 60%",
                  toggleActions: "play none none none",
                },
              }
            );
          });
        }

        if (centerRef.current) gsap.from(centerRef.current, { scale: 0.96, opacity: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: centerRef.current, start: 'top 92%' } });
      }, sectionRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 overflow-hidden">

      <div className="relative z-10 container mx-auto px-6">
        <div ref={headerRef} className="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 text-white">The Silent Crisis in Crypto</h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-3xl mx-auto">Millions of digital assets vanish unnoticed, creating lasting consequences for families and heirs. This is the gap we're closing.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            { label: 'Market Cap', value: 3.8, unit: 'T', prefix: '$', trend: '+0.69%', color: '#ef4444' },
            { label: 'Lost Bitcoin', value: 7, unit: 'M+', trend: '+200K/yr', color: '#f97316' },
            { label: 'No Plan', value: 90, unit: '%', trend: 'Rising', color: '#eab308' },
            { label: 'Assets at Risk', value: 6, unit: 'T', prefix: '$', trend: 'By 2045', color: '#a855f7' }
          ].map(s => (
            <div key={s.label} className="stat-card group">
              <MagneticCard className="h-full">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-800/70 border border-slate-700/40 h-full">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900 flex items-center justify-center"><TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div className="text-xs sm:text-sm text-slate-300">{s.label}</div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400">{s.trend}</div>
                </div>
                <div className="text-base sm:text-lg md:text-xl font-semibold text-white flex items-baseline gap-2">{s.prefix}<NumberRoll value={s.value} unit={s.unit} /></div>
              </div>
              </MagneticCard>
            </div>
          ))}
        </div>

        <div ref={stickyRef} className="relative mb-12 sm:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-0">
            {problems.map((p, idx) => {
              const Icon = p.icon as any;
              return (
                <div key={p.title} ref={(el) => { if (el) cardsRef.current[idx] = el; }} className="group">
                  <div className={`rounded-xl p-4 sm:p-6 bg-slate-900/85 border ${p.severity === 'critical' ? 'border-red-700/40' : 'border-slate-700/30'}`}>
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" /></div>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-white">{p.title}</h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{p.description}</p>
                        </div>
                      </div>
                      <ImpactGauge score={p.impactScore} color={p.color} />
                    </div>

                    <div className="mb-3 sm:mb-4"><MiniChart data={p.dataPoints} color={p.color} /></div>

                    <div className="flex items-center justify-between mt-2 sm:mt-4 border-t border-slate-800/50 pt-3 sm:pt-4">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-white"><NumberRoll value={p.statValue} unit={p.statUnit} /></div>
                        <div className="text-[10px] sm:text-xs text-slate-400 mt-1">{p.trend}</div>
                      </div>
                      <button className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/40">Learn more</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div ref={centerRef} className="text-center mt-6">
          <div className="inline-block p-8 rounded-xl bg-slate-900/95 border border-slate-700/40">
            <div className="mb-4 text-sm text-slate-300">Total estimated loss</div>
            <div className="text-3xl md:text-4xl font-extrabold text-white"><SimpleCounter endValue={700} prefix="$" suffix="B" /></div>
            <p className="text-sm text-slate-400 mt-2">Worth of crypto currently inaccessible</p>
          </div>
        </div>
      </div>
    </section>
  );
}
