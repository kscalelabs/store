import { cn } from "utils";

interface HeaderProps {
  title?: string;
  label?: string;
}

const Header = ({ title, label }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-y-4">
      <h1 className={cn("text-3xl font-semibold")}>{title ?? "K-Scale Store"}</h1>
      {label && <p className="text-muted-foreground text-s,">{label}</p>}
    </div>
  );
};

export default Header;
