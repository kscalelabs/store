import { paths } from "@/gen/api";

export type ListingResponse =
  paths["/listings/{username}/{slug}"]["get"]["responses"][200]["content"]["application/json"];

export type Artifact = ListingResponse["artifacts"][number];

export type InventoryType = "finite" | "preorder";
