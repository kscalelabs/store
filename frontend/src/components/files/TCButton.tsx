/* eslint-disable */
// @ts-nocheck
import { forwardRef } from "react";

const TCButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <button
      ref={ref}
      className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

TCButton.displayName = "TCButton";

export default TCButton;
