import React, { useState } from "react";

import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import type { OrderWithProduct } from "@/lib/types/orders";
import { OrderStatus, orderStatuses } from "@/lib/types/orders";
import { normalizeStatus } from "@/lib/utils/formatString";

interface AdminUpdateStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithProduct;
  onOrderUpdate: (updatedOrder: OrderWithProduct) => void;
}

const AdminUpdateStatusModal: React.FC<AdminUpdateStatusModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  onOrderUpdate,
}) => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [selectedStatus, setSelectedStatus] = useState(order.order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await auth.client.PUT(
        "/orders/admin/status/{order_id}",
        {
          params: {
            path: { order_id: order.order.id },
          },
          body: {
            status: selectedStatus,
          },
        },
      );

      if (error) {
        throw error;
      }

      onOrderUpdate({
        order: data,
        product: order.product,
      });

      addAlert("Order status updated successfully", "success");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      addErrorAlert("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)}>
      <div className="p-6 text-gray-1">
        <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Select New Status</Label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="bg-gray-2 border-gray-3 text-gray-12 rounded-md p-2"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {normalizeStatus(status)}
                </option>
              ))}
            </select>
          </div>

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
              onClick={handleUpdateStatus}
              disabled={isUpdating || selectedStatus === order.order.status}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AdminUpdateStatusModal;
