import React from 'react';

interface SubtleGradientBackgroundProps {
  type: 'degen' | 'regen';
  className?: string;
}

export function SubtleGradientBackground({ type, className = '' }: SubtleGradientBackgroundProps) {
  const primaryColor = type === 'degen' ? '#DC143C' : '#00ADEF';
  
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(ellipse 800px 600px at 50% 0%, ${primaryColor}25 0%, transparent 50%),
          radial-gradient(ellipse 600px 400px at 50% 100%, ${primaryColor}15 0%, transparent 50%),
          linear-gradient(to bottom, #0a0a0a 0%, #000000 100%)
        `,
        zIndex: 0,
      }}
    />
  );
}

export default SubtleGradientBackground;