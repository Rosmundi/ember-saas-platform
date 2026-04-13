import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "left" | "right" | "scale";
}

const directionStyles: Record<string, { hidden: string; visible: string }> = {
  up: {
    hidden: "translate-y-8 opacity-0",
    visible: "translate-y-0 opacity-100",
  },
  left: {
    hidden: "-translate-x-8 opacity-0",
    visible: "translate-x-0 opacity-100",
  },
  right: {
    hidden: "translate-x-8 opacity-0",
    visible: "translate-x-0 opacity-100",
  },
  scale: {
    hidden: "scale-95 opacity-0",
    visible: "scale-100 opacity-100",
  },
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: Props) {
  const { ref, isVisible } = useScrollReveal();
  const styles = directionStyles[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? styles.visible : styles.hidden,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
