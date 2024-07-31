import { Link } from "react-router-dom";
import { Button } from "./Button";

interface BackButtonProps {
  href: string;
  label: string;
}

const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Button variant="link" className="font-normal w-full" asChild>
      <Link to={href}>{label}</Link>
    </Button>
  );
};

export default BackButton;
