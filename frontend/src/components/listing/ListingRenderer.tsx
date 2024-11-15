import { useState } from "react";

import ListingDeleteButton from "@/components/listing/ListingDeleteButton";
import ListingDescription from "@/components/listing/ListingDescription";
import ListingFeatureButton from "@/components/listing/ListingFeatureButton";
import ListingFileUpload from "@/components/listing/ListingFileUpload";
import ListingImageFlipper from "@/components/listing/ListingImageFlipper";
import ListingImageGallery from "@/components/listing/ListingImageGallery";
import ListingMetadata from "@/components/listing/ListingMetadata";
import ListingName from "@/components/listing/ListingName";
import ListingOnshape from "@/components/listing/ListingOnshape";
import ListingPayment from "@/components/listing/ListingPayment";
import ListingRegisterRobot from "@/components/listing/ListingRegisterRobot";
import { Artifact, ListingResponse } from "@/components/listing/types";

const ListingRenderer = ({ listing }: { listing: ListingResponse }) => {
  const {
    id: listingId,
    name,
    description,
    creator_id: creatorId,
    creator_name: creatorName,
    username: creatorUsername,
    slug,
    views,
    created_at: createdAt,
    artifacts: initialArtifacts,
    can_edit: canEdit,
    user_vote: userVote,
    onshape_url: onshapeUrl,
    is_featured: isFeatured,
    stripe_product_id: stripeProductId,
    price_amount: priceAmount,
    inventory_type: inventoryType,
    inventory_quantity: inventoryQuantity,
    preorder_release_date: preorderReleaseDate,
    is_reservation: isReservation,
    reservation_deposit_amount: reservationDepositAmount,
  } = listing;
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isForSale = priceAmount && stripeProductId && inventoryType;

  const handleAddArtifacts = (newArtifacts: Artifact[]) => {
    setArtifacts((prevArtifacts) => [
      ...newArtifacts.map((artifact) => ({
        ...artifact,
        is_main: false,
      })),
      ...prevArtifacts,
    ]);
    setCurrentImageIndex(0);
  };

  return (
    <div className="max-w-6xl mx-auto sm:p-4 sm:pt-8">
      {/* Main content area - flex column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 items-center">
        <ListingImageFlipper
          artifacts={artifacts}
          name={name}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
        />

        {/* Right side - Header and details - full width on mobile, half width on desktop */}
        <div className="w-full md:w-1/2 mt-8">
          {/* Header */}
          <ListingName
            listingId={listingId}
            name={name}
            edit={canEdit}
            userVote={userVote}
          />

          <hr className="border-gray-200 my-4" />

          {/* Metadata */}
          <ListingMetadata
            listingId={listingId}
            listingSlug={slug}
            creatorId={creatorId || ""}
            creatorName={creatorName}
            creatorUsername={creatorUsername}
            views={views}
            createdAt={createdAt}
          />

          <hr className="border-gray-2 my-4" />

          <ListingDescription
            listingId={listingId}
            description={description}
            edit={canEdit}
          />

          {/* Add payment section if price exists */}
          {isForSale && (
            <>
              <hr className="border-gray-2 my-4" />
              <ListingPayment
                listingId={listingId}
                stripeProductId={stripeProductId}
                priceAmount={priceAmount}
                inventoryType={
                  inventoryType as "finite" | "infinite" | "preorder"
                }
                inventoryQuantity={inventoryQuantity || undefined}
                preorderReleaseDate={preorderReleaseDate || undefined}
                isReservation={isReservation || false}
                reservationDepositAmount={reservationDepositAmount || undefined}
              />
            </>
          )}

          <hr className="border-gray-200 my-4" />

          {/* Build this robot */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4">
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 w-full">
              {canEdit && (
                <ListingDeleteButton
                  listingId={listingId}
                  className="w-full"
                  initialFeatured={isFeatured}
                />
              )}
              <ListingFeatureButton
                listingId={listingId}
                initialFeatured={isFeatured}
                className="w-full"
              />
              <ListingRegisterRobot listingId={listingId} className="w-full" />
            </div>
          </div>
        </div>
      </div>

      <ListingImageGallery
        listingId={listingId}
        artifacts={artifacts}
        setArtifacts={setArtifacts}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        canEdit={canEdit}
      />

      {canEdit && (
        <ListingFileUpload
          description="Upload an image"
          listingId={listingId}
          dropzoneOptions={{
            accept: { "image/*": [".png", ".jpg", ".jpeg"] },
          }}
          addArtifacts={handleAddArtifacts}
        />
      )}

      {/* Only show if there's a URL or user can edit */}
      {(onshapeUrl || canEdit) && (
        <ListingOnshape
          listingId={listingId}
          onshapeUrl={onshapeUrl}
          canEdit={canEdit}
          addArtifacts={handleAddArtifacts}
        />
      )}
    </div>
  );
};

export default ListingRenderer;
