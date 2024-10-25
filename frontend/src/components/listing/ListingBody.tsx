import React, { useState, useEffect } from "react";
import ProductPage from "@/components/products/ProductPage";
import ListingOnshape from "@/components/listing/onshape/ListingOnshape";
import { useAuthentication } from "@/hooks/useAuth";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { formatPrice } from "@/lib/utils/formatNumber";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface ListingBodyProps {
  listing: ListingResponse;
  newTitle: string; // Add this line
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
        const { data, error } = await auth.client.GET("/artifacts/list/{listing_id}", {
          params: { path: { listing_id: listing.id } },
        });

        if (error) {
          addErrorAlert(error);
        } else {
          const artifactImages = data.artifacts
            .filter(artifact => artifact.artifact_type === "image")
            .map(artifact => artifact.urls.large);

          const uploadedImages = listing.uploaded_files?.map(file => file.url) || [];
          setImages([...uploadedImages, ...artifactImages]);
        }
      } catch (err) {
        addErrorAlert("Error fetching artifacts");
      }
    };

    fetchArtifacts();
  }, [listing.id, auth.client, addErrorAlert]);

  console.log("Raw listing price:", listing.price);
  console.log("Listing price type:", typeof listing.price);

  const productInfo = {
    name: newTitle || listing.name,
    description: listing.description || "Product Description",
    specs: listing.key_features ? listing.key_features.split('\n') : [],
    features: [],
    price: listing.price,
    productId: listing.product_id || "default_product_id",
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
          addArtifactId={() => {}}
          edit={listing.can_edit}
        />
      </div>

      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <img src={selectedImage} alt="Selected" className="max-w-full max-h-full" />
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
