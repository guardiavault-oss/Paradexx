import { useRef, useEffect } from "react";
import { Video, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

const messageTypes = [
  {
    icon: Video,
    title: "Video Messages",
    description: "Record videos for your loved ones. They'll receive them along with your assets when the time comes.",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Mail,
    title: "Personal Letters",
    description: "Write letters, notes, or messages. Everything is encrypted and securely stored until delivery.",
    color: "from-purple-500/20 to-violet-500/20",
  },
];

export default function LegacyMessagesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Title animation
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    // Subtitle animation
    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    // Cards staggered animation
    if (cardsRef.current) {
      const cards = Array.from(cardsRef.current.children) as HTMLElement[];
      
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
            scale: 0.9,
            rotateY: index % 2 === 0 ? -15 : 15,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateY: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Hover-like scroll effect
        ScrollTrigger.create({
          trigger: card,
          start: "top 80%",
          end: "top 20%",
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const scale = 1 + (progress * 0.05);
            const glow = progress * 0.3;
            
            gsap.set(card, {
              scale: scale,
              boxShadow: `0 20px 60px rgba(251, 113, 133, ${0.1 + glow})`,
            });
          },
        });
      });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden"
    >
      {/* Soft background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div ref={titleRef}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display mb-4 sm:mb-6 tracking-tight text-white">
                Leave Messages for Your Loved Ones
              </h2>
            </div>
            
            <p ref={subtitleRef} className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
              Record videos or write letters that will be delivered to your family along with your assets. 
              Everything is encrypted and securely stored until the appropriate time.
            </p>
          </div>

          {/* Message types */}
          <div ref={cardsRef} className="grid md:grid-cols-2 gap-6 mb-12">
            {messageTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card
                  key={index}
                  className={`border-primary/20 bg-gradient-to-br ${type.color} backdrop-blur-sm hover:border-primary/40 transition-all duration-300 relative overflow-hidden group`}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-500" />
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-3">{type.title}</h3>
                        <p className="text-white/80 leading-relaxed">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 border border-primary/20">
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
              How It Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Create Your Messages</h4>
                <p className="text-white/70 text-sm">
                  Record videos or write letters. Upload them to your vault and assign them to specific beneficiaries.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Encrypted Storage</h4>
                <p className="text-white/70 text-sm">
                  All messages are encrypted with the same security as your assets. Only authorized recipients can access them.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Automatic Delivery</h4>
                <p className="text-white/70 text-sm">
                  When your vault is unlocked, beneficiaries receive their assets and any messages you've left for them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

