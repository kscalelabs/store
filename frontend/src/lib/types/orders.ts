import type { paths } from "@/gen/api";

export type Order =
  paths["/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"];

export type OrderWithProduct =
  paths["/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"] & {
    product: ProductInfo;
  };

export type ProductInfo = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
};
