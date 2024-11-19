import React, { useState } from "react";

import AdminManageOrder from "@/components/admin/AdminManageOrder";
import CancelOrderModal from "@/components/modals/CancelOrderModal";
import EditAddressModal from "@/components/modals/EditAddressModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderWithProduct } from "@/lib/types/orders";
import { activeStatuses, orderStatuses, redStatuses } from "@/lib/types/orders";
import { formatPrice } from "@/lib/utils/formatNumber";
import { normalizeStatus } from "@/lib/utils/formatString";
import { canModifyOrder } from "@/lib/utils/orders";

enum OrderStatus {
  PREORDER = -1,
  PROCESSING = 0,
  IN_DEVELOPMENT = 1,
  BEING_ASSEMBLED = 2,
  SHIPPED = 3,
  DELIVERED = 4,
}

const OrderCard: React.FC<{
  orderWithProduct: OrderWithProduct;
  isAdminView?: boolean;
}> = ({ orderWithProduct: initialOrderWithProduct, isAdminView }) => {
  const [orderWithProduct, setOrderWithProduct] = useState<OrderWithProduct>(
    initialOrderWithProduct,
  );
  const { order, product } = orderWithProduct;
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);

  const currentStatusIndex =
    order.status === "preorder_placed"
      ? OrderStatus.PREORDER
      : order.status === "awaiting_final_payment"
        ? OrderStatus.BEING_ASSEMBLED
        : OrderStatus[order.status.toUpperCase() as keyof typeof OrderStatus];
  const isRedStatus = redStatuses.includes(order.status);
  const showStatusBar = activeStatuses.includes(order.status);

  const getStatusColor = (status: string) => {
    if (isRedStatus) return "bg-red-500";
    if (activeStatuses.includes(status) || status === "delivered")
      return "bg-primary";
    return "bg-gray-300";
  };

  const getTextColor = (status: string) => {
    if (isRedStatus) return "text-red-600";
    if (activeStatuses.includes(status) || status === "delivered")
      return "text-primary";
    return "text-gray-600";
  };

  const unitPrice = order.price_amount / order.quantity;

  const handleOrderUpdate = (updatedOrder: OrderWithProduct) => {
    setOrderWithProduct(updatedOrder);
  };

  return (
    <div className="bg-gray-1 shadow-md rounded-lg p-4 md:p-6 w-full text-gray-12">
      {isAdminView ? (
        <AdminManageOrder
          order={orderWithProduct}
          onOrderUpdate={handleOrderUpdate}
        />
      ) : null}

      <h2 className="font-bold text-2xl mb-1">{product.name}</h2>
      <p className="text-gray-11 mb-1 sm:text-lg">
        Status:{" "}
        <span className={`font-semibold ${getTextColor(order.status)}`}>
          {normalizeStatus(order.status)}
        </span>
      </p>

      {order.status === "preorder_placed" && order.preorder_deposit_amount && (
        <div className="mb-4 p-3 bg-gray-4 text-gray-12 rounded-md">
          <p className="font-medium">
            Pre-order Deposit: {formatPrice(order.preorder_deposit_amount)}
          </p>
          <p className="font-medium mt-1">
            Amount Due:{" "}
            {formatPrice(order.price_amount - order.preorder_deposit_amount)}
          </p>
          {order.preorder_release_date && (
            <p className="text-sm mt-1">
              Expected Release:{" "}
              {new Date(
                order.preorder_release_date * 1000,
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {order.status === "refunded" && order.preorder_deposit_amount && (
        <div className="mb-4 p-3 bg-gray-4 text-gray-12 rounded-md">
          <p className="font-medium">
            Pre-order Deposit: {formatPrice(order.preorder_deposit_amount)}
          </p>
        </div>
      )}

      {order.status === "awaiting_final_payment" && (
        <div className="mb-4 p-3 bg-gray-4 text-gray-12 rounded-md">
          <p className="font-medium">
            Final Payment Required:{" "}
            {formatPrice(
              order.price_amount - (order.preorder_deposit_amount || 0),
            )}
          </p>
          <p className="text-sm mt-1">
            Please complete your final payment to proceed with order
            fulfillment.
          </p>
        </div>
      )}

      <div className="text-sm sm:text-base text-gray-11 flex flex-col mb-4">
        <p>Order ID: {order.id}</p>
        <div className="mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`underline ${
                !canModifyOrder(orderWithProduct)
                  ? "text-gray-11 cursor-not-allowed"
                  : "text-gray-12 cursor-pointer"
              }`}
              disabled={!canModifyOrder(orderWithProduct)}
            >
              Manage order
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                disabled={!canModifyOrder(orderWithProduct)}
                onSelect={() => setIsEditAddressModalOpen(true)}
                className="cursor-pointer"
              >
                Change delivery address
              </DropdownMenuItem>
              <div className="border-t border-gray-11 mx-1"></div>
              <DropdownMenuItem
                disabled={!canModifyOrder(orderWithProduct)}
                onSelect={() => setIsCancelOrderModalOpen(true)}
                className="cursor-pointer"
              >
                Cancel order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-gray-12">Quantity: {order.quantity}</p>
        <p>
          <span className="text-gray-12 font-medium">
            {formatPrice(order.price_amount)}
          </span>{" "}
          <span className="font-light">
            = {formatPrice(unitPrice)} x {order.quantity}
          </span>
        </p>
      </div>

      {showStatusBar && (
        <div className="mb-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              {orderStatuses.slice(0, 5).map((status, index) => (
                <div
                  key={status}
                  className="text-center flex flex-col items-center"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full mb-2 ${
                      index <= currentStatusIndex
                        ? getStatusColor(status)
                        : "bg-gray-300"
                    } text-gray-12`}
                  >
                    {index < currentStatusIndex ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      index <= currentStatusIndex
                        ? getTextColor(status)
                        : "text-gray-600"
                    } font-semibold`}
                  >
                    {normalizeStatus(status)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex mb-2">
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                {orderStatuses.slice(0, 5).map((status, index) => (
                  <div
                    key={status}
                    className={`h-full ${
                      index <= currentStatusIndex
                        ? getStatusColor(status)
                        : "bg-gray-300"
                    } ${
                      index === OrderStatus.PROCESSING ? "rounded-l-full" : ""
                    } ${
                      index === OrderStatus.DELIVERED ? "rounded-r-full" : ""
                    }`}
                    style={{
                      width: "20%",
                      float: "left",
                      marginRight: index < 4 ? "1px" : "0",
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isRedStatus && (
        <p className="text-red-600 font-semibold mb-4">
          This order has been {normalizeStatus(order.status)}.
        </p>
      )}

      <div className="mt-4 text-xs bg-gray-3 p-3 rounded-md text-gray-12">
        <h3 className="font-semibold">Shipping Address</h3>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_address_line1}</p>
        {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
        <p>{`${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`}</p>
        <p>{order.shipping_country}</p>
      </div>

      {product.images && product.images.length > 0 && (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-64 object-cover rounded-md mt-2"
        />
      )}

      <EditAddressModal
        isOpen={isEditAddressModalOpen}
        onOpenChange={setIsEditAddressModalOpen}
        order={orderWithProduct}
        onOrderUpdate={handleOrderUpdate}
      />
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onOpenChange={setIsCancelOrderModalOpen}
        order={orderWithProduct}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default OrderCard;
