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
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type Order =
  paths["/orders/get_user_orders"]["get"]["responses"][200]["content"]["application/json"][0];

interface CancelOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onOrderUpdate: (updatedOrder: Order) => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  onOrderUpdate,
}) => {
  const { client } = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [cancellation, setCancellation] = useState({
    payment_intent_id: order["stripe_payment_intent_id"],
    cancel_reason: "",
    amount: order["amount"],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCancellation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      debugger;
      const { data, error } = await client.PUT("/stripe/refunds/{order_id}", {
        params: { path: { order_id: order.id } },
        body: cancellation,
      });

      if (error) {
        addErrorAlert("Failed to cancel the order");
        console.error("Error canceling order:", error);
      } else {
        addAlert("Order successfully canceled", "success");
        onOrderUpdate(data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancel_reason">Cancel Reason</Label>
              <Input
                id="cancel_reason"
                name="cancel_reason"
                value={cancellation.cancel_reason}
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

export default CancelOrderModal;
