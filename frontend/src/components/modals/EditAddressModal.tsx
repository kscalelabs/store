import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import type { OrderWithProduct } from "@/lib/types/orders";

interface EditAddressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithProduct;
  onOrderUpdate: (updatedOrder: OrderWithProduct) => void;
}

const EditAddressModal: React.FC<EditAddressModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  onOrderUpdate,
}) => {
  const { client } = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [address, setAddress] = useState({
    shipping_name: order.order.shipping_name || "",
    shipping_address_line1: order.order.shipping_address_line1 || "",
    shipping_address_line2: order.order.shipping_address_line2 || "",
    shipping_city: order.order.shipping_city || "",
    shipping_state: order.order.shipping_state || "",
    shipping_postal_code: order.order.shipping_postal_code || "",
    shipping_country: order.order.shipping_country || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await client.PUT(
        "/orders/{order_id}/shipping-address",
        {
          params: { path: { order_id: order.order.id } },
          body: address,
        },
      );

      if (error) {
        addErrorAlert("Failed to update delivery address");
        console.error("Error updating address:", error);
      } else {
        addAlert("Delivery address updated", "success");
        onOrderUpdate({
          order: data,
          product: order.product,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Edit Delivery Address</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shipping_name">Name</Label>
              <Input
                id="shipping_name"
                name="shipping_name"
                value={address.shipping_name}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_address_line1">Address Line 1</Label>
              <Input
                id="shipping_address_line1"
                name="shipping_address_line1"
                value={address.shipping_address_line1}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_address_line2">Address Line 2</Label>
              <Input
                id="shipping_address_line2"
                name="shipping_address_line2"
                value={address.shipping_address_line2}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_city">City</Label>
              <Input
                id="shipping_city"
                name="shipping_city"
                value={address.shipping_city}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_state">State</Label>
              <Input
                id="shipping_state"
                name="shipping_state"
                value={address.shipping_state}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_postal_code">Postal Code</Label>
              <Input
                id="shipping_postal_code"
                name="shipping_postal_code"
                value={address.shipping_postal_code}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_country">Country</Label>
              <Input
                id="shipping_country"
                name="shipping_country"
                value={address.shipping_country}
                onChange={handleInputChange}
                className="bg-gray-2 border-gray-3 text-gray-12"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-9 text-gray-1 hover:bg-gray-12"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAddressModal;
