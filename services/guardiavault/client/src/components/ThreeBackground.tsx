import { useEffect, useRef, useState } from "react";
// Optimized GSAP import - use named imports for better tree-shaking
import { gsap } from "@/lib/gsap-optimized";
import { getPerformanceConfig, createIntersectionObserver, throttle } from "@/utils/performance";
// Type-only import for THREE types (runtime import is dynamic)
import type * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const perfConfig = getPerformanceConfig();

  // Dynamically import Three.js to reduce initial bundle size (~600KB)
  useEffect(() => {
    import("three").then((THREE) => {
      setThreeLoaded(true);
      (window as any).__THREE__ = THREE;
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current || !threeLoaded) return;

    const THREE = (window as any).__THREE__;
    if (!THREE) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Dark slate background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    camera.position.y = 5;

    // Renderer setup - optimized for performance
    const renderer = new THREE.WebGLRenderer({
      antialias: !perfConfig.reduceAnimations,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(perfConfig.pixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 2, 100); // Indigo
    pointLight1.position.set(20, 10, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 2, 100); // Purple
    pointLight2.position.set(-20, -10, -20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x06b6d4, 2, 100); // Cyan
    pointLight3.position.set(0, 20, 0);
    scene.add(pointLight3);

    // Particle system - optimized count
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = perfConfig.particleCount;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Floating geometric shapes - reduced on low-end devices
    const shapes: THREE.Mesh[] = [];
    const shapeCount = perfConfig.reduceAnimations ? 3 : 5;

    // Create icosahedrons
    for (let i = 0; i < shapeCount; i++) {
      const geometry = new THREE.IcosahedronGeometry(2, 1);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, 0.5),
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      shapes.push(mesh);
      scene.add(mesh);
    }

    // Create torus knots - reduced on low-end devices
    const torusCount = perfConfig.reduceAnimations ? 1 : 3;
    for (let i = 0; i < torusCount; i++) {
      const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.6, 0.75, 0.5),
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      shapes.push(mesh);
      scene.add(mesh);
    }

    // Mouse interaction - throttled for performance
    const mouse = new THREE.Vector2();
    const handleMouseMove = throttle((event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, 16); // ~60fps
    window.addEventListener("mousemove", handleMouseMove);

    // GSAP animations for shapes
    shapes.forEach((shape, index) => {
      gsap.to(shape.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 10 + index * 2,
        repeat: -1,
        ease: "none",
      });

      gsap.to(shape.position, {
        y: shape.position.y + (Math.random() - 0.5) * 10,
        x: shape.position.x + (Math.random() - 0.5) * 10,
        duration: 5 + index,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    });

    // GSAP animation for lights
    gsap.to(pointLight1.position, {
      x: 30,
      y: 20,
      z: 30,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(pointLight2.position, {
      x: -30,
      y: -20,
      z: -30,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Animation loop - optimized and pausable
    const clock = new THREE.Clock();
    let lastFrameTime = 0;
    const targetFPS = perfConfig.reduceAnimations ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      // Only render if visible and enough time has passed
      if (!isVisible) {
        requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - lastFrameTime;
      if (elapsed < frameInterval) {
        requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime - (elapsed % frameInterval);

      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.03;

      // Mouse parallax effect - reduced on low-end
      const parallaxIntensity = perfConfig.reduceAnimations ? 1 : 2;
      camera.position.x = mouse.x * parallaxIntensity;
      camera.position.y = mouse.y * parallaxIntensity;
      camera.lookAt(0, 0, 0);

      // Wave effect for particles - skip on low-end for performance
      if (!perfConfig.reduceAnimations) {
        const positions = particlesMesh.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particlesCount; i++) {
          const i3 = i * 3;
          const x = positions[i3];
          positions[i3 + 1] = Math.sin(elapsedTime + x * 0.1) * 2;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate(0);

    // Handle resize - debounced
    const handleResize = throttle(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250);
    window.addEventListener("resize", handleResize);

    // Intersection Observer to pause when off-screen
    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    
    if (observer && mountRef.current) {
      observer.observe(mountRef.current);
    }

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (observer && mountRef.current) {
        observer.unobserve(mountRef.current);
        observer.disconnect();
      }
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [threeLoaded, isVisible]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
      }}
    />
  );
}
