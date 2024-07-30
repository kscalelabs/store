import React from "react";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-xs text-red-500">{children}</div>;
};

export default ErrorMessage;
