import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MiniLineChartProps {
  data: number[];
  change: number;
  color?: string;
  width?: number;
  height?: number;
}

export function MiniLineChart({ data, change, color, width = 80, height = 30 }: MiniLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPositive = change >= 0;
  const chartColor = color || (isPositive ? '#10B981' : '#EF4444');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Prepare data
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Generate points
    const points: [number, number][] = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return [x, y];
    });

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${chartColor}40`);
    gradient.addColorStop(1, `${chartColor}00`);

    ctx.beginPath();
    ctx.moveTo(points[0][0], height);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(points[points.length - 1][0], height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.strokeStyle = chartColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw arrowhead at the end
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    
    const angle = Math.atan2(
      lastPoint[1] - secondLastPoint[1],
      lastPoint[0] - secondLastPoint[0]
    );
    
    const arrowSize = 6;
    ctx.beginPath();
    ctx.moveTo(lastPoint[0], lastPoint[1]);
    ctx.lineTo(
      lastPoint[0] - arrowSize * Math.cos(angle - Math.PI / 6),
      lastPoint[1] - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(lastPoint[0], lastPoint[1]);
    ctx.lineTo(
      lastPoint[0] - arrowSize * Math.cos(angle + Math.PI / 6),
      lastPoint[1] - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = chartColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw endpoint dot
    ctx.beginPath();
    ctx.arc(lastPoint[0], lastPoint[1], 3, 0, Math.PI * 2);
    ctx.fillStyle = chartColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [data, chartColor, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="inline-block"
      style={{ opacity: 1 }}
    />
  );
}
