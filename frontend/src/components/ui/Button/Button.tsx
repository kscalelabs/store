import { forwardRef, useEffect, useRef, useState } from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent shadow hover:bg-accent/90 bg-blue-300 hover:bg-blue-400 dark:bg-blue-800 dark:hover:bg-blue-700",
        secondary:
          "bg-gray-200 dark:bg-gray-700 text-secondary-foreground shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600",
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 bg-red-500 hover:bg-red-600",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 bg-yellow-500 hover:bg-yellow-600",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-md",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

const ScrollableButton = ({ children, ...props }: ButtonProps) => {
  const codeRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [mouseOver, setMouseOver] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  useEffect(() => {
    const codeElement = codeRef.current;
    if (codeElement) {
      const isOverflow = codeElement.scrollWidth > codeElement.clientWidth;
      setIsOverflowing(isOverflow);
      setScrollWidth(codeElement.scrollWidth);
      setClientWidth(codeElement.clientWidth);
    }
  }, [children]);

  return (
    <Button {...props}>
      <div
        ref={codeRef}
        className="overflow-hidden"
        onMouseEnter={() => setMouseOver(true)}
        onMouseLeave={() => setMouseOver(false)}
      >
        <div
          className={isOverflowing && mouseOver ? "animate-scroll" : ""}
          style={{
            display: "inline-block",
            animation:
              isOverflowing && mouseOver
                ? `scroll ${(scrollWidth - clientWidth) / 50}s linear infinite`
                : "none",
          }}
        >
          {children}
        </div>
      </div>
    </Button>
  );
};

export { Button, ScrollableButton, buttonVariants };
