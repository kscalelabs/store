import React, { useEffect, useState } from "react";
import Masonry from "react-masonry-css";

import ListingOnshape from "@/components/listing/onshape/ListingOnshape";
import ProductPage from "@/components/products/ProductPage";
import { Card, CardContent } from "@/components/ui/Card";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import ArtifactCard from "./artifacts/ArtifactCard";
import LoadingArtifactCard from "./artifacts/LoadingArtifactCard";

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
  price?: number;
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
      }[]
    | undefined;
  main_image_url?: string;
};

interface ListingBodyProps {
  listing: ListingResponse;
  newTitle?: string;
}

const ListingBody: React.FC<ListingBodyProps> = ({ listing, newTitle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(listing.images || []);
  const [artifacts, setArtifacts] = useState<
    ListingResponse["artifacts"] | null
  >(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  const handleDeleteArtifact = (artifactId: string) => {
    setArtifacts((prevArtifacts) =>
      prevArtifacts
        ? prevArtifacts.filter(
            (artifact) => artifact.artifact_id !== artifactId,
          )
        : null,
    );
  };

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
          setArtifacts(data.artifacts);
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

          const allImages = [...uploadedImages, ...artifactImages];
          if (listing.main_image_url) {
            const mainImageIndex = allImages.findIndex(
              (img) => img === listing.main_image_url,
            );
            if (mainImageIndex !== -1) {
              const [mainImage] = allImages.splice(mainImageIndex, 1);
              allImages.unshift(mainImage);
            }
          }

          setImages(allImages);
        }
      } catch (err) {
        addErrorAlert(
          `Error fetching artifacts: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

    fetchArtifacts();
  }, [listing.id, listing.main_image_url, auth.client, addErrorAlert]);

  const productInfo = {
    name: newTitle || listing.name,
    description: listing.description || "Product Description",
    price: listing.price ?? 0,
    productId: listing.id,
  };

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
        price={productInfo.price}
        onImageClick={openModal}
        onImagesChange={(newImages) => {
          setImages(newImages);
        }}
      />
      <div className="mt-6">
        <ListingOnshape
          listingId={listing.id}
          onshapeUrl={listing.onshape_url}
          addArtifactId={async () => {}}
          edit={listing.can_edit}
        />
      </div>

      <div className="mt-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {artifacts === null ? (
            <LoadingArtifactCard />
          ) : artifacts ? (
            artifacts
              .slice()
              .reverse()
              .filter((artifact) => artifact.artifact_type !== "image")
              .map((artifact) => (
                <Card key={artifact.artifact_id} className="mb-4">
                  <CardContent className="p-4">
                    <ArtifactCard
                      artifact={artifact}
                      onDelete={() =>
                        handleDeleteArtifact(artifact.artifact_id)
                      }
                      canEdit={listing.can_edit}
                    />
                  </CardContent>
                </Card>
              ))
          ) : null}
        </Masonry>
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
