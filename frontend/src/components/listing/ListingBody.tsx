import React, { useEffect, useState } from "react";

import ListingOnshape from "@/components/listing/onshape/ListingOnshape";
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
  // Add any other properties that are present in your listing object
  // If price is not always present, make it optional
  price?: number;
};

interface ListingBodyProps {
  listing: ListingResponse;
  newTitle?: string;
}

const ListingBody: React.FC<ListingBodyProps> = ({ listing, newTitle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const { data, error } = await auth.client.GET(
          "/artifacts/list/{listing_id}",
          {
            params: { path: { listing_id: listing.id } },
          },
        );

        if (error) {
          addErrorAlert(error);
        } else {
          const artifactImages = data.artifacts
            .filter(
              (artifact: { artifact_type: string }) =>
                artifact.artifact_type === "image",
            )
            .map(
              (artifact: { urls: { large: string } }) => artifact.urls.large,
            );

          const uploadedImages =
            listing.uploaded_files?.map((file: { url: string }) => file.url) ||
            [];
          setImages([...uploadedImages, ...artifactImages]);
        }
      } catch (err) {
        addErrorAlert(
          `Error fetching artifacts: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

    fetchArtifacts();
  }, [listing.id, auth.client, addErrorAlert]);

  console.log("Raw listing price:", listing.price);
  console.log("Listing price type:", typeof listing.price);

  const productInfo = {
    name: newTitle || listing.name,
    description: listing.description || "Product Description",
    specs: listing.key_features ? listing.key_features.split("\n") : [],
    features: [],
    price: listing.price, // This might be undefined if price is not always present
    productId: listing.id, // Use listing.id instead of product_id
  };

  console.log("Product info:", productInfo);

  const openModal = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <ProductPage
        title={productInfo.name}
        images={images}
        productId={productInfo.productId}
        checkoutLabel={`Buy ${productInfo.name}`}
        description={productInfo.description}
        features={productInfo.features}
        keyFeatures={productInfo.specs}
        price={productInfo.price}
        onImageClick={openModal}
      />
      <div className="mt-6">
        <ListingOnshape
          listingId={listing.id}
          onshapeUrl={listing.onshape_url}
          addArtifactId={async () => {}}
          edit={listing.can_edit}
        />
      </div>

      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-w-full max-h-full"
            />
            <button
              onClick={closeModal}
              className="absolute top-0 right-0 m-4 text-white text-2xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingBody;
