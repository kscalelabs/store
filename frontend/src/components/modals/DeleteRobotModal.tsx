import { useCallback, useState } from "react";
import { FaTrash } from "react-icons/fa";

import { SingleRobotResponse } from "@/components/terminal/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/types/api";

interface DeleteRobotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (robotId: string) => Promise<void>;
  robot: SingleRobotResponse;
}

export function DeleteRobotModal({
  isOpen,
  onClose,
  onDelete,
  robot,
}: DeleteRobotModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onDelete(robot.robot_id);
      onClose();
    } catch (error) {
      console.error("Error deleting robot:", error);
      if (error && typeof error === "object" && "detail" in error) {
        const apiError = error as ApiError;
        const errorMessage =
          typeof apiError.detail === "string"
            ? apiError.detail
            : apiError.detail?.[0]?.msg || "Unknown error";
        setError(errorMessage);
      } else {
        setError("Failed to delete robot. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [robot.robot_id, onDelete, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Delete Robot</DialogTitle>
          <DialogDescription className="text-gray-11">
            <div className="flex flex-col gap-2">
              <span>
                Are you sure you want to delete robot{" "}
                <span className="text-primary-9 font-medium">
                  &quot;{robot.name}&quot;
                </span>
                ? This action cannot be undone.
              </span>
              <span className="text-gray-11 font-light text-xs">
                Data associated with this robot will be deleted and no longer
                accessible.
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            <FaTrash className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Deleting..." : "Delete Robot"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
