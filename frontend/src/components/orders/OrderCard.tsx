import React from "react";

import type { paths } from "@/gen/api";
import { formatPrice } from "@/lib/utils/formatNumber";
import { normalizeStatus } from "@/lib/utils/formatString";

type OrderWithProduct =
  paths["/orders/get_user_orders_with_products"]["get"]["responses"][200]["content"]["application/json"][0];

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

const redStatuses = ["cancelled", "refunded", "failed"];

const OrderCard: React.FC<{ orderWithProduct: OrderWithProduct }> = ({
  orderWithProduct,
}) => {
  const { order, product } = orderWithProduct;
  const currentStatusIndex = orderStatuses.indexOf(order.status);
  const isRedStatus = redStatuses.includes(order.status);
  const isDelivered = order.status === "delivered";

  const getStatusColor = (index: number) => {
    if (isRedStatus) return "bg-red-500";
    return index <= currentStatusIndex ? "bg-blue-500" : "bg-gray-300";
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-4 w-full">
      <h2 className="text-gray-12 font-bold text-3xl mb-1">{product.name}</h2>
      <p className="text-gray-11 mb-2 text-lg">
        Status:{" "}
        <span
          className={`font-semibold ${
            isRedStatus
              ? "text-red-600"
              : isDelivered
                ? "text-green-600"
                : "text-blue-600"
          }`}
        >
          {normalizeStatus(order.status)}
        </span>
      </p>
      <div className="text-sm text-gray-9 flex flex-col gap-1 mb-4">
        <p>Order ID: {order.id}</p>
        <p>{formatPrice(order.amount)}</p>
      </div>

      {/* Progress bar - only show if not delivered */}
      {!isDelivered && (
        <div className="mb-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div
                className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                  isRedStatus
                    ? "text-red-600 bg-red-200"
                    : "text-blue-600 bg-blue-200"
                }`}
              >
                Status
              </div>
            </div>
            <div className="flex mb-2">
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                {orderStatuses.slice(0, 5).map((status, index) => (
                  <div
                    key={status}
                    className={`h-full ${getStatusColor(index)} ${
                      index === 0 ? "rounded-l-full" : ""
                    } ${index === 4 ? "rounded-r-full" : ""}`}
                    style={{
                      width: "20%",
                      float: "left",
                      marginRight: index < 4 ? "1px" : "0",
                    }}
                  ></div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              {orderStatuses.slice(0, 5).map((status) => (
                <span key={status} className="w-1/5 text-center">
                  {normalizeStatus(status)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isRedStatus && (
        <p className="text-red-600 font-semibold mb-4">
          This order has been {normalizeStatus(order.status)}.
        </p>
      )}

      <div className="mt-4">
        {product.images && product.images.length > 0 && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-64 object-cover rounded-md mt-2"
          />
        )}
      </div>
    </div>
  );
};

export default OrderCard;
