import { cn } from "utils";

interface HeaderProps {
  label?: string;
}

const Header = ({ label }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-y-4">
      <h1 className={cn("text-3xl font-semibold")}>RoboList</h1>
      {label && <p className="text-muted-foreground text-s,">{label}</p>}
    </div>
  );
};

export default Header;
