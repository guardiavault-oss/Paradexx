import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, registerPlugin } from '@/lib/gsap-optimized';

registerPlugin(ScrollTrigger, "ScrollTrigger");

// Helper function to adjust rgba color opacity
const adjustColorOpacity = (color: string, opacity: number): string => {
    // Handle rgba format: rgba(r, g, b, a)
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
    }
    // Fallback: return original color if format not recognized
    return color;
};

interface CardProps {
    id: number;
    title: string;
    description: string;
    index: number;
    totalCards: number;
    color: string;
    icon?: React.ReactNode;
    image?: string;
}

const Card: React.FC<CardProps> = ({ title, description, index, totalCards, color, icon, image }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        const container = containerRef.current;
        if (!card || !container) return;

        const targetScale = 1 - (totalCards - index) * 0.05;

        // Set initial state
        gsap.set(card, {
            scale: 1,
            transformOrigin: "top"
        });

        // Create scroll trigger for stacking effect
        ScrollTrigger.create({
            trigger: container,
            start: "top center",
            end: "bottom center",
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                const scale = gsap.utils.interpolate(1, targetScale, progress);

                gsap.set(card, {
                    scale: Math.max(scale, targetScale),
                    transformOrigin: "top"
                });
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [index, totalCards]);

    return (
        <div
            ref={containerRef}
            style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                zIndex: index + 1,
                overflow: 'visible'
            }}
        >
            <div
                ref={cardRef}
                style={{
                    position: 'relative',
                    width: '70%',
                    height: '450px',
                    borderRadius: '24px',
                    isolation: 'isolate',
                    top: `calc(-5vh + ${index * 25}px)`,
                    transformOrigin: 'top',
                    overflow: 'visible',
                    zIndex: 1
                }}
                className="card-content"
            >
                {/* Electric Border Effect */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-3px',
                        borderRadius: '27px',
                        padding: '3px',
                        background: `conic-gradient(
                            from 0deg,
                            transparent 0deg,
                            ${color} 60deg,
                            ${adjustColorOpacity(color, 0.6)} 120deg,
                            transparent 180deg,
                            ${adjustColorOpacity(color, 0.4)} 240deg,
                            transparent 360deg
                        )`,
                        zIndex: -1
                    }}
                />

                {/* Main Card Content */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: '24px',
                    background: `
                        linear-gradient(145deg, 
                            rgba(255, 255, 255, 0.1), 
                            rgba(255, 255, 255, 0.05)
                        )
                    `,
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.3),
                        0 2px 8px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    overflow: 'visible',
                    padding: '2rem'
                }}>
                    {/* Enhanced Glass reflection overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                        pointerEvents: 'none',
                        borderRadius: '24px 24px 0 0'
                    }} />

                    {/* Glass shine effect */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                        borderRadius: '1px',
                        pointerEvents: 'none'
                    }} />

                    {/* Side glass reflection */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '2px',
                        height: '100%',
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                        borderRadius: '24px 0 0 24px',
                        pointerEvents: 'none'
                    }} />

                    {/* Frosted glass texture */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `
                            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 2px),
                            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 2px),
                            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06) 1px, transparent 2px)
                        `,
                        backgroundSize: '30px 30px, 25px 25px, 35px 35px',
                        pointerEvents: 'none',
                        borderRadius: '24px',
                        opacity: 0.7
                    }} />

                    {/* Left Content */}
                    <div className="relative z-10 flex flex-col justify-center h-full flex-1 pr-8">
                        {icon && (
                            <div className="mb-6" style={{ color }}>
                                {icon}
                            </div>
                        )}
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {title}
                        </h3>
                        <p className="text-white/80 leading-relaxed max-w-lg">
                            {description}
                        </p>
                    </div>

                    {/* Right Image - Overlapping */}
                    {image && (
                        <div 
                            className="absolute"
                            style={{
                                right: '-150px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '700px',
                                height: '150%',
                                zIndex: 20,
                                pointerEvents: 'none'
                            }}
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={image}
                                    alt={title}
                                    className="w-full h-full object-contain"
                                    style={{
                                        filter: `drop-shadow(0 30px 60px ${color}60) drop-shadow(0 0 40px ${color}40) brightness(1.1)`,
                                    }}
                                />
                                {/* Image Glow Effect */}
                                <div
                                    className="absolute inset-0 blur-3xl opacity-50 -z-10"
                                    style={{
                                        background: `radial-gradient(circle, ${color}60, ${color}30, transparent 70%)`,
                                        boxShadow: `0 0 150px ${color}50`,
                                    }}
                                />
                                {/* Additional Glow Layers */}
                                <div
                                    className="absolute inset-0 blur-[100px] opacity-30 -z-10"
                                    style={{
                                        background: color,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface StackedCardsProps {
    cards: Array<{
        id: number;
        title: string;
        description: string;
        color: string;
        icon?: React.ReactNode;
        image?: string;
    }>;
}

export const StackedCards: React.FC<StackedCardsProps> = ({ cards }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        gsap.fromTo(container,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1.2,
                ease: "power2.out"
            }
        );
    }, []);

    return (
        <div ref={containerRef} className="w-full">
            {/* Cards Section */}
            <section style={{
                color: '#ffffff',
                width: '100%'
            }}>
                {cards.map((card, index) => {
                    return (
                        <Card
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            description={card.description}
                            index={index}
                            totalCards={cards.length}
                            color={card.color}
                            icon={card.icon}
                            image={card.image}
                        />
                    );
                })}
            </section>
        </div>
    );
};

