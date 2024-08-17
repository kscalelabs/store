import { FaTimes } from "react-icons/fa";

import { cn } from "utils";

interface HeaderProps {
  title?: string;
  label?: string;
  onClosed?: () => void;
}

const Header = ({ title, label, onClosed }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-y-4">
      <h1 className={cn("text-3xl font-semibold")}>
        {title ?? "K-Scale Store"}
      </h1>
      {label && <p className="text-muted-foreground text-s,">{label}</p>}
      {onClosed && (
        <button
          onClick={onClosed}
          className="absolute top-0 right-0 p-4 text-gray-700"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Header;
