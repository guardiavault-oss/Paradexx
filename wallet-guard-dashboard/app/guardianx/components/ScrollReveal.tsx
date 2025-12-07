'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  className?: string
}

export default function ScrollReveal({ 
  children, 
  direction = 'up', 
  delay = 0,
  className = '' 
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (ref.current && isInView) {
      const element = ref.current
      
      const directions = {
        up: { y: 50, x: 0 },
        down: { y: -50, x: 0 },
        left: { y: 0, x: 50 },
        right: { y: 0, x: -50 }
      }

      const dir = directions[direction]

      gsap.fromTo(
        element,
        { opacity: 0, x: dir.x, y: dir.y },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out'
        }
      )
    }
  }, [isInView, direction, delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

