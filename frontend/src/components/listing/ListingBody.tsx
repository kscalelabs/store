import React, { useEffect, useState } from "react";

import ProductPage from "@/components/products/ProductPage";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

// Update the ListingResponse type to match the actual structure
type ListingResponse = {
  id: string;
  name: string;
  username: string | null;
  slug: string | null;
  description: string | null;
  child_ids: string[];
  tags: string[];
  onshape_url: string | null;
  can_edit: boolean;
  created_at: number;
  creator_name: string | null;
  uploaded_files?: { url: string }[];
  price: number | null;
  images?: string[];
  artifacts?:
    | {
        artifact_id: string;
        listing_id: string;
        name: string;
        artifact_type:
          | "image"
          | "urdf"
          | "mjcf"
          | "stl"
          | "obj"
          | "dae"
          | "ply"
          | "tgz"
          | "zip";
        description: string | null;
        timestamp: number;
        urls: { large: string };
        is_main: boolean;
      }[]
    | undefined;
  main_image_url?: string;
};

interface ListingBodyProps {
  listing: ListingResponse;
  newTitle?: string;
}

const ListingBody: React.FC<ListingBodyProps> = ({ listing, newTitle }) => {
  const productInfo = {
    name: newTitle || listing.name,
    description: listing.description || "Product Description",
    price: listing.price ?? 0,
    productId: listing.id,
    onshapeLink: listing.onshape_url,
  };

  return (
    <ProductPage
      title={productInfo.name}
      productId={productInfo.productId}
      checkoutLabel={`Buy ${productInfo.name}`}
      description={productInfo.description}
      price={productInfo.price}
      onshapeLink={productInfo.onshapeLink || undefined}
    />
  );
};

export default ListingBody;
