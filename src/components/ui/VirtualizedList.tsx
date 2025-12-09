/**
 * VirtualizedList Component
 * High-performance windowed rendering with smooth animations
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | 'variable';
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => ReactNode;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  enterAnimation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scale';
  exitAnimation?: 'fadeOut' | 'slideDown' | 'slideRight' | 'scale';
  stickyHeader?: ReactNode;
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

export interface ItemBounds {
  index: number;
  offsetTop: number;
  height: number;
}

// ==============================================
// ANIMATION VARIANTS
// ==============================================

const enterVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

// ==============================================
// VIRTUALIZED LIST COMPONENT
// ==============================================

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  overscan = 3,
  className = '',
  renderItem,
  onScroll,
  onEndReached,
  endReachedThreshold = 100,
  enterAnimation = 'fadeIn',
  exitAnimation = 'fadeOut',
  stickyHeader,
  pullToRefresh = false,
  onRefresh,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const [itemBounds, setItemBounds] = useState<ItemBounds[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Touch coordinates for pull-to-refresh
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Measure item heights for variable height mode
  const measurementCache = useRef<Map<number, number>>(new Map());

  // Calculate total height
  const totalHeight =
    itemHeight === 'variable'
      ? itemBounds[itemBounds.length - 1]?.offsetTop +
          itemBounds[itemBounds.length - 1]?.height || 0
      : items.length * (itemHeight as number);

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    if (itemHeight === 'variable') {
      // Binary search for start and end indices
      let startIndex = 0;
      let endIndex = items.length - 1;

      for (let i = 0; i < itemBounds.length; i++) {
        if (itemBounds[i].offsetTop >= scrollTop - overscan * 100) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
      }

      for (let i = startIndex; i < itemBounds.length; i++) {
        if (
          itemBounds[i].offsetTop >=
          scrollTop + containerHeight + overscan * 100
        ) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
      }

      return { startIndex, endIndex };
    } else {
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / (itemHeight as number)) - overscan
      );
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / (itemHeight as number)) +
          overscan
      );
      return { startIndex, endIndex };
    }
  }, [
    scrollTop,
    containerHeight,
    itemHeight,
    overscan,
    items.length,
    itemBounds,
  ]);

  const { startIndex, endIndex } = getVisibleRange();

  // Initialize item bounds for variable height
  useEffect(() => {
    if (itemHeight === 'variable' && items.length > 0) {
      const bounds: ItemBounds[] = [];
      let offsetTop = 0;

      for (let i = 0; i < items.length; i++) {
        const cachedHeight = measurementCache.current.get(i) || 100; // Default height
        bounds.push({
          index: i,
          offsetTop,
          height: cachedHeight,
        });
        offsetTop += cachedHeight;
      }

      setItemBounds(bounds);
    }
  }, [items, itemHeight]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);

      // Check if near end
      if (
        onEndReached &&
        newScrollTop + containerHeight >= totalHeight - endReachedThreshold
      ) {
        onEndReached();
      }
    },
    [containerHeight, totalHeight, endReachedThreshold, onScroll, onEndReached]
  );

  // Pull to refresh handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!pullToRefresh || scrollTop > 0) return;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    },
    [pullToRefresh, scrollTop]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY.current);

      // Apply rubberband effect
      const rubberband = Math.min(distance / 2, 100);
      setPullDistance(rubberband);
    },
    [scrollTop]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (pullDistance > 50 && onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }

    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  // Measure item when it renders
  const handleItemRender = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (!element || itemHeight !== 'variable') return;

      const rect = element.getBoundingClientRect();
      const measuredHeight = rect.height;

      if (measurementCache.current.get(index) !== measuredHeight) {
        measurementCache.current.set(index, measuredHeight);

        // Update bounds
        setItemBounds((prev) => {
          const newBounds = [...prev];
          let offsetTop = 0;

          for (let i = 0; i < items.length; i++) {
            const height = measurementCache.current.get(i) || 100;
            newBounds[i] = { index: i, offsetTop, height };
            offsetTop += height;
          }

          return newBounds;
        });
      }
    },
    [itemHeight, items.length]
  );

  // Calculate item offset
  const getItemOffset = useCallback(
    (index: number): number => {
      if (itemHeight === 'variable') {
        return itemBounds[index]?.offsetTop || 0;
      }
      return index * (itemHeight as number);
    },
    [itemHeight, itemBounds]
  );

  // Render visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    const offset = getItemOffset(i);

    visibleItems.push(
      <motion.div
        key={i}
        ref={(el) => handleItemRender(i, el)}
        variants={enterVariants[enterAnimation]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${offset}px)`,
        }}
      >
        {renderItem(item, i)}
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: `${height}px` }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullToRefresh && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: `${pullDistance}px`,
            transform: `translateY(-${100 - pullDistance}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: pullDistance > 30 ? 1 : 0.5 }}
        >
          {isRefreshing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100" />
          ) : (
            <div className="text-sm text-gray-500">
              {pullDistance > 50 ? 'Release to refresh' : 'Pull to refresh'}
            </div>
          )}
        </motion.div>
      )}

      {/* Sticky header */}
      {stickyHeader && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
          {stickyHeader}
        </div>
      )}

      {/* Virtual scroll container */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <AnimatePresence mode="popLayout">{visibleItems}</AnimatePresence>
      </div>
    </div>
  );
}

// ==============================================
// INFINITE SCROLL WRAPPER
// ==============================================

export interface InfiniteScrollListProps<T>
  extends Omit<VirtualizedListProps<T>, 'items' | 'onEndReached'> {
  items: T[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loader?: ReactNode;
}

export function InfiniteScrollList<T>({
  items,
  hasMore,
  loadMore,
  loader,
  ...props
}: InfiniteScrollListProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEndReached = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    await loadMore();
    setIsLoading(false);
  }, [isLoading, hasMore, loadMore]);

  return (
    <div className="relative">
      <VirtualizedList
        items={items}
        onEndReached={handleEndReached}
        {...props}
      />
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-4">
          {loader || (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100" />
          )}
        </div>
      )}
    </div>
  );
}

// ==============================================
// EXPORTS
// ==============================================

export default VirtualizedList;
