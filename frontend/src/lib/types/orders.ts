import type { paths } from "@/gen/api";

export type Order =
  paths["/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"];

export type OrderWithProduct =
  paths["/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"] & {
    product?: ProductInfo;
  };

export type ProductInfo = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
};

export type OrderStatus =
  paths["/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"]["order"]["status"];

export const orderStatuses: OrderStatus[] = [
  "processing",
  "in_development",
  "being_assembled",
  "shipped",
  "delivered",
  "awaiting_final_payment",
  "preorder_placed",
  "cancelled",
  "refunded",
];

export const activeStatuses = [
  "preorder_placed",
  "processing",
  "in_development",
  "being_assembled",
  "shipped",
  "awaiting_final_payment",
];

export const redStatuses = ["cancelled", "refunded"];
export const canModifyStatuses = [
  "preorder_placed",
  "processing",
  "in_development",
  "being_assembled",
  "awaiting_final_payment",
];
