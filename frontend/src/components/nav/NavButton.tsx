import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface NavButtonProps {
  to: string;
  currentPath: string;
  children: React.ReactNode;
  isExternal?: boolean;
}

export const NavButton = ({
  to,
  currentPath,
  children,
  isExternal = false,
}: NavButtonProps) => {
  const isActive = currentPath.startsWith(to);

  if (isExternal) {
    return (
      <Button
        asChild
        variant="outline"
        className="px-2 xl:px-3 py-2 text-sm tracking-wide xl:tracking-widest text-gray-1"
      >
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          {children}
          <FaExternalLinkAlt className="h-3 w-3" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant={isActive ? "ghost" : "outline"}
      className={`px-3 py-2 text-gray-1 ${
        isActive ? "underline underline-offset-4 decoration-2" : ""
      }`}
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
};
