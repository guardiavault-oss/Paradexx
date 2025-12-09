/**
 * OptimizedImage Component
 * Provides WebP with PNG fallback, responsive images, and lazy loading
 */

import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'loading'> {
  src: string; // Base filename without extension (e.g., 'logo' instead of 'logo.png')
  alt: string;
  className?: string;
  priority?: boolean; // If true, loads immediately (no lazy loading)
  sizes?: string; // Responsive sizes attribute
  aspectRatio?: string; // CSS aspect-ratio for placeholder
  width?: number; // Explicit width for CLS prevention
  height?: number; // Explicit height for CLS prevention
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  aspectRatio,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Generate src paths
  const basePath = src.startsWith('/') ? src : `/${src}`;
  const optimizedBase = `/optimized${basePath}`;

  // Generate srcset for responsive images
  const webpSrcSet = [
    `${optimizedBase}-320w.webp 320w`,
    `${optimizedBase}-768w.webp 768w`,
    `${optimizedBase}-1024w.webp 1024w`,
    `${optimizedBase}-1920w.webp 1920w`,
  ].join(', ');

  const pngSrcSet = [
    `${optimizedBase}-320w.png 320w`,
    `${optimizedBase}-768w.png 768w`,
    `${optimizedBase}-1024w.png 1024w`,
    `${optimizedBase}-1920w.png 1920w`,
  ].join(', ');

  // Fallback to original if optimized versions don't exist
  const fallbackSrc = `${basePath}.png`;
  const fallbackWebp = `${optimizedBase}.webp`;
  const fallbackPng = `${optimizedBase}-optimized.png`;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      onClick={props.onClick}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Optimized Image with WebP + PNG fallback */}
      {isInView && (
        <picture>
          {/* WebP source with responsive sizes */}
          <source
            srcSet={webpSrcSet}
            sizes={sizes}
            type="image/webp"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
          {/* PNG fallback with responsive sizes */}
          <source
            srcSet={pngSrcSet}
            sizes={sizes}
            type="image/png"
          />
          {/* Fallback img element */}
          <img
            ref={imgRef}
            src={hasError ? fallbackSrc : fallbackWebp}
            alt={alt}
            {...props}
            {...(width && height ? { width, height } : {})}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              // Try PNG fallback
              if (imgRef.current) {
                imgRef.current.src = fallbackPng;
              }
            }}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <span className="text-xs text-slate-400">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

/**
 * Simple optimized image component without responsive sizes
 * Use this for icons, logos, etc.
 */
export function SimpleOptimizedImage({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
  ...props
}: Omit<OptimizedImageProps, 'sizes'>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const basePath = src.startsWith('/') ? src : `/${src}`;
  const optimizedBase = `/optimized${basePath}`;
  const fallbackSrc = `${basePath}.png`;
  const fallbackWebp = `${optimizedBase}.webp`;
  const fallbackPng = `${optimizedBase}-optimized.png`;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 animate-pulse"
          aria-hidden="true"
        />
      )}

      {isInView && (
        <picture>
          <source
            srcSet={fallbackWebp}
            type="image/webp"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
          <img
            src={hasError ? fallbackSrc : fallbackPng}
            alt={alt}
            {...props}
            {...(width && height ? { width, height } : {})}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              if (imgRef.current) {
                (imgRef.current as HTMLImageElement).src = fallbackPng;
              }
            }}
          />
        </picture>
      )}
    </div>
  );
}

