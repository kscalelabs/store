import * as React from "react";

import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  size = "md",
}) => {
  const [visible, setVisible] = React.useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-1",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-1",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-1",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute w-max max-w-xs bg-gray-12 text-gray-1 rounded-md shadow-md z-50",
            positionClasses[position],
            sizeClasses[size],
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export { Tooltip };
