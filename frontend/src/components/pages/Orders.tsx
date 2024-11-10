import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import OrderCard from "@/components/orders/OrderCard";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import type { paths } from "@/gen/api";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

type OrderWithProduct =
  paths["/orders/user-orders-with-products"]["get"]["responses"][200]["content"]["application/json"][number];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { api, currentUser, isAuthenticated, isLoading } = useAuthentication();
  const [orders, setOrders] = useState<OrderWithProduct[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && currentUser) {
        setLoadingOrders(true);
        try {
          const { data, error } = await api.client.GET(
            "/orders/user-orders-with-products",
          );
          if (error) {
            console.error("Failed to fetch orders", error);
          } else {
            setOrders(data);
          }
        } catch (error) {
          console.error("Error fetching orders", error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders();
  }, [api, currentUser, isAuthenticated]);

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
          You can view the status of your past and current orders here.
        </p>
      </div>
      {isLoading || loadingOrders ? (
        <div className="flex justify-center items-center p-4 md:p-10 rounded-lg max-w-md mx-auto">
          <Spinner className="p-1" />
        </div>
      ) : orders && orders.length > 0 ? (
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
