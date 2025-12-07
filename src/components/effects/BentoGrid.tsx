"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    initial?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
  columns = {
    initial: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
  },
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  const gridClass = cn(
    "grid gap-4",
    columns.initial &&
      gridCols[columns.initial as keyof typeof gridCols],
    columns.sm &&
      `sm:${gridCols[columns.sm as keyof typeof gridCols]}`,
    columns.md &&
      `md:${gridCols[columns.md as keyof typeof gridCols]}`,
    columns.lg &&
      `lg:${gridCols[columns.lg as keyof typeof gridCols]}`,
    columns.xl &&
      `xl:${gridCols[columns.xl as keyof typeof gridCols]}`,
  );

  return (
    <motion.div
      className={cn(gridClass, className)}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

BentoGrid.displayName = "BentoGrid";

export interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  colSpan?: {
    initial?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  rowSpan?: {
    initial?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  children,
  className,
  title,
  description,
  header,
  icon,
  colSpan,
  rowSpan,
}) => {
  const spanCols = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
  };

  const spanRows = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
  };

  const colSpanClass =
    colSpan &&
    cn(
      colSpan.initial &&
        spanCols[colSpan.initial as keyof typeof spanCols],
      colSpan.sm &&
        `sm:${spanCols[colSpan.sm as keyof typeof spanCols]}`,
      colSpan.md &&
        `md:${spanCols[colSpan.md as keyof typeof spanCols]}`,
      colSpan.lg &&
        `lg:${spanCols[colSpan.lg as keyof typeof spanCols]}`,
      colSpan.xl &&
        `xl:${spanCols[colSpan.xl as keyof typeof spanCols]}`,
    );

  const rowSpanClass =
    rowSpan &&
    cn(
      rowSpan.initial &&
        spanRows[rowSpan.initial as keyof typeof spanRows],
      rowSpan.sm &&
        `sm:${spanRows[rowSpan.sm as keyof typeof spanRows]}`,
      rowSpan.md &&
        `md:${spanRows[rowSpan.md as keyof typeof spanRows]}`,
      rowSpan.lg &&
        `lg:${spanRows[rowSpan.lg as keyof typeof spanRows]}`,
      rowSpan.xl &&
        `xl:${spanRows[rowSpan.xl as keyof typeof spanRows]}`,
    );

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-black/40 backdrop-blur-xl border border-white/10",
        "p-6 transition-all duration-300",
        "hover:bg-black/60 hover:border-white/20",
        colSpanClass,
        rowSpanClass,
        className,
      )}
      variants={staggerItemVariants}
      whileHover={{ y: -4 }}
    >
      {header && (
        <div className="mb-4 overflow-hidden rounded-xl">
          {header}
        </div>
      )}

      {(title || icon) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div className="flex-shrink-0 text-white/60 group-hover:text-white transition-colors">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              {title}
            </h3>
          )}
        </div>
      )}

      {description && (
        <p className="text-sm text-white/60 mb-4">
          {description}
        </p>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

BentoGridItem.displayName = "BentoGridItem";

// Preset bento layouts
export const BentoLayoutHero: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <BentoGrid columns={{ initial: 1, md: 3, lg: 4 }}>
      {childrenArray[0] && (
        <BentoGridItem
          colSpan={{ initial: 1, md: 2, lg: 2 }}
          rowSpan={{ initial: 1, md: 2 }}
        >
          {childrenArray[0]}
        </BentoGridItem>
      )}
      {childrenArray.slice(1).map((child, i) => (
        <React.Fragment key={i}>{child}</React.Fragment>
      ))}
    </BentoGrid>
  );
};

BentoLayoutHero.displayName = "BentoLayoutHero";

export const BentoLayoutMasonry: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <BentoGrid columns={{ initial: 1, sm: 2, md: 3, lg: 4 }}>
      {React.Children.map(children, (child, i) => {
        const patterns = [
          { col: 1, row: 1 },
          { col: 1, row: 2 },
          { col: 2, row: 1 },
          { col: 1, row: 1 },
        ];
        const pattern = patterns[i % patterns.length];

        return (
          <BentoGridItem
            colSpan={{ initial: 1, lg: pattern.col }}
            rowSpan={{ initial: 1, lg: pattern.row }}
          >
            {child}
          </BentoGridItem>
        );
      })}
    </BentoGrid>
  );
};

BentoLayoutMasonry.displayName = "BentoLayoutMasonry";