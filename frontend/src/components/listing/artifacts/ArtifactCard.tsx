import React from "react";
import { FaSpinner, FaTrash } from "react-icons/fa";

import { format } from "date-fns";

import { Button } from "components/ui/Button/Button";

interface ArtifactCardProps {
  name: string;
  description: string | null;
  timestamp: number;
  children: React.ReactNode;
  onDelete: () => void;
  canEdit: boolean;
  isDeleting: boolean;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({
  name,
  description,
  timestamp,
  children,
  onDelete,
  canEdit,
  isDeleting,
}) => {
  return (
    <div
      className={`bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col ${isDeleting ? "opacity-50" : ""}`}
    >
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 truncate flex-grow mr-2">
            {name}
          </h3>
          {canEdit && (
            <Button
              onClick={onDelete}
              variant="ghost"
              className="text-red-500 hover:text-red-700 flex-shrink-0"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTrash />
              )}
            </Button>
          )}
        </div>
        <div className="mb-2">{children}</div>
        {description && (
          <p className="text-sm text-gray-600 mb-2 break-words">
            {description}
          </p>
        )}
      </div>
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
        {format(new Date(timestamp * 1000), "PPpp")}
      </div>
    </div>
  );
};

export default ArtifactCard;
