import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CancelOrderModal from "@/components/modals/CancelOrderModal";
import EditAddressModal from "@/components/modals/EditAddressModal";
import { RegisterRobotModal } from "@/components/modals/RegisterRobotModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ApiError } from "@/lib/types/api";
import { formatPrice } from "@/lib/utils/formatNumber";
import { normalizeStatus } from "@/lib/utils/formatString";
import { Bot, Plus } from "lucide-react";

type OrderWithProduct =
  paths["/orders/user-orders-with-products"]["get"]["responses"][200]["content"]["application/json"][0];

type Order =
  paths["/orders/user-orders"]["get"]["responses"][200]["content"]["application/json"][0];

type Robot =
  paths["/robots/check-order/{order_id}"]["get"]["responses"][200]["content"]["application/json"];

const orderStatuses = [
  "processing",
  "in_development",
  "being_assembled",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
];

const activeStatuses = [
  "processing",
  "in_development",
  "being_assembled",
  "shipped",
];
const redStatuses = ["cancelled", "refunded", "failed"];
const canModifyStatuses = ["processing", "in_development", "being_assembled"];

const OrderCard: React.FC<{ orderWithProduct: OrderWithProduct }> = ({
  orderWithProduct: initialOrderWithProduct,
}) => {
  const [orderWithProduct, setOrderWithProduct] = useState(
    initialOrderWithProduct,
  );
  const { order, product } = orderWithProduct;
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [isRegisterRobotModalOpen, setIsRegisterRobotModalOpen] =
    useState(false);
  const { api } = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [associatedRobot, setAssociatedRobot] = useState<Robot | null>(null);
  const navigate = useNavigate();

  const currentStatusIndex = orderStatuses.indexOf(order.status);
  const isRedStatus = redStatuses.includes(order.status);
  const showStatusBar = activeStatuses.includes(order.status);

  const getStatusColor = (status: string) => {
    if (isRedStatus) return "bg-red-500";
    if (activeStatuses.includes(status) || status === "delivered")
      return "bg-primary-9";
    return "bg-gray-300";
  };

  const getTextColor = (status: string) => {
    if (isRedStatus) return "text-red-600";
    if (activeStatuses.includes(status) || status === "delivered")
      return "text-primary-9";
    return "text-gray-600";
  };

  const unitPrice = order.amount / order.quantity;

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrderWithProduct((prev) => ({ ...prev, order: updatedOrder }));
  };

  const canModifyOrder = () => {
    return canModifyStatuses.includes(order.status);
  };

  const handleCreateRobot = async (robotData: {
    name: string;
    description: string | null;
    listing_id: string;
    order_id?: string | null;
  }) => {
    try {
      const { data, error } = await api.client.POST("/robots/create", {
        body: robotData,
      });

      if (error) {
        const errorMessage =
          typeof error.detail === "string"
            ? error.detail
            : error.detail?.[0]?.msg || "Unknown error";
        addErrorAlert(`Failed to create robot: ${errorMessage}`);
        throw error;
      }
      setAssociatedRobot(data);
      setIsRegisterRobotModalOpen(false);
      addAlert("Robot registered successfully!", "success");
    } catch (error) {
      console.error("Error creating robot:", error);
      if (error && typeof error === "object" && "detail" in error) {
        const apiError = error as ApiError;
        const errorMessage =
          typeof apiError.detail === "string"
            ? apiError.detail
            : apiError.detail?.[0]?.msg || "Unknown error";
        throw new Error(errorMessage);
      }
      throw new Error("Failed to create robot. Please try again.");
    }
  };

  useEffect(() => {
    const checkForRobot = async () => {
      try {
        const { data: robot } = await api.client.GET(
          `/robots/check-order/{order_id}`,
          { params: { path: { order_id: order.id } } },
        );
        setAssociatedRobot(robot || null);
      } catch (error) {
        console.error("Error checking for robot:", error);
      }
    };

    checkForRobot();
  }, [api.client, order.id]);

  const handleRobotAction = () => {
    if (associatedRobot) {
      navigate("/terminal");
    } else {
      setIsRegisterRobotModalOpen(true);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6 w-full">
      <h2 className="text-gray-12 font-bold text-2xl mb-1">{product.name}</h2>
      <p className="text-gray-11 mb-2 sm:text-lg">
        Status:{" "}
        <span className={`font-semibold ${getTextColor(order.status)}`}>
          {normalizeStatus(order.status)}
        </span>
      </p>

      <div className="mb-4">
        <Button
          onClick={handleRobotAction}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {associatedRobot ? (
            <Bot className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {associatedRobot ? "View Robot in Terminal" : "Register Robot"}
        </Button>
      </div>

      <div className="text-sm sm:text-base text-gray-11 flex flex-col mb-4">
        <p>Order ID: {order.id}</p>
        <div className="mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-12 underline cursor-pointer">
              Manage order
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                disabled={!canModifyOrder()}
                onSelect={() => setIsEditAddressModalOpen(true)}
                className="cursor-pointer"
              >
                Change delivery address
              </DropdownMenuItem>
              <div className="border-t border-gray-11 mx-1"></div>
              <DropdownMenuItem
                disabled={!canModifyOrder()}
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
            {formatPrice(order.amount)}
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
                    } text-white`}
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
                    } ${index === 0 ? "rounded-l-full" : ""} ${index === 4 ? "rounded-r-full" : ""}`}
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
          {order.status === "failed"
            ? "This order has failed."
            : `This order has been ${normalizeStatus(order.status)}.`}
        </p>
      )}

      <div className="mt-4 text-sm bg-gray-3 p-3 rounded-md">
        <h3 className="text-gray-12 font-semibold text-lg">Shipping Address</h3>
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
        order={order}
        onOrderUpdate={handleOrderUpdate}
      />
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onOpenChange={setIsCancelOrderModalOpen}
        order={order}
        onOrderUpdate={handleOrderUpdate}
      />
      <RegisterRobotModal
        isOpen={isRegisterRobotModalOpen}
        onClose={() => setIsRegisterRobotModalOpen(false)}
        onAdd={handleCreateRobot}
        initialValues={{
          order_id: order.id,
          // listing_id: product.id, // change later once listing for stompy pro/mini is created
        }}
      />
    </div>
  );
};

export default OrderCard;
