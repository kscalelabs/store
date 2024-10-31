import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        `flex h-10 w-full rounded-md
        border border-input px-3 py-2 text-sm
        ring-offset-background file:border-0 bg-transparent
        file:text-sm file:font-medium
        placeholder:text-gray-10
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
        focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50
        focus:border-primary-9 focus:ring focus:ring-primary-9 focus:ring-opacity-50`,
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 bg-transparent file:text-sm file:font-medium placeholder:text-gray-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
TextArea.displayName = "TextArea";

export { Input, TextArea };
