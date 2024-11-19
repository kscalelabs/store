import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  size = "md",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-11 opacity-50"
        onClick={onClose}
      ></div>
      <div
        className={`bg-gray-12 text-gray-1 rounded-lg z-10 max-w-${size} w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
