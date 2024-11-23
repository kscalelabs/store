import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

import Spinner from "../ui/Spinner";

interface RegisterRobotModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export function RegisterRobotModal({
  isOpen,
  onClose,
  listingId,
}: RegisterRobotModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const navigate = useNavigate();

  const handleAdd = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await auth.client.POST("/robots/create", {
        body: {
          listing_id: listingId,
          name,
          description,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert("Robot registered successfully", "success");
        navigate(ROUTES.TERMINAL.WITH_ID.buildPath({ id: data.robot_id }));
      }
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="sm:max-w-[425px]"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Create New Robot Instance
        </h2>

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
        </div>

        <div className="mt-6">
          <Button
            onClick={handleAdd}
            disabled={!name || isLoading}
            variant="outline"
            className="w-full flex items-center justify-center"
          >
            {isLoading ? (
              <Spinner className="mr-2" />
            ) : (
              <FaPlus className="mr-2 h-4 w-4" />
            )}
            <span>{isLoading ? "Registering..." : "Register Robot"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
