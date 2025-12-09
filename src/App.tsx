import React, {
  useState, useEffect, useRef,
































  lazy, Suspense
} from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "motion/react";
// Placeholder logo for local development
const logoImage = "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=200&h=200&fit=crop";

// Lazy load components that use Three.js to prevent multiple instances
const TunnelLanding = lazy(() => import("./components/TunnelLanding"));
const DashboardNew = lazy(() => import("./components/DashboardNew"));

import Assessment from "./components/landing/Assessment";
import FadeTransition from "./components/FadeTransition";
import Dashboard from "./components/Dashboard";
import WalletEntry from "./components/WalletEntry";
import GlassOnboarding from "./components/GlassOnboarding";
import TribeOnboarding from "./components/TribeOnboarding";
import LoginModal from "./components/LoginModal";
import { SplashScreen } from "./components/SplashScreen";
import TermsOfService from "./components/legal/TermsOfService";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import { ApiProvider } from "./providers/ApiProvider";

type Side = "degen" | "regen" | null;

// Helper functions for the shader
const commonShaderUtils = `
  vec2 hash2_2(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx+p3.yz)*p3.zy);
  }

  float hash1_2(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
  }

  // Simple value noise 2->2
  vec2 noise2_2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      vec2 h00 = hash2_2(i);
      vec2 h10 = hash2_2(i + vec2(1.0, 0.0));
      vec2 h01 = hash2_2(i + vec2(0.0, 1.0));
      vec2 h11 = hash2_2(i + vec2(1.0, 1.0));
      
      return mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);
  }

  // Simple value noise 2->1
  float noise1_2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float h00 = hash1_2(i);
      float h10 = hash1_2(i + vec2(1.0, 0.0));
      float h01 = hash1_2(i + vec2(0.0, 1.0));
      float h11 = hash1_2(i + vec2(1.0, 1.0));
      
      return mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);
  }
`;

const ParticleShader: React.FC<{ type: "degen" | "regen" }> = ({
  type,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Configuration based on type
    const config =
      type === "degen"
        ? {
          direction: "vec2(0.0, -1.0)", // Up
          sparkColor: "vec3(1.0, 0.4, 0.05) * 1.5",
          bloomColor: "vec3(1.0, 0.4, 0.05) * 0.8",
          smokeColor: "vec3(1.0, 0.43, 0.1) * 0.8",
          particleScale: "vec2(0.5, 1.6)",
          particleScaleVar: "vec2(0.25, 0.2)",
          movementSpeed: "0.5",
        }
        : {
          direction: "vec2(0.0, 1.0)", // Down
          sparkColor: "vec3(0.6, 0.8, 1.0) * 1.5", // Ice Blue
          bloomColor: "vec3(0.4, 0.7, 1.0) * 0.8",
          smokeColor: "vec3(0.0, 0.1, 0.2) * 0.8", // Dark Blue Mist
          particleScale: "vec2(0.8, 0.8)", // Rounder snowflakes
          particleScaleVar: "vec2(0.2, 0.2)",
          movementSpeed: "0.3", // Slower snow
        };

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      ${commonShaderUtils}

      #define PI 3.1415927
      #define TWO_PI 6.283185

      #define ANIMATION_SPEED 0.6
      #define MOVEMENT_SPEED ${config.movementSpeed}
      #define MOVEMENT_DIRECTION ${config.direction}

      #define PARTICLE_SIZE 0.002

      #define PARTICLE_SCALE (${config.particleScale})
      #define PARTICLE_SCALE_VAR (${config.particleScaleVar})

      #define PARTICLE_BLOOM_SCALE (vec2(0.5, 0.8))
      #define PARTICLE_BLOOM_SCALE_VAR (vec2(0.3, 0.1))

      #define SPARK_COLOR ${config.sparkColor}
      #define BLOOM_COLOR ${config.bloomColor}
      #define SMOKE_COLOR ${config.smokeColor}

      #define SIZE_MOD 1.01
      #define ALPHA_MOD 0.9
      #define LAYERS_COUNT 6 // Optimized from 10

      float layeredNoise1_2(in vec2 uv, in float sizeMod, in float alphaMod, in int layers, in float animation) {
        float noise = 0.3;
        float alpha = 1.0;
        float size = 1.0;
        vec2 offset = vec2(0.0);
        for (int i = 0; i < LAYERS_COUNT; i++) {
            if (i >= layers) break;
            offset += hash2_2(vec2(alpha, size)) * 10.0;
            noise += noise1_2(uv * size + iTime * animation * 8.0 * MOVEMENT_DIRECTION * MOVEMENT_SPEED + offset) * alpha;
            alpha *= alphaMod;
            size *= sizeMod;
        }
        noise *= (1.0 - alphaMod)/(1.0 - pow(alphaMod, float(layers)));
        return noise;
      }

      vec2 rotate(in vec2 point, in float deg) {
        float s = sin(deg);
        float c = cos(deg);
        return mat2(s, c, -c, s) * point;
      }

      vec2 voronoiPointFromRoot(in vec2 root, in float deg) {
        vec2 point = hash2_2(root) - 0.5;
        float s = sin(deg);
        float c = cos(deg);
        point = mat2(s, c, -c, s) * point * 0.66;
        point += root + 0.5;
        return point;
      }

      float degFromRootUV(in vec2 uv) {
        return iTime * ANIMATION_SPEED * (hash1_2(uv) - 0.5) * 2.0;   
      }

      vec2 randomAround2_2(in vec2 point, in vec2 range, in vec2 uv) {
        return point + (hash2_2(uv) - 0.5) * range;
      }

      vec3 fireParticles(in vec2 uv, in vec2 originalUV) {
        vec3 particles = vec3(0.0);
        vec2 rootUV = floor(uv);
        float deg = degFromRootUV(rootUV);
        vec2 pointUV = voronoiPointFromRoot(rootUV, deg);
        float dist = 2.0;
        float distBloom = 0.0;
      
        vec2 tempUV = uv + (noise2_2(uv * 2.0) - 0.5) * 0.1;
        tempUV += -(noise2_2(uv * 3.0 + iTime) - 0.5) * 0.07;

        dist = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_SCALE, PARTICLE_SCALE_VAR, rootUV));
        distBloom = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_BLOOM_SCALE, PARTICLE_BLOOM_SCALE_VAR, rootUV));

        particles += (1.0 - smoothstep(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 3.0, dist)) * SPARK_COLOR;
        particles += pow((1.0 - smoothstep(0.0, PARTICLE_SIZE * 6.0, distBloom)) * 1.0, 3.0) * BLOOM_COLOR;

        float border = (hash1_2(rootUV) - 0.5) * 2.0;
        float disappear = 1.0 - smoothstep(border, border + 0.5, originalUV.y);
        
        border = (hash1_2(rootUV + 0.214) - 1.8) * 0.7;
        float appear = smoothstep(border, border + 0.4, originalUV.y);
        
        return particles * disappear * appear;
      }

      vec3 layeredParticles(in vec2 uv, in float sizeMod, in float alphaMod, in int layers, in float smoke) { 
        vec3 particles = vec3(0.0);
        float size = 1.0;
        float alpha = 1.0;
        vec2 offset = vec2(0.0);
        vec2 noiseOffset;
        vec2 bokehUV;
        
        for (int i = 0; i < LAYERS_COUNT; i++) {
            if (i >= layers) break;
            noiseOffset = (noise2_2(uv * size * 2.0 + 0.5) - 0.5) * 0.15;
            bokehUV = (uv * size + iTime * MOVEMENT_DIRECTION * MOVEMENT_SPEED) + offset + noiseOffset; 
            particles += fireParticles(bokehUV, uv) * alpha * (1.0 - smoothstep(0.0, 1.0, smoke) * (float(i) / float(layers)));
            offset += hash2_2(vec2(alpha, alpha)) * 10.0;
            alpha *= alphaMod;
            size *= sizeMod;
        }
        return particles;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.x;
        float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv + vec2(0.0, 0.3)));
        uv *= 1.8;
        
        float smokeIntensity = layeredNoise1_2(uv * 10.0 + iTime * 4.0 * MOVEMENT_DIRECTION * MOVEMENT_SPEED, 1.7, 0.7, 6, 0.2);
        smokeIntensity *= pow(1.0 - smoothstep(-1.0, 1.6, uv.y), 2.0); 
        vec3 smoke = smokeIntensity * SMOKE_COLOR * 0.8 * vignette;
        smoke *= pow(layeredNoise1_2(uv * 4.0 + iTime * 0.5 * MOVEMENT_DIRECTION * MOVEMENT_SPEED, 1.8, 0.5, 3, 0.2), 2.0) * 1.5;
        
        vec3 particles = layeredParticles(uv, SIZE_MOD, ALPHA_MOD, LAYERS_COUNT, smokeIntensity);
        vec3 col = particles + smoke + SMOKE_COLOR * 0.02;
        col *= vignette;
        col = smoothstep(-0.08, 1.0, col);
        
        fragColor = vec4(col, 1.0);
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(
      program,
      "position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    const iResolutionLocation = gl.getUniformLocation(
      program,
      "iResolution",
    );
    const iTimeLocation = gl.getUniformLocation(
      program,
      "iTime",
    );

    const resize = () => {
      // Optimization: Use lower resolution for particle effects on high DPI screens
      const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * pixelRatio;
      canvas.height = canvas.clientHeight * pixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(
        iResolutionLocation,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(iTimeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [type]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// Split screen background container - responsive
const SplitParticleBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 w-full h-full flex flex-col md:flex-row pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-80">
          <ParticleShader type="degen" />
        </div>
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-80">
          <ParticleShader type="regen" />
        </div>
      </div>
    </div>
  );
};

// Feature Page Background Shader (Voronoi Glass Tunnel)
const FeatureBackground: React.FC<{
  type: "degen" | "regen";
}> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Color tinting based on tribe
    const glassColorLogic = type === "degen"
      ? `
        // Red/Orange glass tint for Degen
        vec3 glassTint = vec3(1.2, 0.3, 0.2);
        vec3 skyTop = vec3(0.3, 0.05, 0.05);
        vec3 skyBottom = vec3(0.15, 0.02, 0.02);
      `
      : `
        // Blue/Cyan glass tint for Regen  
        vec3 glassTint = vec3(0.2, 0.5, 1.3);
        vec3 skyTop = vec3(0.05, 0.1, 0.25);
        vec3 skyBottom = vec3(0.02, 0.05, 0.15);
      `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      #define PI 3.141592654
      #define TAU (2.0*PI)
      
      const float planeDist = 0.75;
      float g_hmul = 1.0;

      // sRGB conversion
      float sRGB(float t) { return mix(1.055*pow(t, 1./2.4) - 0.055, 12.92*t, step(t, 0.0031308)); }
      vec3 sRGB(vec3 c) { return vec3(sRGB(c.x), sRGB(c.y), sRGB(c.z)); }

      const float zoomOuter = 1.0;
      const float zoomInner = 0.2;

      float tanh_approx(float x) {
        float x2 = x*x;
        return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
      }

      vec4 alphaBlend(vec4 back, vec4 front) {
        float w = front.w + back.w*(1.0-front.w);
        vec3 xyz = (front.xyz*front.w + back.xyz*back.w*(1.0-front.w))/w;
        return w > 0.0 ? vec4(xyz, w) : vec4(0.0);
      }

      vec3 alphaBlend(vec3 back, vec4 front) {
        return mix(back, front.xyz, front.w);
      }

      float hash(float co) {
        return fract(sin(co*12.9898) * 13758.5453);
      }

      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p)*43758.5453123);
      }

      float hex(vec2 p, float r) {
        const vec3 k = 0.5*vec3(-sqrt(3.0), 1.0, sqrt(4.0/3.0));
        p = abs(p);
        p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
        p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
        return length(p)*sign(p.y);
      }

      vec3 offset(float z) {
        float a = z;
        vec2 p = -0.1*(vec2(cos(a), sin(a*sqrt(2.0))) + vec2(cos(a*sqrt(0.75)), sin(a*sqrt(0.5))));
        return vec3(p, z);
      }

      vec3 doffset(float z) {
        float eps = 0.05;
        return (offset(z + eps) - offset(z - eps))/(2.0*eps);
      }

      vec3 ddoffset(float z) {
        float eps = 0.05;
        return (doffset(z + eps) - doffset(z - eps))/(2.0*eps);
      }

      vec3 skyColor(vec3 ro, vec3 rd) {
        ${glassColorLogic}
        
        float ld = max(dot(rd, vec3(0.0, 0.0, 1.0)), 0.0);
        vec3 gradient = mix(skyBottom, skyTop, rd.y * 0.5 + 0.5);
        return gradient * (1.0 + tanh_approx(3.0*pow(ld, 100.0)));
      }

      float voronoi2(vec2 p) {
        vec2 g = floor(p), o;
        p -= g;
        
        vec3 d = vec3(1.0);
          
        for(int y = -1; y <= 1; y++) {
          for(int x = -1; x <= 1; x++) {
            o = vec2(float(x), float(y));
            o += hash2(g + o) - p;
            d.z = dot(o, o); 
            d.y = max(d.x, min(d.y, d.z));
            d.x = min(d.x, d.z); 
          }
        }
        
        return max(d.y/1.2 - d.x, 0.0)/1.2;
      }

      float hf2(vec2 p) {
        const float zo = zoomOuter;
        const float zi = zoomInner;
        
        p /= zo;
        p /= zi;
        
        float d = -voronoi2(p);
        d *= zi*zo;
        
        float h = 0.2*tanh_approx(3.0*smoothstep(0.0, 1.0*zo*zi, -d));
        
        return h*zo*zi;
      }

      float height(vec2 p) {
        return -hf2(p)*g_hmul;
      }

      vec3 normal(vec2 p, float eps) {
        vec2 e = vec2(0.00001, 0.0);
        
        vec3 n;
        n.x = height(p + e.xy) - height(p - e.xy);
        n.y = height(p + e.yx) - height(p - e.yx);
        n.z = -2.0*e.x;
        
        return normalize(n);
      }

      vec4 plane(vec3 pro, vec3 ro, vec3 rd, vec3 pp, vec3 off, float aa, float n_, out vec3 pnor) {
        ${glassColorLogic}
        
        float h0 = hash(n_);
        float h1 = fract(7793.0*h0);
        float h2 = fract(6337.0*h0);
        
        vec2 p = (pp-off*vec3(1.0, 1.0, 0.0)).xy;
        const float s = 1.0;
        vec3 lp1 = vec3(5.0, 1.0, 0.0)*vec3(s, 1.0, s)+pro;
        vec3 lp2 = vec3(-5.0, 1.0, 0.0)*vec3(s, 1.0, s)+pro;
        const float hsz = 0.2;
        float hd = hex(p.yx, hsz);

        g_hmul = smoothstep(0.0, 0.125, (hd-hsz/2.0));

        p += vec2(h0,h1)*20.0;
        p *= mix(0.5, 1.0, h2);
        float he = height(p);
        vec3 nor = normal(p, 2.0*aa);
        vec3 po = pp;

        pnor = nor;

        vec3 ld1 = normalize(lp1 - po);
        vec3 ld2 = normalize(lp2 - po);
        
        float diff1 = max(dot(nor, ld1), 0.0);
        float diff2 = max(dot(nor, ld2), 0.0);
        diff1 = ld1.z*nor.z;

        vec3 ref = reflect(rd, nor);
        float ref1 = max(dot(ref, ld1), 0.0);
        float ref2 = max(dot(ref, ld2), 0.0);

        vec3 mat = glassTint * 0.15;
        vec3 lcol1 = glassTint * 1.2;
        vec3 lcol2 = glassTint * 0.9;
        
        float hf = smoothstep(0.0, 0.0002, -he);
        vec3 lpow1 = 1.0*lcol1/dot(ld1, ld1);
        vec3 lpow2 = 1.0*lcol2/dot(ld2, ld2);
        vec3 col = vec3(0.0);
        col += hf*mat*diff1*diff1*lpow1;
        col += hf*mat*diff2*diff2*lpow2;
        float spes = 20.0;
        col += pow(ref1, spes)*lcol1*0.5;
        col += pow(ref2, spes)*lcol2*0.5;

        float t = 1.0;
        t *= smoothstep(aa, -aa, -(hd-hsz/4.0));
        t *= mix(1.0, 0.75, hf);
        
        return vec4(col, t);
      }

      vec3 color(vec3 ww, vec3 uu, vec3 vv, vec3 pro, vec3 ro, vec2 p) {
        float lp = length(p);
        vec2 np = p + 1.0/iResolution.xy;
        float rdd = 2.0+tanh_approx(length(0.25*p));
        
        vec3 rd = normalize(p.x*uu + p.y*vv + rdd*ww);
        vec3 nrd = normalize(np.x*uu + np.y*vv + rdd*ww);

        const int furthest = 5;
        const int fadeFrom = max(furthest-2, 0);

        const float fadeDist = planeDist*float(furthest - fadeFrom);
        float nz = floor(ro.z / planeDist);

        vec3 skyCol = skyColor(ro, rd);

        vec4 acol = vec4(0.0);
        const float cutOff = 0.98;
        bool cutOut = false;

        for (int i = 1; i <= furthest; ++i) {
          float pz = planeDist*nz + planeDist*float(i);

          float pd = (pz - ro.z)/rd.z;

          if (pd > 0.0 && acol.w < cutOff) {
            vec3 pp = ro + rd*pd;
            vec3 npp = ro + nrd*pd;

            float aa = 3.0*length(pp - npp);

            vec3 off = offset(pp.z);

            vec3 pnor = vec3(0.0);
            vec4 pcol = plane(pro, ro, rd, pp, off, aa, nz+float(i), pnor);
            
            vec3 refr = refract(rd, pnor, 1.0-0.075);
            if (pcol.w > (1.0-cutOff) && refr != vec3(0.0)) {
              rd = refr;
            }

            float dz = pp.z-ro.z;
            const float fi = 0.0; 
            float fadeIn = smoothstep(planeDist*(float(furthest)+fi), planeDist*(float(fadeFrom)-fi), dz);
            float fadeOut = smoothstep(0.0, planeDist*0.1, dz);
            pcol.w *= fadeOut*fadeIn;

            acol = alphaBlend(pcol, acol);
          } else {
            cutOut = true;
            acol.w = acol.w > cutOff ? 1.0 : acol.w;
            break;
          }
        }

        vec3 col = alphaBlend(skyCol, acol);
        return col;
      }

      void mainImage(out vec4 fragColor, vec2 fragCoord) {
        vec2 q = fragCoord/iResolution.xy;
        vec2 p = -1.0 + 2.0 * q;
        p.x *= iResolution.x/iResolution.y;
        
        float z = 0.33*planeDist*iTime;
        vec3 pro = offset(z-1.0);
        vec3 ro = offset(z);
        vec3 dro = doffset(z);
        vec3 ddro = ddoffset(z);

        vec3 ww = normalize(dro);
        vec3 uu = normalize(cross(normalize(vec3(0.0,1.0,0.0)+ddro), ww));
        vec3 vv = cross(ww, uu);

        vec3 col = color(ww, uu, vv, pro, ro, p);
        col *= smoothstep(0.0, 4.0, iTime);
        col = sRGB(col);
        
        fragColor = vec4(col, 1.0);
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(
      program,
      "position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    const iResolutionLocation = gl.getUniformLocation(
      program,
      "iResolution",
    );
    const iTimeLocation = gl.getUniformLocation(
      program,
      "iTime",
    );

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(
        iResolutionLocation,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(iTimeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [type]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
};

// Degen Fire Overlay Component
const DegenFireOverlay: React.FC<{
  isVisible: boolean;
  isSelected: boolean;
}> = ({ isVisible, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      ${commonShaderUtils}

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898,12.1414))) * 83758.5453);
      }

      vec3 ramp(float t) {
        return t <= 0.5 ? vec3(1.05, 0.2 - t * 1.4, 0.0) / t : vec3(1.05, 0.3 * (1.0 - t) * 2.0, 0.0) / t;
      }

      float fire(vec2 n) {
        return noise1_2(n) + noise1_2(n * 2.1) * 0.6 + noise1_2(n * 5.4) * 0.42;
      }

      vec3 getLine(vec3 col, vec2 fc, mat2 mtx, float shift) {
        float t = iTime;
        vec2 uv = (fc / iResolution.xy) * mtx;
        uv.x += uv.y < 0.5 ? 23.0 + t * 0.35 : -11.0 + t * 0.3;    
        uv.y = abs(uv.y - shift);
        uv *= 5.0;
        float q = fire(uv - t * 0.013) / 2.0;
        vec2 r = vec2(fire(uv + q / 2.0 + t - uv.x - uv.y), fire(uv + q - t));
        vec3 color = vec3(1.0 / (pow(vec3(0.5, 0.0, 0.1) + 1.61, vec3(4.0))));
        float grad = pow((r.y + r.y) * max(0.0, uv.y) + 0.1, 4.0);
        color = ramp(grad);
        color /= (1.50 + max(vec3(0.0), color));
        color.r *= 2.5; color.g *= 1.2; color.b *= 0.3;
        if(color.r < 0.00000005) color = vec3(0.0);
        return mix(col, color, color.r);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec3 color = vec3(0.0);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 0.0, 1.0), 1.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 1.0, 0.0), 1.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 0.0, 1.0), -0.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 1.0, 0.0), -0.02);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(
      program,
      "position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    const iResolutionLocation = gl.getUniformLocation(
      program,
      "iResolution",
    );
    const iTimeLocation = gl.getUniformLocation(
      program,
      "iTime",
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      canvas.width = isMobile ? window.innerWidth : window.innerWidth / 2;
      canvas.height = isMobile ? window.innerHeight / 2 : window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(
        iResolutionLocation,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(iTimeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none w-full h-1/2 md:w-1/2 md:h-full"
      style={{ zIndex: 2 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible && !isSelected ? 0.15 : 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  );
};

// Page Transition Component - Wipe effect that reveals next page
const PageTransition: React.FC<{
  isActive: boolean;
  type: "degen" | "regen";
  triggerKey?: number;
}> = ({ isActive, type, triggerKey = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const progressRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      progressRef.current = 0;
      startTimeRef.current = Date.now();
      return;
    }

    // Reset animation on triggerKey change
    startTimeRef.current = Date.now();
    progressRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = type === "degen" ? `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float iProgress;

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract(dot(p3.xy, p3.zz));
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash12(i);
        float b = hash12(i + vec2(1.0, 0.0));
        float c = hash12(i + vec2(0.0, 1.0));
        float d = hash12(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        bool isMobile = iResolution.x < 768.0;
        
        // Diagonal wipe direction - adjust for mobile (top-down) vs desktop (left-right)
        float wipeCoord = isMobile ? (1.0 - uv.y) : (uv.x + uv.y * 0.3);
        
        // Add noise displacement to edge
        float noiseValue = noise(uv * 10.0 + iTime * 2.0);
        float edge = iProgress * 1.4 - 0.2 + noiseValue * 0.15;
        
        // Create the wipe mask with soft edge
        float mask = smoothstep(edge - 0.1, edge + 0.05, wipeCoord);
        
        // Glitch effect at the edge
        float glitch = step(0.4, noiseValue) * step(edge - 0.08, wipeCoord) * step(wipeCoord, edge + 0.08);
        
        // Color gradient - red/orange fire colors
        vec3 color = mix(
          vec3(1.0, 0.2, 0.0),  // Orange
          vec3(1.0, 0.05, 0.2),  // Red-pink
          noiseValue
        );
        
        // Add bright edge glow
        float edgeGlow = smoothstep(0.1, 0.0, abs(wipeCoord - edge)) * 2.0;
        color += vec3(1.0, 0.6, 0.2) * edgeGlow;
        
        // Final alpha - full opacity in transition area, fade at edges
        float alpha = (1.0 - mask) * (1.0 - smoothstep(0.85, 1.0, iProgress));
        alpha = max(alpha, glitch * 0.8);
        
        gl_FragColor = vec4(color, alpha);
      }
    ` : `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float iProgress;

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract(dot(p3.xy, p3.zz));
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash12(i);
        float b = hash12(i + vec2(1.0, 0.0));
        float c = hash12(i + vec2(0.0, 1.0));
        float d = hash12(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        bool isMobile = iResolution.x < 768.0;
        
        // Diagonal wipe direction - adjust for mobile (bottom-up) vs desktop (right-left)  
        float wipeCoord = isMobile ? uv.y : (1.0 - uv.x + uv.y * 0.3);
        
        // Add crystalline noise pattern
        float noiseValue = noise(uv * 15.0 + iTime * 1.5);
        float edge = iProgress * 1.4 - 0.2 + noiseValue * 0.12;
        
        // Create the wipe mask with soft edge
        float mask = smoothstep(edge - 0.1, edge + 0.05, wipeCoord);
        
        // Crystallization effect at the edge
        float crystal = step(0.5, noiseValue) * step(edge - 0.08, wipeCoord) * step(wipeCoord, edge + 0.08);
        
        // Color gradient - blue/cyan ice colors
        vec3 color = mix(
          vec3(0.0, 0.8, 1.0),   // Cyan
          vec3(0.2, 0.4, 1.0),   // Blue
          noiseValue
        );
        
        // Add bright edge glow
        float edgeGlow = smoothstep(0.1, 0.0, abs(wipeCoord - edge)) * 2.0;
        color += vec3(0.4, 0.9, 1.0) * edgeGlow;
        
        // Final alpha - full opacity in transition area, fade at edges
        float alpha = (1.0 - mask) * (1.0 - smoothstep(0.85, 1.0, iProgress));
        alpha = max(alpha, crystal * 0.8);
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(
      program,
      "position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    const iResolutionLocation = gl.getUniformLocation(
      program,
      "iResolution",
    );
    const iTimeLocation = gl.getUniformLocation(
      program,
      "iTime",
    );
    const iProgressLocation = gl.getUniformLocation(
      program,
      "iProgress",
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const animationStart = Date.now();
    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      const elapsed = (Date.now() - animationStart) / 1000;
      progressRef.current = Math.min(elapsed / 0.8, 1.0); // 0.8 second transition

      gl.uniform2f(
        iResolutionLocation,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(iTimeLocation, time);
      gl.uniform1f(iProgressLocation, progressRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, triggerKey, type]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 60 }}
    />
  );
};

// Regen Fire Overlay Component
const RegenFireOverlay: React.FC<{
  isVisible: boolean;
  isSelected?: boolean;
}> = ({ isVisible, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      ${commonShaderUtils}

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898,12.1414))) * 83758.5453);
      }

      vec3 ramp(float t) {
        return t <= 0.5 ? vec3(1.0 - t * 1.4, 0.2, 1.05) / t : vec3(0.3 * (1.0 - t) * 2.0, 0.2, 1.05) / t;
      }

      float fire(vec2 n) {
        return noise1_2(n) + noise1_2(n * 2.1) * 0.6 + noise1_2(n * 5.4) * 0.42;
      }

      vec3 getLine(vec3 col, vec2 fc, mat2 mtx, float shift) {
        float t = iTime;
        vec2 uv = (fc / iResolution.xy) * mtx;
        uv.x += uv.y < 0.5 ? 23.0 + t * 0.35 : -11.0 + t * 0.3;    
        uv.y = abs(uv.y - shift);
        uv *= 5.0;
        float q = fire(uv - t * 0.013) / 2.0;
        vec2 r = vec2(fire(uv + q / 2.0 + t - uv.x - uv.y), fire(uv + q - t));
        vec3 color = vec3(1.0 / (pow(vec3(0.5, 0.0, 0.1) + 1.61, vec3(4.0))));
        float grad = pow((r.y + r.y) * max(0.0, uv.y) + 0.1, 4.0);
        color = ramp(grad);
        color /= (1.50 + max(vec3(0.0), color));
        color.b *= 2.0; color.r *= 0.4; color.g *= 0.7;
        if(color.b < 0.00000005) color = vec3(0.0);
        return mix(col, color, color.b);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec3 color = vec3(0.0);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 0.0, 1.0), 1.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 1.0, 0.0), 1.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 0.0, 1.0), -0.02);
        color = getLine(color, fragCoord, mat2(1.0, 1.0, 1.0, 0.0), -0.02);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(
      program,
      "position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    const iResolutionLocation = gl.getUniformLocation(
      program,
      "iResolution",
    );
    const iTimeLocation = gl.getUniformLocation(
      program,
      "iTime",
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      canvas.width = isSelected || isMobile
        ? window.innerWidth
        : window.innerWidth / 2;
      canvas.height = isSelected
        ? window.innerHeight
        : isMobile ? window.innerHeight / 2 : window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(
        iResolutionLocation,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(iTimeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSelected]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed pointer-events-none bottom-0 md:top-0 md:right-0 left-0 md:left-auto w-full md:w-1/2 h-1/2 md:h-full"
      style={{ zIndex: 2 }}
      initial={{ opacity: 0 }}
      animate={
        isSelected
          ? { opacity: [0.15, 0.5, 0.5, 0] }
          : { opacity: isVisible ? 0.15 : 0 }
      }
      transition={
        isSelected
          ? {
            opacity: {
              times: [0, 0.4, 0.6, 1],
              duration: 2.5,
              ease: "easeInOut",
            },
          }
          : { duration: 0.5, ease: "easeInOut" }
      }
    />
  );
};



// Side component for split-screen
const SplitSide: React.FC<{
  type: "degen" | "regen";
  isHovered: boolean;
  isOtherHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}> = ({
  type,
  isHovered,
  isOtherHovered,
  onHover,
  onLeave,
  onClick,
}) => {
    const isDegen = type === "degen";
    const colors = {
      primary: isDegen ? "#ff3333" : "#3399ff",
      background: isDegen ? "#ff0000" : "#0066ff",
      badge: isDegen ? "RED" : "BLUE",
      title: isDegen ? "DEGEN" : "REGEN",
      subtitle: isDegen
        ? "Pursue Alpha. Master Chaos. Maximize Yield."
        : "Build smart. Protect wealth. Secure your legacy.",
    };

    return (
      <motion.div
        className="relative h-full flex items-start justify-center cursor-pointer overflow-hidden pt-20"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
        animate={{
          scale: isHovered ? 1.02 : 1,
          filter: isOtherHovered
            ? "brightness(0.2)"
            : "brightness(1)",
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${colors.primary}33 0%, transparent 70%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />

        <div className="relative z-10 text-center px-8 max-w-xl">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white mb-6"
            style={{
              fontSize: "clamp(64px, 10vw, 120px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textShadow: `
              0 0 60px ${colors.primary}80,
              0 1px 0 ${isDegen ? "#cc0000" : "#0052cc"},
              0 2px 0 ${isDegen ? "#990000" : "#004099"},
              0 3px 0 ${isDegen ? "#660000" : "#003366"},
              0 4px 0 ${isDegen ? "#330000" : "#002033"},
              0 5px 0 ${isDegen ? "#1a0000" : "#001019"},
              0 6px 1px rgba(0,0,0,.3),
              0 8px 3px rgba(0,0,0,.3),
              0 12px 12px rgba(0,0,0,.4),
              0 20px 30px rgba(0,0,0,.5)
            `,
            }}
          >
            {colors.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-xl"
            style={{
              fontWeight: 700,
              textShadow: `
              0 2px 4px rgba(0,0,0,.5),
              0 4px 8px rgba(0,0,0,.3)
            `,
            }}
          >
            {colors.subtitle}
          </motion.p>

          {/* CTA Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full backdrop-blur-xl border-2 text-white transition-all duration-300 mt-8"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  borderColor: colors.primary,
                  boxShadow: `0 8px 32px ${colors.primary}40`,
                  fontWeight: 700,
                }}
              >
                Choose {colors.title} →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

// Center question container - positioned between sections on mobile
const CenterQuestion: React.FC = () => {
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
        `}
      </style>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute md:bottom-24 top-1/2 md:top-auto left-1/2 z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 md:translate-y-0 w-full max-w-[90vw] md:max-w-md"
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(20px)",
            padding: "32px",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Main text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 700,
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            Choose your path.
            <br />
            Master your wealth.
          </motion.p>
        </div>
      </motion.div>
    </>
  );
};

// Center divider - horizontal on mobile, vertical on desktop
const CenterDivider: React.FC = () => {
  return (
    <>
      {/* Horizontal divider for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 z-10 md:hidden"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(255, 0, 0, 0.8) 20%, rgba(255, 255, 255, 1) 50%, rgba(0, 100, 255, 0.8) 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
        }}
      />
      {/* Vertical divider for desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2 z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(255, 0, 0, 0.8) 20%, rgba(255, 255, 255, 1) 50%, rgba(0, 100, 255, 0.8) 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
        }}
      />
    </>
  );
};

// Split screen view
const SplitScreenView: React.FC<{
  hoveredSide: Side;
  setHoveredSide: (side: Side) => void;
  onSelectSide: (side: "degen" | "regen") => void;
}> = ({ hoveredSide, setHoveredSide, onSelectSide }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="relative w-full h-screen overflow-hidden"
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Degen Side */}
        <div className="flex-1">
          <SplitSide
            type="degen"
            isHovered={hoveredSide === "degen"}
            isOtherHovered={hoveredSide === "regen"}
            onHover={() => setHoveredSide("degen")}
            onLeave={() => setHoveredSide(null)}
            onClick={() => onSelectSide("degen")}
          />
        </div>

        {/* Regen Side */}
        <div className="flex-1">
          <SplitSide
            type="regen"
            isHovered={hoveredSide === "regen"}
            isOtherHovered={hoveredSide === "degen"}
            onHover={() => setHoveredSide("regen")}
            onLeave={() => setHoveredSide(null)}
            onClick={() => onSelectSide("regen")}
          />
        </div>
      </div>

      {/* Center Divider */}
      <CenterDivider />

      {/* Center Question */}
      <CenterQuestion />
    </motion.div>
  );
};

// Main content component (wrapped by App with providers)
function AppContent() {
  const [showSplash, setShowSplash] = useState(true); // Show splash screen first
  const [showWalletEntry, setShowWalletEntry] = useState(false); // Show after splash completes
  const [showLoginModal, setShowLoginModal] = useState(false); // Login modal
  const [showOnboarding, setShowOnboarding] = useState(false); // Glass onboarding
  const [showTribeOnboarding, setShowTribeOnboarding] = useState(false); // Tribe selection
  const [onboardingType, setOnboardingType] = useState<"degen" | "regen" | null>(null);
  const [selectedSide, setSelectedSide] = useState<Side>(null);
  const [hoveredSide, setHoveredSide] = useState<Side>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [effectTrigger, setEffectTrigger] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [showTerms, setShowTerms] = useState(false); // Terms of Service
  const [showPrivacy, setShowPrivacy] = useState(false); // Privacy Policy
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track auth state

  // Fade transition states
  const [fadeActive1, setFadeActive1] = useState(false); // Get Started -> Assessment
  const [fadeActive2, setFadeActive2] = useState(false); // Assessment -> Results
  const [fadeActive3, setFadeActive3] = useState(false); // Results -> Dashboard
  const [fadeWalletEntry, setFadeWalletEntry] = useState(false); // Wallet Entry -> Onboarding

  // Check for existing session on mount AND handle OAuth callback
  useEffect(() => {
    // Check for OAuth callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const error = urlParams.get('error');

    // Handle OAuth errors
    if (error === 'no_account') {
      alert('Please create an account first before using Google Sign-In');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (accessToken && refreshToken) {
      // OAuth callback - save tokens and clean URL
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setIsAuthenticated(true);

      // Clean URL (remove tokens from URL bar)
      window.history.replaceState({}, document.title, window.location.pathname);

      // Reset all views first
      setShowSplash(false);
      setShowWalletEntry(false);
      setShowOnboarding(false);
      setShowLoginModal(false);
      setShowTribeOnboarding(false);
      setShowAssessment(false);
      setShowResults(false);

      // Skip splash and go to tribe selection (split screen) or dashboard
      const savedTribe = localStorage.getItem('userTribe') as Side;
      if (savedTribe) {
        setSelectedSide(savedTribe);
        setAssessmentResults({
          tribe: savedTribe,
          degenPercent: savedTribe === 'degen' ? 75 : 25,
          regenPercent: savedTribe === 'regen' ? 75 : 25,
        });
        setShowDashboard(true);
      } else {
        // Show the split screen "Are you Degen or Regen?"
        setSelectedSide(null);
      }
      return;
    }

    // Check for existing session
    const storedToken = localStorage.getItem('accessToken');
    const savedTribe = localStorage.getItem('userTribe') as Side;

    if (storedToken) {
      // User has an existing session
      setIsAuthenticated(true);
      if (savedTribe) {
        setSelectedSide(savedTribe);
        setAssessmentResults({
          tribe: savedTribe,
          degenPercent: savedTribe === 'degen' ? 75 : 25,
          regenPercent: savedTribe === 'regen' ? 75 : 25,
        });
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);

    // If already authenticated, go straight to dashboard
    if (isAuthenticated && assessmentResults) {
      setShowDashboard(true);
    } else if (isAuthenticated) {
      // Has token but no tribe selected - show tribe selection
      setShowTribeOnboarding(true);
    } else {
      // No token - show wallet entry
      setShowWalletEntry(true);
    }
  };

  const handleCreateWallet = () => {
    // Show onboarding flow - user will choose degen/regen during tribe onboarding
    setFadeWalletEntry(true);
  };

  const handleLoginWallet = () => {
    // Show login modal
    setShowLoginModal(true);
  };

  const handleLogin = (email: string, password: string) => {
    console.log("Login:", email, password);

    // Close login modal
    setShowLoginModal(false);

    // Fade out wallet entry
    setFadeWalletEntry(true);

    // Demo credentials - different tribes based on email
    let tribe: "degen" | "regen" = "degen";
    let degenPercent = 75;
    let regenPercent = 25;

    if (email.toLowerCase().includes("regen") || password === "regen123") {
      tribe = "regen";
      degenPercent = 30;
      regenPercent = 70;
    } else if (email.toLowerCase().includes("degen") || password === "degen123") {
      tribe = "degen";
      degenPercent = 85;
      regenPercent = 15;
    }

    // Simulate user has already chosen tribe - go straight to dashboard
    // In production, fetch user's tribe preference from API
    setTimeout(() => {
      setSelectedSide(tribe);
      setAssessmentResults({
        tribe: tribe,
        degenPercent: degenPercent,
        regenPercent: regenPercent,
      });
    }, 100);
  };

  const handleLoginBack = () => {
    // Close login modal and return to wallet entry
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    // Clear stored session
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userTribe');
    setIsAuthenticated(false);

    // Reset all state to go back to wallet entry
    setShowDashboard(false);
    setShowOnboarding(false);
    setShowTribeOnboarding(false);
    setShowAssessment(false);
    setShowResults(false);
    setSelectedSide(null);
    setAssessmentResults(null);
    setOnboardingType(null);
    setFadeWalletEntry(false);
    setShowWalletEntry(true);
  };

  const handleWalletFadeComplete = () => {
    setFadeWalletEntry(false);
    setShowWalletEntry(false);

    // If user is logging in (already has assessmentResults), go to dashboard
    if (assessmentResults) {
      setShowDashboard(true);
    } else {
      // Otherwise, show onboarding for new user
      setShowOnboarding(true);
      setOnboardingType("degen");
    }
  };

  const handleOnboardingComplete = async (data: any, seedPhrase?: string[]) => {
    console.log("Onboarding complete:", data);
    console.log("Seed phrase:", seedPhrase);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      // Register user with backend
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email || `user_${Date.now()}@paradex.local`,
          password: data.password || 'temp_' + Math.random().toString(36).slice(2),
          name: data.name || 'Paradex User',
        }),
      });

      const result = await response.json();

      if (result.accessToken) {
        // Save tokens to localStorage
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        setIsAuthenticated(true);
        console.log('User registered and tokens saved');
      }
    } catch (error) {
      console.error('Registration failed, continuing with local session:', error);
      // Create a local session anyway for demo purposes
      localStorage.setItem('accessToken', 'local_' + Date.now());
      setIsAuthenticated(true);
    }

    // After wallet creation, show the Degen/Regen split screen selection
    setShowOnboarding(false);
    // Reset to show split screen (selectedSide = null shows SplitScreenView)
    setSelectedSide(null);
    setShowTribeOnboarding(false);
    setShowDashboard(false);
  };

  const handleTribeComplete = (results: any) => {
    console.log("Tribe selection complete:", results);

    // Save tribe selection to localStorage for persistence
    localStorage.setItem('userTribe', results.tribe);

    // Set the selected tribe
    setSelectedSide(results.tribe);
    setAssessmentResults(results);

    // Hide tribe onboarding and show dashboard
    setShowTribeOnboarding(false);
    setShowDashboard(true);
  };

  const handleSelectSide = (side: "degen" | "regen") => {
    setSelectedSide(side);
    setEffectTrigger((prev) => prev + 1);
    // After selecting side on split screen, show tunnel landing
  };

  const handleBack = () => {
    setSelectedSide(null);
    setHoveredSide(null);
    setShowAssessment(false);
    setShowResults(false);
    setShowDashboard(false);
    setAssessmentResults(null);
  };

  const handleTunnelComplete = () => {
    // Trigger fade transition
    setFadeActive1(true);
  };

  const handleFade1Complete = () => {
    setFadeActive1(false);
    setShowAssessment(true);
  };

  const handleShowResults = () => {
    // Assessment questions finished, show results
    setFadeActive2(true);
  };

  const handleFade2Complete = () => {
    setFadeActive2(false);
    setShowResults(true);
  };

  const handleAssessmentComplete = (results: any) => {
    console.log("Assessment results:", results);
    setAssessmentResults(results);
    // Trigger fade to dashboard
    setFadeActive3(true);
  };

  const handleFade3Complete = () => {
    setFadeActive3(false);
    setShowDashboard(true);
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-x-hidden relative">
      {/* Splash Screen - Renders first, on top of everything */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            key="splash-screen"
            onComplete={handleSplashComplete}
          />
        )}
      </AnimatePresence>

      {/* Only render the rest when splash is complete */}
      {!showSplash && (
        <>
          {/* Shader Background - Only visible on main split screen */}
          <div
            style={{
              opacity: selectedSide ? 0 : 1,
              transition: "opacity 1s ease-in-out",
            }}
          >
            <SplitParticleBackground />
          </div>

          {/* Degen Fire Overlay - shown when hovering Degen side */}
          {/* Removed decorative flame overlays per user request
          <DegenFireOverlay
            isVisible={hoveredSide === "degen"}
            isSelected={selectedSide === "degen"}
          />

          {/* Regen Fire Overlay - shown when hovering Regen side */}
          {/* <RegenFireOverlay
            isVisible={hoveredSide === "regen"}
            isSelected={selectedSide === "regen"}
          /> */}

          {/* Fullscreen Transitions */}
          <PageTransition
            isActive={selectedSide === "degen"}
            type="degen"
            triggerKey={effectTrigger}
          />
          <PageTransition
            isActive={selectedSide === "regen"}
            type="regen"
            triggerKey={effectTrigger}
          />

          {/* Fade Transitions */}
          <FadeTransition isActive={fadeActive1} onComplete={handleFade1Complete} duration={1000} />
          <FadeTransition isActive={fadeActive2} onComplete={handleFade2Complete} duration={1000} />
          <FadeTransition isActive={fadeActive3} onComplete={handleFade3Complete} duration={1000} />
          <FadeTransition isActive={fadeWalletEntry} onComplete={handleWalletFadeComplete} duration={1000} />

          {/* Content */}
          <div className="relative" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              {showTerms ? (
                <TermsOfService
                  key="terms"
                  onBack={() => setShowTerms(false)}
                />
              ) : showPrivacy ? (
                <PrivacyPolicy
                  key="privacy"
                  onBack={() => setShowPrivacy(false)}
                />
              ) : showWalletEntry ? (
                <WalletEntry
                  key="wallet-entry"
                  onCreateWallet={handleCreateWallet}
                  onLoginWallet={handleLoginWallet}
                  onShowTerms={(e) => { e?.preventDefault(); setShowTerms(true); }}
                  onShowPrivacy={(e) => { e?.preventDefault(); setShowPrivacy(true); }}
                />
              ) : showOnboarding ? (
                <GlassOnboarding
                  key="onboarding"
                  onComplete={handleOnboardingComplete}
                  type={onboardingType!}
                  onBack={() => {
                    setShowOnboarding(false);
                    setShowWalletEntry(true);
                    setFadeWalletEntry(false);
                  }}
                />
              ) : showTribeOnboarding ? (
                <TribeOnboarding
                  key="tribe-onboarding"
                  onComplete={handleTribeComplete}
                />
              ) : showDashboard ? (
                <Suspense fallback={<div className="w-full h-screen bg-black" />}>
                  <DashboardNew
                    key="dashboard"
                    type={selectedSide!}
                    degenPercent={assessmentResults?.degenPercent || 50}
                    regenPercent={assessmentResults?.regenPercent || 50}
                    onLogout={handleLogout}
                  />
                </Suspense>
              ) : !selectedSide ? (
                <SplitScreenView
                  key="split"
                  hoveredSide={hoveredSide}
                  setHoveredSide={setHoveredSide}
                  onSelectSide={handleSelectSide}
                />
              ) : showAssessment ? (
                <Assessment
                  key="assessment"
                  initialTribe={selectedSide}
                  onComplete={handleAssessmentComplete}
                  onShowResults={handleShowResults}
                  showResults={showResults}
                />
              ) : (
                <Suspense fallback={<div className="w-full h-screen bg-black" />}>
                  <TunnelLanding
                    key="landing"
                    type={selectedSide}
                    onBack={handleBack}
                    onComplete={handleTunnelComplete}
                  />
                </Suspense>
              )}
            </AnimatePresence>
          </div>

          {/* Login Modal - Rendered on top of everything */}
          <AnimatePresence>
            {showLoginModal && (
              <LoginModal
                key="login-modal"
                onLogin={handleLogin}
                onClose={handleLoginBack}
                onBack={handleLoginBack}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ApiProvider>
      <AppContent />
    </ApiProvider>
  );
}