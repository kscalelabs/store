import { FaCopy } from "react-icons/fa";

import { useAlertQueue } from "@/hooks/useAlertQueue";

import { Button } from "./button";

interface CopyableCodeProps {
  code: string;
  className?: string;
}

const CopyableCode = ({ code, className = "" }: CopyableCodeProps) => {
  const { addAlert, addErrorAlert } = useAlertQueue();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      addAlert("Code copied", "success");
    } catch (error) {
      addErrorAlert(error);
    }
  };

  return (
    <div className="relative group">
      <pre className={`${className} pr-12`}>{code}</pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <FaCopy className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default CopyableCode;
