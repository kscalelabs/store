import { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";

import { Button } from "@/components/ui/button";

export type ToastKind = "success" | "error" | "warning" | "info";

interface ToastIconProps {
  kind: ToastKind;
}

const ToastIcon = (props: ToastIconProps) => {
  const { kind } = props;

  switch (kind) {
    case "success":
      return <FaCheckCircle className="w-4 h-4 text-green-500" />;
    case "error":
      return <FaTimesCircle className="w-4 h-4 text-red-500" />;
    case "warning":
      return <FaExclamationCircle className="w-4 h-4 text-yellow-500" />;
    case "info":
      return <FaInfoCircle className="w-4 h-4 text-blue-500" />;
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
      className="flex items-center w-full p-4 rounded-lg shadow text-gray-11 bg-gray-2"
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        <ToastIcon kind={kind} />
      </div>
      <div className="ms-3 text-sm font-normal max-w-xs">{message}</div>
      <Button
        variant="ghost"
        className="ml-4 hover:bg-gray-11"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <FaTimes className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default Toast;
