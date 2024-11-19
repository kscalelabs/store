import type { OrderWithProduct } from "@/lib/types/orders";
import { canModifyStatuses } from "@/lib/types/orders";

export const canModifyOrder = (order: OrderWithProduct) => {
  return canModifyStatuses.includes(order.order.status);
};
