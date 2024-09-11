import { ReactNode } from "react";

import { useScrollToTop } from "@/hooks/useScrollToTop";

interface ScrollToTopProps {
  children: ReactNode;
}

export function ScrollToTop({ children }: ScrollToTopProps) {
  useScrollToTop();
  return <>{children}</>;
}
