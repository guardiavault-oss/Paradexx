'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface ParticleFieldProps {
  count?: number
  color?: string
}

export default function ParticleField({ count = 50, color = '#00D4FF' }: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const particles: HTMLDivElement[] = []

    // Create particles
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.style.position = 'absolute'
      particle.style.width = `${Math.random() * 4 + 1}px`
      particle.style.height = particle.style.width
      particle.style.backgroundColor = color
      particle.style.borderRadius = '50%'
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      particle.style.opacity = '0'
      
      containerRef.current.appendChild(particle)
      particles.push(particle)

      // Animate particle
      gsap.to(particle, {
        opacity: Math.random() * 0.5 + 0.3,
        y: `+=${Math.random() * 200 + 100}`,
        x: `+=${(Math.random() - 0.5) * 100}`,
        duration: Math.random() * 3 + 2,
        repeat: -1,
        ease: 'none',
        delay: Math.random() * 2
      })
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [count, color])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    />
  )
}

