import { useRef, useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFadeInUp } from "@/hooks/useGsapScroll";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image?: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Crypto Investor",
    company: "Independent",
    text: "GuardiaVault's Real Death Verification gave me peace of mind. I travel frequently and was worried about false triggers. Now I know my assets are protected with official verification.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Tech Executive",
    company: "Fortune 500",
    text: "The zero-knowledge architecture is impressive. I control my keys completely, and the fraud protection features give me confidence my family will inherit correctly.",
    rating: 5,
  },
  {
    name: "Emily Johnson",
    role: "Crypto Portfolio Manager",
    company: "Wealth Management",
    text: "Finally, a solution that prevents false triggers. The multi-source verification means I won't lose my assets due to a missed check-in. Brilliant innovation.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Blockchain Developer",
    company: "Web3 Startup",
    text: "As a developer, I appreciate the smart contract architecture. Audited, secure, and non-custodial—exactly what crypto inheritance needs. The Real Death Verification™ is a game-changer.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Financial Advisor",
    company: "Independent Practice",
    text: "I recommend GuardiaVault to all my crypto-holding clients. The fraud protection prevents the nightmare scenario of premature asset distribution. Professional and secure.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Entrepreneur",
    company: "Serial Founder",
    text: "The peace of mind is worth every penny. Knowing my crypto legacy is protected with official verification, not just missed check-ins, is revolutionary for the industry.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useFadeInUp();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      gsap.to(carouselRef.current, {
        x: `-${currentTestimonial * 100}%`,
        duration: 0.8,
        ease: "power3.out",
      });
    }
  }, [currentTestimonial]);

  useEffect(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".testimonial-card");
      
      gsap.fromTo(
        Array.from(cards),
        {
          opacity: 0,
          y: 50,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
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

  return (
    <section
      ref={sectionRef}
      className="py-24 pb-40 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden"
      id="testimonials"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-5xl font-bold font-display mb-4">
            Trusted by Crypto Holders Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our users say about GuardiaVault's fraud protection and security
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-8 mb-12">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <Card
              key={index}
              className="testimonial-card border-border/50 bg-card/80 backdrop-blur-sm hover-elevate transition-all duration-300 hover:border-primary/50"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile/Tablet Carousel */}
        <div className="lg:hidden relative overflow-hidden">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-800 ease-out"
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="min-w-full px-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-primary/20 mb-4" />
                    <p className="text-muted-foreground mb-6 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={testimonial.image} alt={testimonial.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}, {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentTestimonial === index
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted hover:bg-primary/50"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

