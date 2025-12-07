import { useEffect, useRef } from 'react';

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader with blur effect
    const fragmentShaderSource = `
      precision mediump float;
      uniform float iTime;
      uniform vec2 iResolution;

      // Noise function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      // Gaussian blur approximation
      vec3 blur(vec2 uv, float amount) {
        vec3 color = vec3(0.0);
        float total = 0.0;
        
        for(float x = -4.0; x <= 4.0; x++) {
          for(float y = -4.0; y <= 4.0; y++) {
            vec2 offset = vec2(x, y) * amount;
            float weight = exp(-(x*x + y*y) / 8.0);
            
            vec2 sampleUV = uv + offset / iResolution;
            
            // Generate animated gradient noise
            float n1 = fbm(sampleUV * 3.0 + iTime * 0.1);
            float n2 = fbm(sampleUV * 2.0 - iTime * 0.15);
            float n3 = fbm(sampleUV * 4.0 + vec2(iTime * 0.08, -iTime * 0.12));
            
            vec3 sampleColor = vec3(
              n1 * 0.05 + 0.02,
              n2 * 0.08 + 0.04,
              n3 * 0.06 + 0.03
            );
            
            color += sampleColor * weight;
            total += weight;
          }
        }
        
        return color / total;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution;
        
        // Create flowing effect
        vec2 distortedUV = uv + vec2(
          fbm(uv * 2.0 + iTime * 0.05) * 0.02,
          fbm(uv * 2.0 - iTime * 0.05) * 0.02
        );
        
        // Apply blur
        vec3 color = blur(distortedUV, 0.002);
        
        // Add subtle emerald tint
        color += vec3(0.0, 0.02, 0.015) * fbm(uv * 5.0 + iTime * 0.1);
        
        // Vignette effect
        float vignette = 1.0 - length(uv - 0.5) * 0.8;
        color *= vignette;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile shader
    function compileShader(source: string, type: number) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');

    // Resize canvas
    function resize() {
      if (!canvas) return;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl!.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    // Animation loop
    let animationFrameId: number;
    const startTime = Date.now();

    function render() {
      if (!canvas) return;
      
      resize();

      const currentTime = (Date.now() - startTime) / 1000;

      gl!.uniform1f(iTimeLocation, currentTime);
      gl!.uniform2f(iResolutionLocation, canvas.width, canvas.height);

      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    // Handle window resize
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (program) {
        gl.deleteProgram(program);
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#0a0a0a' }}
    />
  );
}