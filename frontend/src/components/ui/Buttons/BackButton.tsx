import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

const BackButton = ({ label, onClick }: BackButtonProps) => {
  return (
    <Button variant="link" className="font-normal w-full" onClick={onClick}>
      {label}
    </Button>
  );
};

export default BackButton;
