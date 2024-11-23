import React, { useState } from "react";

import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import type { OrderWithProduct } from "@/lib/types/orders";
import { formatPrice } from "@/lib/utils/formatNumber";

interface AdminProcessPreorderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithProduct;
  onOrderUpdate: (updatedOrder: OrderWithProduct) => void;
}

const AdminProcessPreorderModal: React.FC<AdminProcessPreorderModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  onOrderUpdate,
}) => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessPreorder = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await auth.client.POST(
        "/stripe/process/preorder/{order_id}",
        {
          params: {
            path: { order_id: order.order.id },
          },
        },
      );

      if (error) {
        throw error;
      }

      onOrderUpdate({
        ...order,
        order: {
          ...order.order,
          status: "awaiting_final_payment",
          final_payment_checkout_session_id: data.checkout_session.id,
        },
      });

      addAlert("Pre-order processed successfully", "success");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      addErrorAlert("Failed to process pre-order");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} size="xl">
      <div className="p-6 text-gray-1">
        <h2 className="text-xl font-semibold mb-4">Process Pre-order</h2>

        <div className="space-y-4">
          <p className="text-gray-6">
            Are you sure you want to process this pre-order? This will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-8 space-y-1">
            <li>Mark the order as ready for final payment</li>
            <li>
              Request customer to pay remaining balance of{" "}
              {formatPrice(
                order.order.price_amount -
                  (order.order.preorder_deposit_amount || 0),
              )}
            </li>
            <li>Notify the customer via email</li>
          </ul>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              onClick={handleProcessPreorder}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Pre-order"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AdminProcessPreorderModal;
