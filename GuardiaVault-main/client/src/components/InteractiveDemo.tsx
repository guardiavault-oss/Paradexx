import { useState, useRef, useEffect } from "react";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Step {
  title: string;
  description: string;
  icon?: React.ElementType;
}

const demoSteps: Step[] = [
  {
    title: "Connect Wallet",
    description: "Link your MetaMask or other Web3 wallet",
    icon: CheckCircle2,
  },
  {
    title: "Choose Plan",
    description: "Select a protection plan that fits your needs",
    icon: CheckCircle2,
  },
  {
    title: "Create Vault",
    description: "Set up your crypto vault in minutes",
    icon: CheckCircle2,
  },
  {
    title: "Add Guardians",
    description: "Invite trusted friends or family members",
    icon: CheckCircle2,
  },
  {
    title: "Designate Beneficiaries",
    description: "Specify who will inherit your assets",
    icon: CheckCircle2,
  },
  {
    title: "You're Protected!",
    description: "Your crypto legacy is now secure",
    icon: CheckCircle2,
  },
];

interface InteractiveDemoProps {
  inline?: boolean;
  hideTitle?: boolean;
}

export default function InteractiveDemo({ inline = false, hideTitle = false }: InteractiveDemoProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
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
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  useEffect(() => {
    if (isPlaying && cardsRef.current) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % demoSteps.length;
          
          // Animate card appearance
          const card = cardsRef.current?.children[next] as HTMLElement;
          if (card) {
            gsap.fromTo(
              card,
              { opacity: 0, scale: 0.8, y: 20 },
              { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }
            );
          }
          
          return next;
        });
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlay = () => {
    if (!isPlaying) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const content = (
      <div className={inline ? "" : "container mx-auto px-6 relative z-10"}>
        {!hideTitle && (
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-display mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Watch how easy it is to protect your crypto legacy
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={handlePlay}
              className="mb-8"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Demo
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Interactive Demo
                </>
              )}
            </Button>
          </div>
        )}
        {hideTitle && (
          <div className="text-center mb-8">
            <Button
              size="lg"
              variant="outline"
              onClick={handlePlay}
              className="mb-6"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Demo
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Interactive Demo
                </>
              )}
            </Button>
          </div>
        )}

        <div ref={cardsRef} className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoSteps.map((step, index) => {
              const Icon = step.icon || CheckCircle2;
              const isActive = index === currentStep && isPlaying;
              const isCompleted = index < currentStep;
              
              return (
                <Card
                  key={index}
                  className={`transition-all duration-500 ${
                    isActive
                      ? "border-primary scale-105 shadow-xl shadow-primary/20 bg-primary/5"
                      : isCompleted
                      ? "border-primary/50 opacity-75"
                      : "border-border opacity-50"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-primary-foreground scale-110"
                            : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={
                              isActive
                                ? "border-primary text-primary"
                                : isCompleted
                                ? "border-primary/50 text-primary"
                                : ""
                            }
                          >
                            Step {index + 1}
                          </Badge>
                        </div>
                        <h3
                          className={`font-semibold mb-1 ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Progress Bar */}
          {isPlaying && (
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-2000"
                  style={{
                    width: `${((currentStep + 1) / demoSteps.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {currentStep + 1} of {demoSteps.length} steps
              </p>
            </div>
          )}
        </div>
      </div>
  );

  if (inline) {
    return <div ref={sectionRef} className="relative">{content}</div>;
  }

  return (
    <section
      ref={sectionRef}
      className="py-24 pb-40 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden"
      id="demo"
    >
      {content}
    </section>
  );
}

