import React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps {
  shineColor?: string[];
  className?: string;
  children?: React.ReactNode;
  borderWidth?: string;
  isVisible?: boolean;
}

export function ShineBorder({
  shineColor = ["#A07CFE", "#FE8FB5", "#FFBE7B"],
  className,
  children,
  borderWidth = "1px",
  isVisible = true,
}: ShineBorderProps) {
  const gradientColors = shineColor.join(", ");

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
        className
      )}
      style={{
        background: `linear-gradient(45deg, ${gradientColors})`,
        backgroundSize: "200% 200%",
        animation: "shine 3s ease-in-out infinite",
        padding: borderWidth,
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shine {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `
      }} />
    </div>
  );
}

export default ShineBorder;