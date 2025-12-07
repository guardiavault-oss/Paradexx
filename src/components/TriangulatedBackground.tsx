import React, { useEffect, useRef } from 'react';

interface TriangulatedBackgroundProps {
  type?: 'degen' | 'regen';
}

const TriangulatedBackground: React.FC<TriangulatedBackgroundProps> = ({ type = 'degen' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    console.log('🌀 TriangulatedBackground: NEW VORTEX SHADER - Initializing with type:', type);
    console.log('🌀 Canvas dimensions:', canvas.width, 'x', canvas.height);

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader - Flowing noise with subtle tribe colors
    // Noise code from https://www.shadertoy.com/view/MtcGRl
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      
      vec2 GetGradient(vec2 intPos, float t) {
        float rand = fract(sin(dot(intPos, vec2(12.9898, 78.233))) * 43758.5453);
        float angle = 6.283185 * rand + 4.0 * t * rand;
        return vec2(cos(angle), sin(angle));
      }

      float Pseudo3dNoise(vec3 pos) {
        vec2 i = floor(pos.xy);
        vec2 f = pos.xy - i;
        vec2 blend = f * f * (3.0 - 2.0 * f);
        float noiseVal = 
          mix(
            mix(
              dot(GetGradient(i + vec2(0.0, 0.0), pos.z), f - vec2(0.0, 0.0)),
              dot(GetGradient(i + vec2(1.0, 0.0), pos.z), f - vec2(1.0, 0.0)),
              blend.x),
            mix(
              dot(GetGradient(i + vec2(0.0, 1.0), pos.z), f - vec2(0.0, 1.0)),
              dot(GetGradient(i + vec2(1.0, 1.0), pos.z), f - vec2(1.0, 1.0)),
              blend.x),
            blend.y
          );
        return noiseVal / 0.7; // normalize to about [-1..1]
      }

      // Color conversion from https://www.shadertoy.com/view/XljGzV
      vec3 hsl2rgb(in vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 uv = fragCoord.xy / ((max(iResolution.x, iResolution.y) / 10.0) + 800.0);
        
        float noiseValA = 0.5 + 0.5 * Pseudo3dNoise(vec3(uv.x * 2.6, uv.y * 2.6, iTime / 20.0));
        float noiseValB = 0.5 + 0.5 * Pseudo3dNoise(vec3(uv.x * 4.0, uv.y * 4.0, max(sin(noiseValA) * 2.0, 0.8) * 8.0 + iTime / 10.0));
        
        // Tribe-specific subtle colors on black
        ${type === 'degen' 
          ? `// Degen: Black background with red waves
        vec3 baseColor = vec3(0.0, 0.0, 0.0);
        vec3 waveColor = vec3(0.4, 0.0, 0.0); // Red for peaks
        // Use power function to make it mostly black, only showing color at peaks
        float intensity = pow(noiseValB, 3.0); // Sharper falloff
        vec3 col = mix(baseColor, waveColor, intensity);` 
          : `// Regen: Black background with blue waves
        vec3 baseColor = vec3(0.0, 0.0, 0.0);
        vec3 waveColor = vec3(0.0, 0.0, 0.4); // Blue for peaks
        // Use power function to make it mostly black, only showing color at peaks
        float intensity = pow(noiseValB, 3.0); // Sharper falloff
        vec3 col = mix(baseColor, waveColor, intensity);`}
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
      return;
    }

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return;
    }

    // Link program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    
    gl.useProgram(program);
    console.log('TriangulatedBackground: Shaders compiled and linked successfully');

    // Setup geometry
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
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');

    // Resize handler
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Render loop
    const render = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, currentTime);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    console.log('TriangulatedBackground: Render loop started');

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      console.log('TriangulatedBackground: Cleanup');
    };
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default TriangulatedBackground;