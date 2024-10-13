import React, { useEffect, useState } from "react";

import OrderCard from "@/components/orders/OrderCard";
import Spinner from "@/components/ui/Spinner";
import type { paths } from "@/gen/api";
import { useAuthentication } from "@/hooks/useAuth";

type OrderWithProduct =
  paths["/orders/get_user_orders_with_products"]["get"]["responses"][200]["content"]["application/json"][0];

const OrdersPage: React.FC = () => {
  const { api, currentUser, isAuthenticated, isLoading } = useAuthentication();
  const [orders, setOrders] = useState<OrderWithProduct[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && currentUser) {
        setLoadingOrders(true);
        try {
          const { data, error } = await api.client.GET(
            "/orders/get_user_orders_with_products",
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
    <div className="p-6 min-h-screen rounded-xl bg-gray-3">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Orders</h1>
        <p className="text-gray-11">
          You can view the status of your past and current orders here.
        </p>
      </div>
      {isLoading || loadingOrders ? (
        <div className="flex justify-center items-center bg-gray-4 p-4 md:p-10 rounded-lg max-w-md mx-auto">
          <Spinner className="p-1" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {orders.map((orderWithProduct: OrderWithProduct) => (
            <OrderCard
              key={orderWithProduct.order.id}
              orderWithProduct={orderWithProduct}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center bg-gray-4 p-4 md:p-10 rounded-lg max-w-md mx-auto">
          <p className="text-gray-12">No orders yet.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
