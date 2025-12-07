'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

interface AnimatedShieldProps {
  mousePosition: { x: number; y: number }
}

export default function AnimatedShield({ mousePosition }: AnimatedShieldProps) {
  const shieldRef = useRef<SVGSVGElement>(null)
  const veinsRef = useRef<SVGPathElement[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (shieldRef.current) {
      // Rotate shield slowly
      gsap.to(shieldRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
      })

      // Pulse effect
      gsap.to(shieldRef.current, {
        scale: 1.1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      })
    }

    // Animate circuit veins
    veinsRef.current.forEach((vein, i) => {
      if (vein) {
        gsap.to(vein, {
          opacity: 0.8,
          duration: 1.5,
          delay: i * 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        })
      }
    })
  }, [])

  return (
    <motion.svg
      ref={shieldRef}
      viewBox="0 0 400 400"
      className="w-full h-full"
      style={{
        filter: 'drop-shadow(0 0 40px rgba(0, 212, 255, 0.5))',
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
      }}
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shield shape */}
      <path
        d="M200 50 L300 100 L300 200 Q300 250 250 280 L200 350 L150 280 Q100 250 100 200 L100 100 Z"
        fill="url(#shieldGradient)"
        filter="url(#glow)"
      />
      
      {/* Circuit veins */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * Math.PI / 180
        const startX = 200
        const startY = 200
        const endX = 200 + Math.cos(angle) * 120
        const endY = 200 + Math.sin(angle) * 120
        
        return (
          <motion.path
            key={i}
            ref={(el) => {
              if (el) veinsRef.current[i] = el
            }}
            d={`M ${startX} ${startY} L ${endX} ${endY}`}
            stroke="#00D4FF"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{
              duration: 2,
              delay: i * 0.15,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        )
      })}
    </motion.svg>
  )
}

