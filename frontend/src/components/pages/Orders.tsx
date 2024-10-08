import React, { useEffect, useState } from "react";

import type { paths } from "@/gen/api";
import { useAuthentication } from "@/hooks/useAuth";

type Order =
  paths["/orders/get_user_orders"]["get"]["responses"][200]["content"]["application/json"][0];

const OrdersPage: React.FC = () => {
  const { api, currentUser, isAuthenticated, isLoading } = useAuthentication();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && currentUser) {
        setLoadingOrders(true);
        try {
          const { data, error } = await api.client.GET(
            "/orders/get_user_orders",
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

  if (isLoading || loadingOrders) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to view your orders.</div>;
  }

  return (
    <div>
      <h1>Your Orders</h1>
      {orders && orders.length > 0 ? (
        <ul>
          {orders.map((order: Order) => (
            <li key={order.id}>
              <p>Order ID: {order.id}</p>
              <p>Amount: {order.amount}</p>
              <p>Status: {order.status}</p>
              {/* Add more order details as needed */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrdersPage;
