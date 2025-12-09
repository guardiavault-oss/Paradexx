import React, { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { logDebug, logError } from "@/utils/logger";

// GenerativeShieldR3F.js
// - Fixed React Three Fiber port of the generative icosahedron morphing into a shield
// - Camera drama + particle sparks when the shield deploys
// - All brackets and JSX elements properly closed

function useShieldGeometry(subdivisions = 5) {
  return useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(1.15, subdivisions);
    const pos = geom.attributes.position.array;
    const count = geom.attributes.position.count;
    const shield = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = pos[ix];
      const y = pos[ix + 1];
      const z = pos[ix + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      const rxy = Math.sqrt(nx * nx + ny * ny) + 1e-6;

      const topBias = Math.max(0, ny);
      const bottomBias = Math.max(0, -ny);
      const edgeRound = 0.7;

      const scaleXY = 1.0 + 0.8 * topBias * (1.0 - Math.pow(rxy, 1.2));
      const frontPush = (0.25 * (1.0 - Math.pow(rxy, edgeRound))) * (1.0 - bottomBias * 0.9);
      const bottomPinch = 1.0 - 0.7 * bottomBias;

      let sx = nx * (scaleXY * bottomPinch);
      let sy = ny * (1.0 + 0.35 * topBias - 0.25 * bottomBias);
      let sz = nz + frontPush;

      const shieldLen = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      const finalScale = len;
      sx = (sx / shieldLen) * finalScale;
      sy = (sy / shieldLen) * finalScale;
      sz = (sz / shieldLen) * finalScale;

      shield[ix] = sx;
      shield[ix + 1] = sy;
      shield[ix + 2] = sz;
    }

    const shieldAttr = new THREE.BufferAttribute(shield, 3);
    shieldAttr.name = "shieldPosition";
    geom.setAttribute("shieldPosition", shieldAttr);
    geom.computeVertexNormals();
    
    // Verify the attribute was set
    if (!geom.attributes.shieldPosition) {
      logError(new Error("Failed to set shieldPosition attribute"));
    }

    return geom;
  }, [subdivisions]);
}

function ShieldMesh({ morph }: { morph: number }) {
  const geom = useShieldGeometry(5);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const material = useMemo((): THREE.ShaderMaterial | null => {
    // Ensure the geometry has the shieldPosition attribute
    if (!geom) {
      logError(new Error("Shield geometry is null"));
      return null;
    }

    if (!geom.attributes.shieldPosition) {
      logError(new Error(`Shield geometry missing shieldPosition attribute. Available attributes: ${Object.keys(geom.attributes).join(', ')}`));
      return null;
    }

    logDebug(`Creating shield material with morph capability. ShieldPosition attribute count: ${geom.attributes.shieldPosition.count}`);
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        morph: { value: 0 }, // Start at 0, will be updated in useFrame
        pointLightPos: { value: new THREE.Vector3(0, 0, 5) },
        color: { value: new THREE.Color("#66d9ff") },
      },
      vertexShader: `
        attribute vec3 shieldPosition;
        uniform float time;
        uniform float morph;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec3 vViewNormal;

        void main(){
          vec3 blended = mix(position, shieldPosition, morph);
          float noiseFactor = (1.0 - morph) * 0.18;
          float n = sin((position.x + position.y + position.z) * 6.0 + time * 0.9) * 0.5
                  + sin((position.x - position.y) * 8.0 + time * 0.5) * 0.25;
          blended += normal * (n * noiseFactor);

          vec4 worldPosition = modelMatrix * vec4(blended, 1.0);
          vWorldPos = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          vec3 shieldDir = normalize(normalMatrix * (shieldPosition - position));
          vViewNormal = normalize(mix(vNormal, shieldDir, morph * 0.65));
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 pointLightPos;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec3 vViewNormal;

        void main(){
          vec3 N = normalize(vViewNormal);
          vec3 L = normalize(pointLightPos - vWorldPos);
          float diff = max(dot(N,L), 0.0);
          vec3 V = normalize(-vWorldPos);
          float fres = pow(1.0 - max(dot(N,V),0.0), 2.2);
          vec3 base = color * (0.25 + diff * 1.2);
          vec3 rim = color * fres * 0.9;
          float edge = smoothstep(0.0, 0.9, abs(N.z));
          vec3 final = mix(base, base * 1.1 + rim, 0.9 - edge * 0.35);
          gl_FragColor = vec4(final, 1.0);
        }
      `,
      transparent: true,
    });
  }, [geom]);

  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      materialRef.current.uniforms.morph.value = morph;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.0012;
    }
  });

  useEffect(() => {
    return () => {
      if (material) {
        material.dispose();
      }
    };
  }, [material]);

  if (!material) {
    return null; // Don't render if material creation failed
  }

  return <mesh ref={meshRef} geometry={geom} material={material} />;
}

function Sparks({ active, origin, count = 80 }: { active: boolean; origin: THREE.Vector3; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.7 + Math.random() * 1.6;
      velocities[i * 3 + 0] = Math.cos(theta) * Math.sin(phi) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 0.9 + 0.4;
      velocities[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * speed;
    }
    return { positions, velocities, life: new Float32Array(count).fill(0) };
  }, [count, origin]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(particles.positions, 3));
    return g;
  }, [particles.positions]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.03,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: "#66d9ff",
      }),
    []
  );

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = particles.positions;
    const vel = particles.velocities;
    const life = particles.life;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      if (active) {
        life[i] += delta;
      } else {
        life[i] += delta * 0.25;
      }

      vel[ix + 1] -= delta * 1.6;

      pos[ix + 0] += vel[ix + 0] * delta;
      pos[ix + 1] += vel[ix + 1] * delta;
      pos[ix + 2] += vel[ix + 2] * delta;

      if (life[i] > 1.8) {
        life[i] = 0;
        pos[ix + 0] = origin.x;
        pos[ix + 1] = origin.y;
        pos[ix + 2] = origin.z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.7 + Math.random() * 1.6;
        vel[ix + 0] = Math.cos(theta) * Math.sin(phi) * speed;
        vel[ix + 1] = Math.cos(phi) * speed * 0.9 + 0.4;
        vel[ix + 2] = Math.sin(theta) * Math.sin(phi) * speed;
      }
    }

    if (pointsRef.current && pointsRef.current.geometry && pointsRef.current.geometry.attributes.position) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      if (geo) {
        geo.dispose();
      }
      if (mat) {
        mat.dispose();
      }
    };
  }, [geo, mat]);

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

function CameraDrama({ deploying }: { deploying: boolean }) {
  const { camera } = useThree();
  const targetDefault = useMemo(() => new THREE.Vector3(0, 0, 3.2), []);
  const targetZoomed = useMemo(() => new THREE.Vector3(0, 0.15, 2.0), []);

  useFrame(() => {
    const target = deploying ? targetZoomed : targetDefault;
    camera.position.lerp(target, 0.08);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function GenerativeShieldR3F({ initialShield = false }: { initialShield?: boolean }) {
  const [morph, setMorph] = useState(initialShield ? 1 : 0);
  const [deploying, setDeploying] = useState(initialShield);
  const [sparkActive, setSparkActive] = useState(false);
  const sparkOrigin = useMemo(() => new THREE.Vector3(0, 0, 0.6), []);

  // Debug: log morph value changes
  useEffect(() => {
    logDebug(`Shield morph value: ${morph}`);
  }, [morph]);

  const toggle = () => {
    const from = morph;
    const to = morph > 0.5 ? 0 : 1;
    const duration = 800;
    const start = performance.now();

    function frame() {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const val = from + (to - from) * eased;
      setMorph(val);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        setMorph(to);
        setDeploying(to === 1);
        setSparkActive(to === 1);
        if (to === 1) {
          setTimeout(() => setSparkActive(false), 1200);
        }
      }
    }

    requestAnimationFrame(frame);
  };

  // Auto-deploy shield on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (morph < 0.1) {
        // Animate from 0 to 1
        const duration = 1200;
        const start = performance.now();
        const from = 0;
        const to = 1;

        function frame() {
          const now = performance.now();
          const t = Math.min(1, (now - start) / duration);
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const val = from + (to - from) * eased;
          setMorph(val);

          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            setMorph(1);
            setDeploying(true);
            setSparkActive(true);
            setTimeout(() => setSparkActive(false), 1200);
          }
        }

        requestAnimationFrame(frame);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", touchAction: "none", pointerEvents: "none" }}>
      <Canvas 
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        style={{ touchAction: "none", pointerEvents: "none" }}
        gl={{ antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 5]} intensity={1.2} />
        <CameraDrama deploying={deploying} />
        <ShieldMesh morph={morph} />
        <Sparks active={sparkActive} origin={sparkOrigin} />
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  );
}

