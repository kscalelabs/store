import * as React from "react";

import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = React.useState(false);

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
            "absolute bottom-full mb-2 w-max max-w-xs px-2 py-1 bg-black text-white text-xs rounded-md shadow-md",
            "left-1/2 transform -translate-x-1/2",
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export { Tooltip };
