import { useEffect } from "react";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, registerPlugin } from "../lib/gsap-optimized";

registerPlugin(ScrollTrigger, "ScrollTrigger");

export function useTextReveal() {
  useEffect(() => {
    // Find all headers with the reveal-text class
    const reveals = document.querySelectorAll(".reveal-text");

    reveals.forEach((text) => {
      // Split text into words
      const words = text.textContent?.split(" ") || [];
      text.innerHTML = "";

      // Create span for each word
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.textContent = word;
        span.className = "reveal-word";
        span.style.display = "inline-block";
        span.style.opacity = "0.1";
        span.style.marginRight = "0.25em";
        text.appendChild(span);
      });

      // Get the section containing this text
      const section = text.closest(".reveal-section") || text.parentElement;

      // Create the reveal animation
      gsap.to(text.querySelectorAll(".reveal-word"), {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 20%",
          scrub: 1,
          // markers: true, // Uncomment for debugging
        },
      });
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
}

// Component version for individual text reveals
export function RevealText({
  children,
  className = "",
  pin = false,
  stagger = 0.1
}: {
  children: string;
  className?: string;
  pin?: boolean;
  stagger?: number;
}) {
  useEffect(() => {
    const element = document.getElementById(`reveal-${children.substring(0, 10)}`);
    if (!element) return;

    // Split text into words
    const words = children.split(" ");
    element.innerHTML = "";

    words.forEach((word) => {
      const span = document.createElement("span");
      span.textContent = word + " ";
      span.className = "reveal-word";
      span.style.display = "inline-block";
      span.style.opacity = "0.1";
      element.appendChild(span);
    });

    // Animate
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        end: pin ? `+=${window.innerHeight * 2}px` : "top 20%",
        scrub: true,
        pin: pin,
      },
    });

    tl.to(element.querySelectorAll(".reveal-word"), {
      opacity: 1,
      stagger: stagger,
      ease: "none",
    });

    return () => {
      ScrollTrigger.getById(`reveal-${children.substring(0, 10)}`)?.kill();
    };
  }, [children, pin, stagger]);

  return (
    <span
      id={`reveal-${children.substring(0, 10)}`}
      className={`reveal-text ${className}`}
    >
      {children}
    </span>
  );
}
