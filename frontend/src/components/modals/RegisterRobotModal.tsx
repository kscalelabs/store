import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const { api } = useAuthentication();
  const navigate = useNavigate();

  const handleAdd = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await api.client.POST("/robots/create", {
        body: {
          name,
          description,
          listing_id: listingId,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert("Robot registered successfully", "success");
        navigate(ROUTES.TERMINAL.WITH_ID.buildPath({ id: data.id }));
      }
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Register New Robot</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-12">
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
              className="text-sm font-medium text-gray-12"
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
        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={handleAdd}
            disabled={!name || isLoading}
            variant="default"
            className="flex items-center"
          >
            {isLoading ? (
              <Spinner className="mr-2" />
            ) : (
              <FaPlus className="mr-2 h-4 w-4" />
            )}
            <span className="mr-2">
              {isLoading ? "Registering..." : "Register Robot"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
