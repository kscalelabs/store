import { useCallback, useEffect, useState } from "react";

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
import { ApiError } from "@/lib/types/api";
import { ExternalLink, Plus } from "lucide-react";

interface RegisterRobotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (robotData: {
    name: string;
    description: string | null;
    listing_id: string;
    order_id?: string | null;
  }) => Promise<void>;
  initialValues?: {
    order_id?: string;
    listing_id?: string;
  };
}

export function RegisterRobotModal({
  isOpen,
  onClose,
  onAdd,
  initialValues,
}: RegisterRobotModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listingId, setListingId] = useState(initialValues?.listing_id || "");
  const [orderId, setOrderId] = useState(initialValues?.order_id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.listing_id) setListingId(initialValues.listing_id);
      if (initialValues.order_id) setOrderId(initialValues.order_id);
    }
  }, [initialValues]);

  const resetModalData = useCallback(() => {
    setName("");
    setDescription("");
    setListingId("");
    setOrderId("");
  }, []);

  const handleAdd = useCallback(async () => {
    if (name && listingId) {
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
        await onAdd({
          listing_id: listingId,
          name,
          description: description || null,
          order_id: orderId || null,
        });
        resetModalData();
      } catch (error) {
        console.error("Error adding robot:", error);
        if (error && typeof error === "object" && "detail" in error) {
          const apiError = error as ApiError;
          const errorMessage =
            typeof apiError.detail === "string"
              ? apiError.detail
              : apiError.detail?.[0]?.msg || "Unknown error";
          setError(errorMessage);
        } else {
          setError("Failed to create robot. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [name, description, listingId, orderId, onAdd, resetModalData]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetModalData();
        }
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
          <div className="grid gap-2">
            <Label
              htmlFor="listingId"
              className="text-sm font-medium text-gray-12"
            >
              Listing ID
            </Label>
            <Input
              id="listingId"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="orderId"
              className="text-sm font-medium text-gray-12"
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
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => window.open("/browse", "_blank")}
            variant="default"
          >
            <span className="mr-2">Browse Listings</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!name || !listingId || isLoading}
            variant="primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="mr-2">
              {isLoading ? "Registering..." : "Register Robot"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
