import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/types/api";
import { Save } from "lucide-react";

interface EditRobotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (
    robotId: string,
    robotData: {
      name: string;
      description: string | null;
      order_id?: string | null;
    },
  ) => Promise<void>;
  robot: {
    id: string;
    name: string;
    description: string | null | undefined;
    order_id?: string | null;
  };
}

export function EditRobotModal({
  isOpen,
  onClose,
  onEdit,
  robot,
}: EditRobotModalProps) {
  const [name, setName] = useState(robot.name);
  const [description, setDescription] = useState(robot.description || "");
  const [orderId, setOrderId] = useState(robot.order_id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(robot.name);
    setDescription(robot.description || "");
    setOrderId(robot.order_id || "");
  }, [robot]);

  const handleEdit = useCallback(async () => {
    if (name) {
      if (name.length > 32) {
        setError("Name must be 32 characters or less");
        return;
      }
      if (description && description.length > 2048) {
        setError("Description must be 2048 characters or less");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        await onEdit(robot.id, {
          name,
          description: description || null,
          order_id: orderId || null,
        });
        onClose();
      } catch (error) {
        console.error("Error editing robot:", error);
        if (error && typeof error === "object" && "detail" in error) {
          const apiError = error as ApiError;
          const errorMessage =
            typeof apiError.detail === "string"
              ? apiError.detail
              : apiError.detail?.[0]?.msg || "Unknown error";
          setError(errorMessage);
        } else {
          setError("Failed to edit robot. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [name, description, orderId, robot.id, onEdit, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="sm:max-w-[425px]"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Robot</h2>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-1">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
              maxLength={32}
            />
            <div className="text-xs text-gray-11 text-right">
              {name.length}/32 characters
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-1"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
              rows={3}
              maxLength={2048}
            />
            <div className="text-xs text-gray-11 text-right">
              {description.length}/2048 characters
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="orderId"
              className="text-sm font-medium text-gray-1"
            >
              Order ID (Optional)
            </Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleEdit}
            disabled={!name || isLoading}
            variant="default"
          >
            <Save className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
