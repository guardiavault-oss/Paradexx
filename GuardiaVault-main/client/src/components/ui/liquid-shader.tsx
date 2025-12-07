// src/components/ui/liquid-shader.tsx

import React, { useEffect, useRef, useState } from "react";
// Three.js dynamically imported - reduces initial bundle by ~600KB
import { getPerformanceConfig, throttle } from "@/utils/performance";

export interface InteractiveNebulaShaderProps {
  hasActiveReminders?: boolean;
  hasUpcomingReminders?: boolean;
  disableCenterDimming?: boolean;
  className?: string;
  fixed?: boolean; // If false, uses absolute positioning (for section backgrounds)
}

/**
 * Full-screen nebula shader background.
 * Props drive three GLSL uniforms—no demo markup here.
 */
export function InteractiveNebulaShader({
  hasActiveReminders = false,
  hasUpcomingReminders = false,
  disableCenterDimming = false,
  className = "",
  fixed = true,
}: InteractiveNebulaShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<any>();
  const [threeLoaded, setThreeLoaded] = useState(false);

  // Dynamically import Three.js to reduce initial bundle size
  useEffect(() => {
    import("three").then((THREE) => {
      setThreeLoaded(true);
      // Store THREE for use in other effects
      (window as any).__THREE__ = THREE;
    });
  }, []);

  // Sync props into uniforms
  useEffect(() => {
    if (!threeLoaded) return;
    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.hasActiveReminders.value   = hasActiveReminders;
      mat.uniforms.hasUpcomingReminders.value = hasUpcomingReminders;
      mat.uniforms.disableCenterDimming.value = disableCenterDimming;
    }
  }, [hasActiveReminders, hasUpcomingReminders, disableCenterDimming, threeLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !threeLoaded) return;

    const THREE = (window as any).__THREE__;
    if (!THREE) return;

    const perfConfig = getPerformanceConfig();

    // Renderer, scene, camera, clock - optimized
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !perfConfig.reduceAnimations, 
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(perfConfig.pixelRatio);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock  = new THREE.Clock();

    // Vertex shader: pass UVs
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Ray-marched nebula fragment shader with reminder-driven palettes
    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform bool hasActiveReminders;
      uniform bool hasUpcomingReminders;
      uniform bool disableCenterDimming;
      varying vec2 vUv;

      #define t iTime
      mat2 m(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
      float map(vec3 p){
        p.xz *= m(t*0.4);
        p.xy *= m(t*0.3);
        vec3 q = p*2. + t;
        return length(p + vec3(sin(t*0.7))) * log(length(p)+1.0)
             + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 1.0;
      }

      void mainImage(out vec4 O, in vec2 fragCoord) {
        vec2 uv = fragCoord / min(iResolution.x, iResolution.y) - vec2(.9, .5);
        uv.x += .4;
        vec3 col = vec3(0.0);
        float d = 2.5;

        // Ray-march - reduced iterations for performance
        int iterations = 5;
        for (int i = 0; i <= iterations; i++) {
          vec3 p = vec3(0,0,5.) + normalize(vec3(uv, -1.)) * d;
          float rz = map(p);
          float f  = clamp((rz - map(p + 0.1)) * 0.5, -0.1, 1.0);

          vec3 base = hasActiveReminders
            ? vec3(0.05,0.2,0.5) + vec3(4.0,2.0,5.0)*f
            : hasUpcomingReminders
            ? vec3(0.05,0.3,0.1) + vec3(2.0,5.0,1.0)*f
            : vec3(0.1,0.3,0.4) + vec3(5.0,2.5,3.0)*f;

          col = col * base + smoothstep(2.5, 0.0, rz) * 0.7 * base;
          d += min(rz, 1.0);
        }

        // Center dimming
        float dist   = distance(fragCoord, iResolution*0.5);
        float radius = min(iResolution.x, iResolution.y) * 0.5;
        float dim    = disableCenterDimming
                     ? 1.0
                     : smoothstep(radius*0.3, radius*0.5, dist);

        O = vec4(col, 1.0);
        if (!disableCenterDimming) {
          O.rgb = mix(O.rgb * 0.3, O.rgb, dim);
        }
      }

      void main() {
        mainImage(gl_FragColor, vUv * iResolution);
      }
    `;

    // Uniforms
    const uniforms = {
      iTime:                { value: 0 },
      iResolution:          { value: new THREE.Vector2() },
      iMouse:               { value: new THREE.Vector2() },
      hasActiveReminders:   { value: hasActiveReminders },
      hasUpcomingReminders: { value: hasUpcomingReminders },
      disableCenterDimming: { value: disableCenterDimming },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    materialRef.current = material;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Resize & mouse - throttled for performance
    const onResize = throttle(() => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    }, 250);
    const onMouseMove = throttle((e: MouseEvent) => {
      uniforms.iMouse.value.set(e.clientX, window.innerHeight - e.clientY);
    }, 16); // ~60fps
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    onResize();

    // Also watch for container size changes when using absolute positioning
    let resizeObserver: ResizeObserver | null = null;
    if (!fixed) {
      resizeObserver = new ResizeObserver(() => {
        onResize();
      });
      resizeObserver.observe(container);
    }

    // Animation loop
    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, [threeLoaded, hasActiveReminders, hasUpcomingReminders, disableCenterDimming]);

  return (
    <div
      ref={containerRef}
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 bg-background ${className}`}
      aria-label="Interactive nebula background"
    />
  );
}

