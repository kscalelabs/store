import React, { useState } from "react";

import AdminProcessPreorderModal from "@/components/modals/AdminProcessPreorderModal";
import AdminUpdateStatusModal from "@/components/modals/AdminUpdateStatusModal";
import CancelOrderModal from "@/components/modals/CancelOrderModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderWithProduct } from "@/lib/types/orders";
import { canModifyOrder } from "@/lib/utils/orders";

interface AdminManageOrderProps {
  order: OrderWithProduct;
  onOrderUpdate?: (updatedOrder: OrderWithProduct) => void;
}

const AdminManageOrder: React.FC<AdminManageOrderProps> = ({
  order,
  onOrderUpdate,
}) => {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);

  const handleOrderUpdate = (updatedOrder: OrderWithProduct) => {
    if (onOrderUpdate) {
      onOrderUpdate(updatedOrder);
    }
  };

  const showPreorderOption =
    order.order.preorder_deposit_amount &&
    order.order.status !== "awaiting_final_payment" &&
    order.order.status !== "cancelled" &&
    order.order.status !== "refunded";

  return (
    <div className="mb-4 p-2 bg-primary/10 rounded-md">
      <div className="flex justify-between items-center">
        <span className="text-primary font-semibold">Admin Controls</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-primary underline hover:text-primary/80 hover:underline-offset-2">
            Manage Order
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              disabled={!canModifyOrder(order)}
              onSelect={() => setIsStatusModalOpen(true)}
              className="cursor-pointer"
            >
              Change order status
            </DropdownMenuItem>
            {showPreorderOption && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <DropdownMenuItem
                  disabled={!canModifyOrder(order)}
                  onSelect={() => setIsPreorderModalOpen(true)}
                  className="cursor-pointer"
                >
                  Process pre-order
                </DropdownMenuItem>
              </>
            )}
            <div className="border-t border-gray-200 my-1"></div>
            <DropdownMenuItem
              disabled={!canModifyOrder(order)}
              onSelect={() => setIsCancelOrderModalOpen(true)}
              className="cursor-pointer"
            >
              Cancel order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AdminUpdateStatusModal
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        order={order}
        onOrderUpdate={handleOrderUpdate}
      />

      <AdminProcessPreorderModal
        isOpen={isPreorderModalOpen}
        onOpenChange={setIsPreorderModalOpen}
        order={order}
        onOrderUpdate={handleOrderUpdate}
      />

      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onOpenChange={setIsCancelOrderModalOpen}
        order={order}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default AdminManageOrder;
