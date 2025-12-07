'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface GSAPScrollSectionProps {
  children: ReactNode
  className?: string
  trigger?: string
}

export default function GSAPScrollSection({ 
  children, 
  className = '',
  trigger = '.scroll-trigger'
}: GSAPScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return

    const section = sectionRef.current
    const elements = section.querySelectorAll(trigger)

    elements.forEach((element, i) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 100,
          scale: 0.8
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [trigger])

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  )
}

