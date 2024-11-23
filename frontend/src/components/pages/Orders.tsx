import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import OrderCard from "@/components/orders/OrderCard";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ApiError } from "@/lib/types/api";
import type { OrderWithProduct } from "@/lib/types/orders";
import ROUTES from "@/lib/types/routes";

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { client, currentUser, isAuthenticated, isLoading } =
    useAuthentication();
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && currentUser) {
        setLoadingOrders(true);
        try {
          const { data, error } = await client.GET("/orders/me");

          if (error) {
            const apiError = error as ApiError;
            if (apiError.status === 500) {
              addErrorAlert({
                message: "Failed to fetch orders",
                detail: apiError.message || "An unexpected error occurred",
              });
            }
            setOrders([]);
          } else {
            setOrders(data as OrderWithProduct[]);
          }
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders();
  }, [client, currentUser, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="pt-8 min-h-screen">
        Please log in to view orders on your account.
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen rounded-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Orders</h1>
        <p className="text-gray-8">
          You can view the status of your orders here.
        </p>
      </div>
      {isLoading || loadingOrders ? (
        <div className="flex justify-center items-center p-4 md:p-10 rounded-lg max-w-md mx-auto">
          <Spinner className="p-1" />
        </div>
      ) : orders.length > 0 ? (
        <div className="grid gap-2 md:gap-6 md:grid-cols-1 lg:grid-cols-2">
          {orders.map((orderWithProduct: OrderWithProduct) => (
            <OrderCard
              key={orderWithProduct.order.id}
              orderWithProduct={orderWithProduct}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 justify-center items-center p-10 rounded-lg max-w-3xl mx-auto">
          <p className="text-gray-1 font-medium sm:text-lg">No orders yet.</p>
          <Button
            onClick={() => navigate(ROUTES.BOTS.BROWSE.path)}
            variant="outline"
          >
            Browse Robots
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
