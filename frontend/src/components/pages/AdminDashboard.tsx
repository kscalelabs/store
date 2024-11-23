import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import OrderCard from "@/components/orders/OrderCard";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ApiError } from "@/lib/types/api";
import type { OrderWithProduct } from "@/lib/types/orders";
import ROUTES from "@/lib/types/routes";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { client, currentUser, isAuthenticated, isLoading } =
    useAuthentication();
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && currentUser?.permissions?.includes("is_admin")) {
        setLoadingOrders(true);
        try {
          const { data, error } = await client.GET("/orders/admin/all");

          if (error) {
            const apiError = error as ApiError;
            addErrorAlert({
              message: "Failed to fetch orders",
              detail: apiError.message || "An unexpected error occurred",
            });
            setOrders([]);
          } else {
            setOrders(data.orders as OrderWithProduct[]);
          }
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders();
  }, [client, currentUser, isAuthenticated]);

  // Redirect non-admin users
  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || !currentUser?.permissions?.includes("is_admin"))
    ) {
      navigate(ROUTES.HOME.path);
    }
  }, [isLoading, isAuthenticated, currentUser]);

  if (isLoading || loadingOrders) {
    return (
      <div className="p-6 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-8">
            View and manage all orders across the platform. Update order
            statuses, process pre-orders, and cancel orders.
          </p>
        </div>
        <div className="flex justify-center items-center p-4">
          <Spinner className="p-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-8">
          View and manage all orders across the platform. Update order statuses,
          process pre-orders, and cancel orders.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Viewing All Orders As Admin
        </h2>
        {orders.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((orderWithProduct) => (
              <OrderCard
                key={orderWithProduct.order.id}
                orderWithProduct={orderWithProduct}
                isAdminView
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center">
            <p className="text-xl text-gray-1">No orders found</p>
            <p>
              There are no orders placed yet or no orders that match your query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
