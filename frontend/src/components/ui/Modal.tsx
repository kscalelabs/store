import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-1 opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-gray-2 rounded-lg z-10 max-w-md w-full">
        {children}
      </div>
    </div>
  );
};

export default Modal;
