import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3"
};

const variantClasses = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500"
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size = "md", variant = "default", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden rounded-full bg-secondary",
      sizeClasses[size],
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all",
        variantClasses[variant]
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Componente de progresso indeterminado
export function IndeterminateProgress({ 
  size = "md", 
  variant = "default", 
  className 
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}) {
  return (
    <div className={cn(
      "relative w-full overflow-hidden rounded-full bg-secondary",
      sizeClasses[size],
      className
    )}>
      <div 
        className={cn(
          "absolute h-full w-1/3 animate-pulse",
          variantClasses[variant]
        )}
        style={{
          animation: "indeterminate 2s infinite linear",
          background: `linear-gradient(90deg, transparent, currentColor, transparent)`
        }}
      />
      <style>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-indeterminate {
          animation: indeterminate 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export { Progress };
export default Progress;