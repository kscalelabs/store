import React from "react";

import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const selectVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        outline: "border-2",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-11 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface SelectProps<T extends React.Key>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  options: { value: T; label: string }[];
  variant?: "default" | "outline";
}

// eslint-disable-next-line react/display-name
const Select = React.forwardRef<HTMLSelectElement, SelectProps<React.Key>>(
  ({ className, options, variant = "default", size, ...props }, ref) => {
    return (
      <select
        className={cn(selectVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
) as <T extends React.Key>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLSelectElement> },
) => React.ReactElement;

const SelectComponent = Select as unknown as {
  displayName: string;
  (props: SelectProps<React.Key>): React.ReactElement;
};
SelectComponent.displayName = "Select";

export { SelectComponent as Select, selectVariants };
