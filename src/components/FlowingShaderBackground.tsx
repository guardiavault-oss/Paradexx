import { useEffect, useRef } from "react";

interface FlowingShaderBackgroundProps {
  className?: string;
}

export default function FlowingShaderBackground({ className = "" }: FlowingShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    gl.getExtension('OES_standard_derivatives');

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Nested Rotating Rounded Boxes with Glass Refraction
    // Created by David Gallardo - xjorma/2020
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      // Prism Break
      // an Alcatraz 4K intro
      // Jochen "Virgill" Feldkoetter
      // www.pouet.net/prod.php?which=65359

      int ef = 1; // Effect number (0=boxes, 1=menger sponge, 2=singlebox, 4=menger+box)
      float kl = 0.0;
      vec4 ot;

      //*****************************************************
      // Rotation functions
      //*****************************************************
      vec3 rotXaxis(vec3 p, float rad) {
          float z2 = cos(rad) * p.z - sin(rad) * p.y;
          float y2 = sin(rad) * p.z + cos(rad) * p.y;
          p.z = z2;
          p.y = y2;
          return p;
      }

      vec3 rotYaxis(vec3 p, float rad) {
          float x2 = cos(rad) * p.x - sin(rad) * p.z;
          float z2 = sin(rad) * p.x + cos(rad) * p.z;
          p.x = x2;
          p.z = z2;
          return p;
      }

      //*****************************************************
      // Random function
      //*****************************************************
      float rand1(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.98, 78.23))) * 43758.54);
      }

      //*****************************************************
      // SDF Box
      //*****************************************************
      float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
      }

      //*****************************************************
      // SDF Boxes
      //*****************************************************
      float Boxes(vec3 pos) {
          vec3 rok = vec3(0.35);
          float m;
          m = length(max(abs(rotYaxis(rotXaxis(pos + vec3(0.0, -0.3, 0.0), iTime * 0.3), iTime * 0.15)) - rok, 0.0)) - 0.03;
          m = min(m, length(max(abs(rotYaxis(rotXaxis(pos + vec3(0.0, -0.3, 1.2), iTime * 0.21), iTime * 0.24)) - rok, 0.0)) - 0.03);
          m = min(m, length(max(abs(rotYaxis(rotXaxis(pos + vec3(0.0, -0.3, -1.2), iTime * 0.2), iTime * 0.3)) - rok, 0.0)) - 0.03);
          m = min(m, length(max(abs(rotYaxis(rotXaxis(pos + vec3(1.2, -0.3, 0.0), iTime * 0.17), iTime * 0.26)) - rok, 0.0)) - 0.03);
          m = min(m, length(max(abs(rotYaxis(rotXaxis(pos + vec3(-1.2, -0.3, 0.0), iTime * 0.32), iTime * 0.2)) - rok, 0.0)) - 0.03);
          return m;
      }

      //*****************************************************
      // SDF Single Box
      //*****************************************************
      float Singlebox(vec3 pos) {
          return length(max(abs(rotXaxis(pos + vec3(0.0, -0.5, 0.0), iTime * 0.47)) - vec3(0.55 - 0.025 * (kl + 0.4) * sin(pos.z * pos.x * pos.y * 35.0)), 0.0)) - 0.025;
      }

      //*****************************************************
      // SDF Plane
      //*****************************************************
      float sdPlane(vec3 p) {
          return p.y + (0.005 * sin(p.x * 10.0)) + (0.005 * sin(p.z * 12.0)) + 0.4;
      }

      //*****************************************************
      // SDF Menger Sponge by IQ
      //*****************************************************
      float menger(vec3 pos) {
          float d = sdBox(pos, vec3(1.0));
          float s = 1.63 + 0.07 * sin(0.53 * iTime) - 0.3 * pos.y;
          for (int m = 0; m < 2; m++) {
              vec3 a = mod(pos * s, 2.0) - 1.0;
              s *= 3.0;
              vec3 r = abs(1.0 - 3.0 * abs(a)) - 0.025;
              float da = max(r.x, r.y);
              float db = max(r.y, r.z);
              float dc = max(r.z, r.x);
              float c = (min(da, min(db, dc)) - 1.0) / s;
              d = max(d, c);
          }
          return d;
      }

      //*****************************************************
      // Map function
      //*****************************************************
      float map(vec3 p) {
          float d, m;
          ot = vec4(length(p) - 0.8 * p.z, length(p) - 0.8 * p.y, length(p) - 0.8 * p.x, 0.0) * 0.8;
          d = sdPlane(p);

          if (ef == 0) m = Boxes(p);
          if (ef == 1 || ef == 3) m = menger(rotYaxis(p, 0.12 * iTime));
          if (ef == 2) m = Singlebox(p + 0.1 * kl * rand1(gl_FragCoord.xy + iTime));
          if (ef == 4) m = min(menger(rotYaxis(p, 0.1 * iTime)), sdBox(rotYaxis(rotXaxis(p + vec3(0.0, 0.2, 0.0), iTime), 0.2 * iTime), vec3(0.1, 0.1, 0.04) - 0.002 * sin(p.x * p.y * 440.0 + iTime)) - 0.01);
          return min(m, d);
      }

      //*****************************************************
      // Soft shadow by IQ
      //*****************************************************
      float softshadow(vec3 ro, vec3 rd) {
          float sh = 1.0;
          float t = 0.02;
          float h = 0.0;
          for (int i = 0; i < 23; i++) {
              if (t > 20.0) continue;
              h = map(ro + rd * t) + 0.003 * rand1(gl_FragCoord.xy + iTime);
              sh = min(sh, 4.0 * h / t);
              t += h;
          }
          return sh;
      }

      //*****************************************************
      // Normal calculation
      //*****************************************************
      vec3 calcNormal(vec3 p) {
          vec3 e = vec3(0.0001, 0.0, 0.0);
          if (ef == 1) e = vec3(0.01, 0.0, 0.0);
          return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
      }

      //*****************************************************
      // Orbit color cycling
      //*****************************************************
      vec3 cycle(vec3 c, float s) {
          float Cycles = 10.0;
          return vec3(0.5) + 0.5 * vec3(cos(s * Cycles + c.x), cos(s * Cycles + c.y), cos(s * Cycles + c.z));
      }

      vec3 getColor(int o) {
          vec4 Z = vec4(0.3, 0.5, 0.6, 0.2);
          vec4 Y = vec4(0.1, 0.5, 1.0, -0.5);
          vec4 X = vec4(0.7, 0.8, 1.0, 0.3);
          vec3 orbitColor = cycle(X.xyz, ot.x) * X.w * ot.x + cycle(Y.xyz, ot.y) * Y.w * ot.y + cycle(Z.xyz, ot.z) * Z.w * ot.z;
          if (orbitColor.x >= 4.0) orbitColor.x = 0.0;
          if (orbitColor.y >= 4.0) orbitColor.y = 0.0;
          if (orbitColor.z >= 4.0) orbitColor.z = 0.0;
          return clamp(3.0 * orbitColor, 0.0, 4.0);
      }

      //*****************************************************
      // Cast ray
      //*****************************************************
      float castRay(vec3 ro, vec3 rd, float maxt) {
          float precis = 0.001;
          float h = precis * 2.0;
          float t = 0.0;

          for (int i = 0; i < 130; i++) {
              if (abs(h) < precis || t > maxt) break;
              h = map(ro + rd * t);
              t += h;
          }
          return t;
      }

      //*****************************************************
      // Cast ray inside (for refraction)
      //*****************************************************
      float castRay2(vec3 ro, vec3 rd) {
          float precis = 0.2;
          float h = 0.0;
          float t = 0.01;

          for (int i = 0; i < 90; i++) {
              if (abs(h) > precis) break;
              h = map(ro + rd * t);
              t -= h;
          }
          return t;
      }

      //*****************************************************
      // Main Image
      //*****************************************************
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          // Blend for zoom effect
          float blend = min(2.0 * abs(sin((0.1 * iTime) * 3.1415 / 3.2)), 1.0);
          vec2 uv, p;

          // Zoom XY
          if (ef == 1 || ef == 3) {
              uv.x = 1.0 + (mod(gl_FragCoord.x - sin(iTime) * gl_FragCoord.y - (iResolution.x / 2.0), ((iResolution.x / 4.0) * (-1.5 * blend + 0.501) + (iResolution.x / 4.0))) - (1.0 * gl_FragCoord.x)) / iResolution.x;
              uv.y = 1.0 + (mod(gl_FragCoord.y + sin(iTime) * gl_FragCoord.x - (iResolution.y / 2.0), ((iResolution.y / 4.0) * (-1.5 * blend + 0.501) + (iResolution.y / 4.0))) - (1.0 * gl_FragCoord.y)) / iResolution.y;
          }

          // Zoom Y
          if (ef == 0 || ef == 2) {
              uv.x = 1.0 + (mod(gl_FragCoord.x - (iResolution.x / 2.0), ((iResolution.x / 4.0) * (-1.5 * blend + 0.501) + (iResolution.x / 4.0))) - 1.0 * gl_FragCoord.x) / iResolution.x;
              uv.y = 1.0 - (gl_FragCoord.y / iResolution.y);
          }
          
          p = (1.0 - uv) * 2.0 - 1.0;

          // Without effect
          if (ef == 4) {
              uv.xy = gl_FragCoord.xy / iResolution.xy;
              p = uv * 2.0 - 1.0;
          }

          p.x *= iResolution.x / iResolution.y;
          float theta = sin(iTime * 0.1) * 6.28;
          float x = 3.0 * cos(theta);
          float z = 3.0 * sin(theta);

          // Camera
          vec3 ro;
          if (ef == 0 || ef == 2) ro = vec3(x * 2.0, 2.0 + 2.0 * sin((iTime + 37.0) * 0.15), z * 1.4);
          if (ef == 1) ro = vec3(x * 0.2 + 1.0, 4.0, 0.6 * z - 3.0);
          if (ef == 4) ro = vec3(0.0, 0.3 + 0.10 * iTime, 0.001);
          if (ef == 3) ro = vec3(0.0, 36.0 - 0.24 * iTime, 0.001);
          
          vec3 cw = normalize(vec3(0.0, 0.25, 0.0) - ro);
          vec3 cp = vec3(0.0, 1.0, 0.0);
          vec3 cu = normalize(cross(cw, cp));
          vec3 cv = normalize(cross(cu, cw));
          vec3 rd = normalize(p.x * cu + p.y * cv + 7.5 * cw);

          // Render
          vec3 col = vec3(0.0);
          float t = castRay(ro, rd, 12.0);
          if (t >= 12.0) t = 12.0;
          vec3 pos = ro + rd * t;
          vec3 nor = calcNormal(pos);

          // Lightning
          vec3 ligvec = vec3(-0.5, 0.2, 0.5);
          if (ef == 4 || ef == 2 || ef == 1) ligvec = vec3(0.5 * sin(iTime * 0.2), 0.2, -0.5 * cos(iTime * 0.3));
          vec3 lig = normalize(ligvec);
          float dif = clamp(dot(lig, nor), 0.0, 1.0);
          float spec = pow(clamp(dot(reflect(rd, nor), lig), 0.0, 1.0), 16.0);
          vec3 color = (3.5 - 0.35 * t) * getColor(1);
          col = 0.3 * dif + 0.5 * color + spec;
          float sh = softshadow(pos, lig);
          col *= clamp(sh, 0.0, 1.0);

          // Reflection
          vec3 ro2r = pos - rd / t;
          vec3 rd2r = reflect(rd, nor);
          float t2r = castRay(ro2r, rd2r, 7.0);
          vec3 pos2r = vec3(0.0);
          pos2r = ro2r + rd2r * t2r;
          vec3 nor2r = calcNormal(pos2r);
          float dif2r = clamp(dot(lig, nor2r), 0.0, 1.0);
          float spec2r = pow(clamp(dot(reflect(rd2r, nor2r), lig), 0.0, 1.0), 16.0);
          col += 0.1 * (dif2r * color + spec2r);

          // Refraction (chromatic aberration)
          vec3 rd2 = refract(rd, nor, 0.78);
          float t2 = castRay2(pos, rd2);
          vec3 pos2 = pos + rd2 * t2;
          vec3 nor2 = calcNormal(pos2);
          float dif2 = clamp(dot(lig, nor2), 0.0, 1.0);
          col.r += 0.3 * dif2;

          rd2 = refract(rd, nor, 0.82);
          t2 = castRay2(pos, rd2);
          pos2 = pos + rd2 * t2;
          nor2 = calcNormal(pos2);
          dif2 = clamp(dot(lig, nor2), 0.0, 1.0);
          col.b += 0.3 * dif2;

          rd2 = refract(rd, nor, 0.8);
          t2 = castRay2(pos, rd2);
          pos2 = pos + rd2 * t2;
          nor2 = calcNormal(pos2);
          dif2 = clamp(dot(lig, nor2), 0.0, 1.0);
          float spec2 = pow(clamp(dot(reflect(rd2, nor2), lig), 0.0, 1.0), 16.0);
          col.g += 0.3 * dif2;
          col += 0.6 * spec2;

          // Refraction 2
          vec3 ro3 = pos2 + rd;
          vec3 rd3 = rd2 + 0.002 * rand1(gl_FragCoord.xy);
          float t3 = castRay(ro3, rd3, 10.0);
          if (t3 >= 10.0) t3 = 10.0;
          vec3 pos3 = ro3 + rd3 * t3;
          vec3 nor3 = calcNormal(pos3);
          float dif3 = clamp(dot(lig, -nor3), 0.0, 1.0);
          color = clamp(1.0 + (1.0 - 0.2 * t3) * getColor(1), 0.0, 8.0);
          col += 0.1 * dif3 * color;
          col += 0.04 * (1.0 - dif3) * color;

          col = mix(col, vec3(0.4, 0.5, 0.6), exp(-(2.0 - (0.18 * t))));

          // Post-processing
          vec2 uv2 = gl_FragCoord.xy / iResolution.xy;
          col -= 0.04 * rand1(uv2.xy * iTime);
          col *= 0.9 + 0.1 * sin(2.0 * uv2.y * iResolution.y);
          col -= 1.0 - dot(uv, 1.0 - uv) * 2.4;
          fragColor = vec4(col * blend, 1.0);
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

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
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
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}