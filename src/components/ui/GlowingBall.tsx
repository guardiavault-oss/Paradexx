import { useEffect, useRef } from "react";
import * as THREE from "../../utils/three";

interface GlowingBallProps {
  className?: string;
  type?: "degen" | "regen";
}

export function GlowingBall({ className = "", type = "regen" }: GlowingBallProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let particleMesh: THREE.Points;
    let animationId: number;

    const mouse = new THREE.Vector2(0, 0);
    const targetRotation = new THREE.Vector2(0, 0);
    const currentRotation = new THREE.Vector2(0, 0);
    let mouseSpeed = 0;
    let lastMousePosition = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    const cameraDistance = 7;

    // Shaders
    const particleVertexShader = `
        attribute float size;
        attribute float randomVal;
        attribute float phase;
        varying vec3 vPosition;
        varying float vIntensity;
        varying float vRandom;
        varying float vPhase;
        uniform float time;
        uniform vec2 mouse;
        uniform float mouseInfluence;
        uniform mat4 projectionMatrixInverse;
        void main() {
            vRandom = randomVal;
            vPhase = phase;
            vec3 pos = position;
          
            float angle1 = time * 0.12 + randomVal * 3.14;
            float angle2 = time * 0.08 - randomVal * 2.0;
          
            mat2 rotationMatrix1 = mat2(cos(angle1), -sin(angle1), sin(angle1), cos(angle1));
            mat2 rotationMatrix2 = mat2(cos(angle2), -sin(angle2), sin(angle2), cos(angle2));
          
            pos.xz = rotationMatrix1 * pos.xz;
            pos.xy = rotationMatrix2 * pos.xy;
          
            float wave1 = sin(pos.x * 1.8 + time * 0.9 + phase) * cos(pos.y * 1.6 + time * 0.7 + phase) * sin(pos.z * 1.7 + time * 0.8 + phase) * 0.4;
          
            float wave2 = sin(pos.x * 3.2 - time * 1.2) * cos(pos.y * 3.0 - time * 1.0) * sin(pos.z * 3.1 - time * 1.1) * 0.2;
          
            float wave3 = sin(length(pos) * 2.5 - time * 1.5 + phase * 2.0) * 0.15;
            float wave4 = cos(pos.x * 4.0 + time * 0.8 + randomVal * 5.0) * sin(pos.z * 3.5 - time * 0.9) * 0.1;
          
            vec3 mouseProjectedPos = vec3(mouse.x * 5.0, mouse.y * 5.0, 0.0);
            float dist = length(pos - mouseProjectedPos);
          
            float ripple = sin(dist * 3.5 - time * 6.5) * 1.0;
            ripple *= smoothstep(4.5, 0.2, dist);
            ripple += cos(dist * 2.2 - time * 4.0) * 0.4 * smoothstep(3.0, 0.5, dist);
          
            vec3 pullDir = normalize(mouseProjectedPos - pos + 0.0001);
            float pullStrengthBase = smoothstep(4.0, 0.0, dist) * 0.8;
            float oscillation = sin(time * 2.0 + dist * 2.0) * 0.5 + 0.5;
            float pullStrength = mix(pullStrengthBase * 0.6, -pullStrengthBase * 1.0,
                                    smoothstep(0.3, 1.0, oscillation));
          
            float breathe = sin(time * 0.5 + randomVal * 6.28) * 0.08 + 1.0;
            pos *= breathe;
          
            pos += normal * (wave1 + wave2 + wave3 + wave4) * 0.2;
            pos += normal * ripple * 0.8;
            pos += pullDir * pullStrength;
          
            vPosition = pos;
          
            float waveIntensity = abs(wave1) * 1.5 + abs(wave2) * 1.0 + abs(wave3) * 2.0 + abs(wave4) * 1.8;
            float rippleIntensity = abs(ripple) * 1.2;
            float distanceIntensity = (1.0 - smoothstep(0.0, 4.0, length(position))) * 0.6;
          
            vIntensity = clamp(waveIntensity + rippleIntensity + distanceIntensity, 0.0, 1.0);
          
            vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;
          
            float sizeFactor = (180.0 / -modelViewPosition.z);
            gl_PointSize = size * sizeFactor * (0.3 + vIntensity * 0.7);
            gl_PointSize += 2.0 + mouseInfluence * 3.5;
            gl_PointSize *= (0.7 + randomVal * 0.6);
            gl_PointSize *= (1.0 + sin(time * 1.5 + phase * 6.28) * 0.2);
            gl_PointSize = max(0.5, gl_PointSize);
        }
    `;

    const particleFragmentShader = `
        varying vec3 vPosition;
        varying float vIntensity;
        varying float vRandom;
        varying float vPhase;
        uniform float time;
        uniform vec2 mouse;
      
        vec3 colorDeepBlue = vec3(0.02, 0.08, 0.25);
        vec3 colorElectricBlue = vec3(0.15, 0.45, 0.9);
        vec3 colorCyan = vec3(0.3, 0.9, 1.0);
        vec3 colorPurple = vec3(0.6, 0.2, 0.9);
        vec3 colorMagenta = vec3(1.0, 0.3, 0.7);
        vec3 colorWhite = vec3(1.0, 1.0, 1.0);
      
        void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;
          
            float circleSoftness = smoothstep(0.5, 0.2, dist);
          
            float timeFactor = sin(time * 0.4 + vPhase * 6.28) * 0.5 + 0.5;
            float timeFactor2 = cos(time * 0.3 - vRandom * 3.14) * 0.5 + 0.5;
          
            vec3 layer1 = mix(colorDeepBlue, colorElectricBlue, vIntensity * 1.3);
            vec3 layer2 = mix(colorElectricBlue, colorCyan, timeFactor);
            vec3 layer3 = mix(colorPurple, colorMagenta, timeFactor2);
          
            vec3 baseColor = mix(layer1, layer2, smoothstep(0.2, 0.6, vIntensity));
            baseColor = mix(baseColor, layer3, smoothstep(0.5, 0.9, vIntensity) * 0.6);
          
            vec3 mouseProjectedPos = vec3(mouse.x * 5.0, mouse.y * 5.0, 0.0);
            float distToMouse = length(vPosition - mouseProjectedPos);
            float proximityInfluence = smoothstep(4.0, 0.5, distToMouse);
          
            float highlightFactor = smoothstep(0.5, 1.0, vIntensity * (1.0 + proximityInfluence * 0.1));
            // Dimmed highlight
            vec3 highlightColor = mix(baseColor, colorWhite, highlightFactor * 0.4);
          
            float glow = pow(vIntensity * (0.3 + proximityInfluence * 0.1), 2.5);
            vec3 glowColor = mix(colorCyan, colorMagenta, sin(time * 0.5 + vPhase) * 0.5 + 0.5);
            // Dimmed glow
            vec3 finalColor = highlightColor + glowColor * glow * 0.1;
          
            float core = smoothstep(0.5, 0.1, dist) * (0.4 + vIntensity * 0.4);
            // Dimmed core
            finalColor += colorWhite * core * 0.05;
          
            float distToCenter = length(vPosition);
            float alpha = smoothstep(3.5, 1.0, distToCenter);
            alpha *= circleSoftness;
            alpha *= smoothstep(0.02, 0.4, vIntensity + proximityInfluence * 0.2) * 0.9 + 0.1;
          
            if (alpha < 0.01) discard;
          
            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    function init() {
      const container = containerRef.current;
      if (!container) return;

      const width = Math.max(container.clientWidth, 20);
      const height = Math.max(container.clientHeight, 20);

      scene = new THREE.Scene();
      
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 150);
      camera.position.z = cameraDistance;

      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // Transparent background
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Particle geometry
      const geometry = new THREE.IcosahedronGeometry(2.5, 8);
      const numParticles = geometry.attributes.position.count;
      const sizes = new Float32Array(numParticles);
      const randomVals = new Float32Array(numParticles);
      const phases = new Float32Array(numParticles);

      for (let i = 0; i < numParticles; i++) {
        sizes[i] = Math.random() * 0.7 + 0.3;
        randomVals[i] = Math.random();
        phases[i] = Math.random();
      }

      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("randomVal", new THREE.BufferAttribute(randomVals, 1));
      geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          mouse: { value: new THREE.Vector2(0, 0) },
          mouseInfluence: { value: 0.0 },
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });

      particleMesh = new THREE.Points(geometry, particleMaterial);
      scene.add(particleMesh);
    }

    function handleMouseMove(event: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      const dx = mouse.x - lastMousePosition.x;
      const dy = mouse.y - lastMousePosition.y;
      mouseSpeed = THREE.MathUtils.lerp(
        mouseSpeed,
        Math.sqrt(dx * dx + dy * dy) * 10,
        0.15
      );
      lastMousePosition.copy(mouse);

      targetRotation.y = mouse.x * 0.3;
      targetRotation.x = mouse.y * 0.3;
    }

    function animate() {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = clock.getDelta();

      // Update particle material
      if (particleMesh) {
        const particleMaterial = particleMesh.material as THREE.ShaderMaterial;
        particleMaterial.uniforms.time.value = elapsedTime;
        particleMaterial.uniforms.mouse.value.copy(mouse);

        let influence = particleMaterial.uniforms.mouseInfluence.value;
        influence += mouseSpeed * 2.5;
        influence = THREE.MathUtils.lerp(influence, 0, deltaTime * 2.0);
        const currentInfluence = Math.min(influence, 1.8);
        particleMaterial.uniforms.mouseInfluence.value = currentInfluence;

        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.04;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.04;
        particleMesh.rotation.x = currentRotation.x;
        particleMesh.rotation.y = currentRotation.y;

        particleMesh.position.y =
            Math.sin(elapsedTime * 0.3) * 0.15 + Math.cos(elapsedTime * 0.2) * 0.08;
        particleMesh.position.x = Math.sin(elapsedTime * 0.2) * 0.1;
      }

      mouseSpeed = THREE.MathUtils.lerp(mouseSpeed, 0, deltaTime * 5.0);
      
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      
      animationId = requestAnimationFrame(animate);
    }

    // Initialize
    init();
    
    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !renderer || !camera) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animate();

    // Event listeners
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (container) {
        resizeObserver.unobserve(container);
        container.removeEventListener("mousemove", handleMouseMove);
        if (renderer && renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
      if (renderer) renderer.dispose();
      if (scene) scene.clear();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: "transparent" }}
    />
  );
}