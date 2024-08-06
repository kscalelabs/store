import { Button } from "components/ui/Button/Button";
import { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";

export type ToastKind = "success" | "error" | "warning" | "info";

interface ToastIconProps {
  kind: ToastKind;
}

const ToastIcon = (props: ToastIconProps) => {
  const { kind } = props;

  switch (kind) {
    case "success":
      return <FaCheckCircle className="w-4 h-4" />;
    case "error":
      return <FaTimesCircle className="w-4 h-4" />;
    case "warning":
      return <FaExclamationCircle className="w-4 h-4" />;
    case "info":
      return <FaInfoCircle className="w-4 h-4" />;
  }
};

interface Props {
  kind: ToastKind;
  message: string | React.ReactNode;
  timeout?: number;
  onClose?: () => void;
}

const Toast = (props: Props) => {
  const { kind, message, timeout, onClose } = props;

  // Automatically close the toast after some interval.
  useEffect(() => {
    if (!timeout || !onClose) {
      return;
    }

    const timer = setTimeout(() => {
      onClose();
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [timeout, onClose]);

  return (
    <div
      className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-300 dark:bg-gray-800"
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-800 dark:text-blue-200">
        <ToastIcon kind={kind} />
      </div>
      <div className="ms-3 text-sm font-normal">{message}</div>
      <Button
        variant="ghost"
        className="ml-4 hover:bg-gray-200"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <FaTimes className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default Toast;
