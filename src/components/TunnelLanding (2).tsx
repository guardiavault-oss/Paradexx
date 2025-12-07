import { useEffect, useRef, useState } from "react";
import * as THREE from "../utils/three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { degenSlides } from "../data/degenSlides";
import { regenSlides } from "../data/regenSlides";
import { Menu, X, ArrowLeft } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Import Rajdhani font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
if (!document.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 iResolution;
  uniform float iTime;
  uniform float scrollSpeed;
  uniform sampler2D iChannel0;
  uniform float qualityScale;
  uniform float uDegenMode;

  //quick and dirty code for prototyping

  #define MAXSTEPS 256.0
  #define MAXDIST 30.0
  #define PI 3.1415926535898
  #define TWOPI 6.28318530718
  #define FUZZ 0.7
  #define PHASELENGTH 30.0
  #define PHASE mod((iTime + scrollSpeed)/PHASELENGTH,1.0)
  #define CUBENUM 50.0
  #define DISTANCEPERPHASE 150.0
  #define EPSILON 0.005

  vec3 glow = vec3(0);
  vec3 lastglow = vec3(0);
  vec3 cubeColor = vec3(0);
  float ringOffset = +0.6;

  mat4 rotationX( in float angle ) {
      return mat4(	1.0,		0,			0,			0,
                      0, 	cos(angle),	-sin(angle),		0,
                      0, 	sin(angle),	 cos(angle),		0,
                      0, 			0,			  0, 		1);
  }

  mat4 rotationY( in float angle ) {
      return mat4(	cos(angle),		0,		sin(angle),	0,
                              0,		1.0,			 0,	0,
              -sin(angle),	0,		cos(angle),	0,
                          0, 		0,				0,	1);
  }

  mat4 rotationZ( in float angle ) {
      return mat4(	cos(angle),		-sin(angle),	0,	0,
                      sin(angle),		cos(angle),		0,	0,
                          0,				0,		1,	0,
                          0,				0,		0,	1);
  }

  vec3 displacement(float p) {
      p *= 8.0*TWOPI/DISTANCEPERPHASE;
      return vec3(sin(p),cos(p*0.5+PI+PHASE*TWOPI*3.0)*0.37,0)*1.7;
  }

  //sdf functions taken from iq
  float opSmoothUnion( float d1, float d2, float k ) {
      float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
      return mix( d2, d1, h ) - k*h*(1.0-h); 
  }

  float sdBox( vec3 p, vec3 b )
  {    
      float interval = DISTANCEPERPHASE/CUBENUM;
      vec3 offset = displacement(round(p.z / interval +0.5)*interval - ringOffset);
      p -= offset;
      
      float num = mod(floor(p.z/interval)+1.0,DISTANCEPERPHASE/interval)*4.0;
      cubeColor = normalize(texture(iChannel0, vec2((num+0.5)/256.0,0.2/256.0)).xyz);
      p.z = mod(p.z,interval) - interval*0.5;
      p = mat3(rotationX(PHASE*TWOPI*5.0) * rotationZ(PHASE*TWOPI*18.0))*p;
      
      vec3 d = abs(p) - b;
      float res = length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);

      lastglow = pow(max(0.0,(1.0-(res/2.0))),4.0) * cubeColor * 0.1;
      glow += lastglow;
      
      return res;
  }

  float sdTube(vec3 p, float r)
  {
      p.y += 0.8;
      p -= displacement(p.z);
      return length(p.xy)-r;
  }

  float sdTube2(vec3 p, float r)
  {
      p -= displacement(p.z+1.5 - ringOffset);
      return min(length(p.xy - vec2(0,0.9)),min(length(p.xy + vec2(0.9,0)),length(p.xy- vec2(0.9,0))))-r;
  }

  float sdTorus( vec3 p, float r1, float r2 )
  {
      float interval = DISTANCEPERPHASE/CUBENUM;
      vec3 offset = displacement(round(p.z / interval+0.5)*interval - ringOffset);
      p -= offset;
      p.z = mod(p.z,interval) - interval*0.5;
      return length( vec2(length(p.xy)-r1,p.z) )-r2;
  }

  float map(vec3 pos)
  {
      vec3 p=pos;
      float d0 = sdTube(pos, 0.501);
      float d1 = sdTorus(pos, 0.9, 0.05);
      float d2 = sdTube2(pos,0.05);
      d0 = opSmoothUnion(d0,d1,0.5);
      d0 = opSmoothUnion(d0,d2,0.1);
      d1 = sdBox(pos, vec3(0.05));
      return min(d0,d1);
  }

  void intersect(vec3 ro, vec3 rd)
  {
      float res;
      float d = 0.01;
      float maxSteps = MAXSTEPS * qualityScale;
      for(float i = 0.0; i < MAXSTEPS; i++)
      {
          if(i >= maxSteps) break;
          vec3 p = ro + rd * d;
          res = map(p);
          if(res < EPSILON * d || res > MAXDIST) {
              break;
          }
          d += res*FUZZ;
      }
      glow += lastglow*6.0;
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord.xy - iResolution.xy * 0.5)/ iResolution.xy;
      uv.x *= iResolution.x / iResolution.y;
      
      // Shift tunnel up and to the right
      uv.x -= 0.15;  // Move right
      uv.y += 0.15;  // Move up to middle-upper area

      float fov = 0.25 * PI;
      vec3 origin = vec3(0,0, PHASE*DISTANCEPERPHASE);
      vec3 target = origin -vec3(0.0, 0.001, -0.05);
      
      target += displacement(target.z*1.0);
      origin += displacement(origin.z*1.0);

      vec3 forward = normalize(target - origin);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));   
      vec3 up = cross(right, forward);
      vec3 dir = normalize(uv.x * right + uv.y * up + fov * forward);
      
      intersect(origin, dir);
      
      // Apply color theme based on mode
      vec3 finalColor = glow;
      if(uDegenMode > 0.5) {
          // Red/orange theme for Degen - warm, fiery colors
          finalColor = vec3(
              glow.r * 1.5 + glow.g * 0.3,
              glow.g * 0.5 + glow.r * 0.2,
              glow.b * 0.3
          );
      } else {
          // Blue/cyan theme for Regen - cool, ice colors
          finalColor = vec3(
              glow.r * 0.3 + glow.b * 0.2,
              glow.g * 0.7 + glow.b * 0.3,
              glow.b * 1.5 + glow.r * 0.2
          );
      }
      
      fragColor = vec4(finalColor, 1.0);
  }

  void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

interface TunnelLandingProps {
  type: "degen" | "regen";
  onBack: () => void;
  onComplete?: () => void;
}

export default function TunnelLanding({ type, onBack, onComplete }: TunnelLandingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const slides = type === "degen" ? degenSlides : regenSlides;

  useEffect(() => {
    if (!canvasRef.current || !sliderRef.current) return;

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const qualityScale = isMobile ? 0.5 : 1.0;

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: !isMobile });
    const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create procedural noise texture for iChannel0
    const createNoiseTexture = () => {
      const size = 256;
      const data = new Uint8Array(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        const stride = i * 4;
        const noise = Math.random() * 255;
        data[stride] = noise;
        data[stride + 1] = noise;
        data[stride + 2] = noise;
        data[stride + 3] = 255;
      }
      const texture = new THREE.DataTexture(data, size, size);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
      return texture;
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      iChannel0: { value: createNoiseTexture() },
      scrollSpeed: { value: 0 },
      qualityScale: { value: qualityScale },
      uDegenMode: { value: type === "degen" ? 1.0 : 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let lastTime = 0;
    let animationId: number;

    function animateTunnel(time: number) {
      const deltaTime = time - lastTime;
      lastTime = time;
      uniforms.iTime.value += deltaTime * 0.0002;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animateTunnel);
    }

    animateTunnel(0);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Setup slides
    const totalSlides = slides.length;
    const zStep = 2500;
    const initialZ = -22500;

    const slideElements = sliderRef.current.querySelectorAll(".slide");
    
    // Responsive card sizing
    const updateSlideSize = () => {
      const isMobileView = window.innerWidth < 768;
      slideElements.forEach((slide) => {
        const htmlSlide = slide as HTMLElement;
        if (isMobileView) {
          htmlSlide.style.width = '90vw';
          htmlSlide.style.maxWidth = '400px';
          htmlSlide.style.height = 'auto';
          htmlSlide.style.minHeight = '450px';
        } else {
          htmlSlide.style.width = '550px';
          htmlSlide.style.height = '550px';
        }
      });
    };
    
    updateSlideSize();
    window.addEventListener('resize', updateSlideSize);

    slideElements.forEach((slide, i) => {
      const zPosition = initialZ + i * zStep;
      
      // All cards centered at 50%
      const xPosition = "50%";
      
      // First card (last in reversed array) should be visible, others invisible
      const opacity = i === totalSlides - 1 ? 1 : 0;

      gsap.set(slide, {
        top: "60%",
        left: xPosition,
        xPercent: -50,
        yPercent: -50,
        z: zPosition,
        opacity: opacity,
      });
    });

    // ScrollTrigger for tunnel speed based on scroll progress
    ScrollTrigger.create({
      trigger: ".container",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        // Increase scroll speed based on progress
        uniforms.scrollSpeed.value = self.progress * 5;
        setScrollProgress(self.progress);
      },
    });

    // ScrollTrigger for each slide
    slideElements.forEach((slide) => {
      const initialZPos = gsap.getProperty(slide, "z") as number;

      ScrollTrigger.create({
        trigger: ".container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const zIncrement = progress * 22500;
          const currentZ = initialZPos + zIncrement;

          let opacity;
          if (currentZ >= -2500) {
            opacity = ((currentZ - -2500) * (1 - 0)) / (0 - -2500) + 0;
          } else {
            opacity = ((currentZ - -5000) * (0 - 0)) / (-2500 - -5000) + 0;
          }

          (slide as HTMLElement).style.opacity = opacity.toString();
          (slide as HTMLElement).style.transform = 
            `translateX(-50%) translateY(-50%) translateZ(${currentZ}px)`;
        },
      });
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('resize', updateSlideSize);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.ticker.remove(() => {});
    };
  }, [type, slides]);

  const handleBeginJourney = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full px-4 py-4 md:p-8 flex justify-between md:justify-center items-center z-[100]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        {/* Back Button - Mobile */}
        <button 
          onClick={onBack}
          className="md:hidden flex items-center gap-2 p-2 text-white"
          style={{ mixBlendMode: "normal" }}
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>

        {/* Desktop Back Button */}
        <button 
          onClick={onBack}
          className="hidden md:flex fixed top-8 left-8 items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-all text-white"
          style={{ mixBlendMode: "normal" }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="text-white no-underline" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: window.innerWidth < 768 ? "32px" : "56px", fontWeight: 700, letterSpacing: "-0.02em", mixBlendMode: "exclusion" }}>
          {type === "degen" ? "Degen" : "Regen"}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-white"
          style={{ mixBlendMode: "normal" }}
          aria-label="Open menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        
        {/* Spacer for desktop */}
        <div className="hidden md:block w-10" />
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center"
          onClick={() => setMenuOpen(false)}
        >
          <div className="text-center space-y-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-4xl font-['Rajdhani',sans-serif]">Menu</h2>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleBeginJourney();
              }}
              className="px-8 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all font-['Rajdhani',sans-serif]"
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}

      {/* Container */}
      <div className="container w-full" style={{ height: "2000vh" }}>
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-radial from-transparent via-transparent to-black pointer-events-none" 
             style={{ background: "radial-gradient(circle, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 1) 100%)" }} />
        
        {/* Slider */}
        <div 
          ref={sliderRef}
          className="slider fixed top-0 w-screen h-screen overflow-hidden z-[2]"
          style={{ 
            transformStyle: "preserve-3d",
            perspective: "500px"
          }}
        >
          {[...slides].reverse().map((slide, index) => (
            <div 
              key={slide.id || index}
              className="slide absolute will-change-transform"
              style={{ width: "550px", height: "550px", fontFamily: "'Rajdhani', sans-serif" }}
            >
              <div 
                className="w-full h-full flex flex-col justify-between p-6 md:p-10 border border-white/10 backdrop-blur-xl rounded-3xl overflow-auto"
                style={{ 
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 0 60px 0 rgba(100, 150, 255, 0.15)"
                }}
              >
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-6 md:mb-8">
                    {slide.subtitle && (
                      <div className="text-white uppercase mb-2 md:mb-3" style={{ fontSize: window.innerWidth < 768 ? "14px" : "16px", fontWeight: 600, letterSpacing: "0.15em", color: type === "degen" ? "rgba(255, 120, 100, 0.9)" : "rgba(100, 200, 255, 0.9)" }}>
                        {slide.subtitle}
                      </div>
                    )}
                    <h2 className="text-white mb-4 md:mb-6" style={{ fontSize: window.innerWidth < 768 ? "36px" : "52px", fontWeight: 700, lineHeight: "1.1", letterSpacing: "-0.01em" }}>
                      {slide.title}
                    </h2>
                  </div>
                  
                  <div className="space-y-3 md:space-y-5">
                    <p className="text-white" style={{ fontSize: window.innerWidth < 768 ? "18px" : "22px", lineHeight: "1.5", fontWeight: 500, color: "rgba(255, 255, 255, 0.95)" }}>
                      {slide.content}
                    </p>
                    {slide.description && (
                      <p className="text-white" style={{ fontSize: window.innerWidth < 768 ? "16px" : "18px", lineHeight: "1.6", fontWeight: 400, color: "rgba(255, 255, 255, 0.75)" }}>
                        {slide.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Feature Image */}
                  {slide.image && (
                    <div className="mt-6 md:mt-8 flex justify-center">
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="w-full max-w-md h-auto rounded-xl object-contain"
                        style={{
                          filter: type === "degen" 
                            ? "drop-shadow(0 0 20px rgba(220, 20, 60, 0.3))" 
                            : "drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))"
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white uppercase" style={{ fontSize: window.innerWidth < 768 ? "10px" : "12px", fontWeight: 600, letterSpacing: "0.2em", color: "rgba(255, 255, 255, 0.4)" }}>
                    {slide.id || `SLIDE ${index + 1}`}
                  </span>
                  <div style={{ 
                    width: window.innerWidth < 768 ? "30px" : "40px", 
                    height: "2px", 
                    background: type === "degen" ? "linear-gradient(90deg, rgba(255, 120, 100, 0) 0%, rgba(255, 120, 100, 0.6) 100%)" : "linear-gradient(90deg, rgba(100, 200, 255, 0) 0%, rgba(100, 200, 255, 0.6) 100%)"
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          className="fixed bottom-20 left-0 right-0 text-center z-[3] transition-all duration-500"
          style={{
            opacity: scrollProgress > 0.85 ? 1 : 0,
            pointerEvents: scrollProgress > 0.85 ? 'auto' : 'none',
            transform: scrollProgress > 0.85 ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <button
            onClick={handleBeginJourney}
            className="px-12 py-4 rounded-full text-xl text-white transition-all transform hover:scale-105 font-['Rajdhani',sans-serif]"
            style={{
              backgroundColor: type === "degen" ? "#dc2626" : "#2563eb"
            }}
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}