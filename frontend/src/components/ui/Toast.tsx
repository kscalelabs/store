import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaStopCircle,
  FaTimes,
} from "react-icons/fa";

interface Props {
  kind: "success" | "error" | "warning" | "info";
}

const ToastIcon = (props: Props) => {
  const { kind } = props;

  switch (kind) {
    case "success":
      return <FaCheckCircle className="w-4 h-4" />;
    case "error":
      return <FaStopCircle className="w-4 h-4" />;
    case "warning":
      return <FaExclamationCircle className="w-4 h-4" />;
    case "info":
      return <FaInfoCircle className="w-4 h-4" />;
  }
};

const Toast = (props: Props) => {
  return (
    <div
      className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-800 dark:text-blue-200">
        <ToastIcon {...props} />
      </div>
      <div className="ms-3 text-sm font-normal">Set yourself free.</div>
      <button
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        data-dismiss-target="#toast-default"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Toast;
