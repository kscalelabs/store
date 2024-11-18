import React, { useState } from "react";

import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import type { OrderWithProduct } from "@/lib/types/orders";

type RefundRequest =
  paths["/stripe/refunds/{order_id}"]["put"]["requestBody"]["content"]["application/json"];

interface CancelOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithProduct;
  onOrderUpdate: (updatedOrder: OrderWithProduct) => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  onOrderUpdate,
}) => {
  const { client } = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const cancellationReasons = [
    "Found a better price",
    "Change of mind",
    "Item no longer needed",
    "Ordered by mistake",
    "Other",
  ];

  const MAX_REASON_LENGTH = 500;

  const [cancellation, setCancellation] = useState<RefundRequest>({
    payment_intent_id: order.order.stripe_payment_intent_id,
    cancel_reason: { reason: "", details: "" },
    amount:
      order.order.status === "preorder_placed" &&
      order.order.preorder_deposit_amount
        ? order.order.preorder_deposit_amount
        : order.order.price_amount,
  });
  const [customReason, setCustomReason] = useState("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setCancellation((prev) => ({
      ...prev,
      cancel_reason: {
        reason: value,
        details: value === "Other" ? customReason : "",
      },
    }));
  };

  const handleCustomReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;

    // Limit the input length
    if (value.length > MAX_REASON_LENGTH) {
      value = value.slice(0, MAX_REASON_LENGTH);
    }

    setCustomReason(value);
    setCancellation((prev) => ({
      ...prev,
      cancel_reason: {
        ...prev.cancel_reason,
        details: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await client.PUT("/stripe/refunds/{order_id}", {
        params: { path: { order_id: order.order.id } },
        body: cancellation,
      });

      if (error) {
        addErrorAlert("Failed to cancel the order");
        console.error("Error canceling order:", error);
      } else {
        addAlert("Order successfully canceled", "success");
        onOrderUpdate({
          order: data,
          product: order.product,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cancel Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 mb-4">
            <div className="grid gap-2">
              <Label htmlFor="cancel_reason">Reason for cancelling</Label>
              <select
                id="cancel_reason"
                name="cancel_reason"
                value={cancellation.cancel_reason.reason}
                onChange={handleSelectChange}
                className="bg-gray-2 border-gray-3 text-gray-12 rounded-md p-2"
              >
                <option value="" disabled>
                  Select a reason for cancelling
                </option>
                {cancellationReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {cancellation.cancel_reason.reason === "Other" && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customReason}
                    onChange={handleCustomReasonChange}
                    placeholder="Please specify"
                    maxLength={MAX_REASON_LENGTH}
                    className="bg-gray-2 border-gray-3 text-gray-12 rounded-md p-2 w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {MAX_REASON_LENGTH - customReason.length} characters
                    remaining
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="outline">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;
