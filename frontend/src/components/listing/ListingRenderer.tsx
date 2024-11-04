import { useState } from "react";

import ListingDescription from "@/components/listing/ListingDescription";
import { ListingResponse } from "@/components/listing/types";

import ListingFileUpload from "./ListingFileUpload";
import ListingImageFlipper from "./ListingImageFlipper";
import ListingImageGallery from "./ListingImageGallery";
import ListingMetadata from "./ListingMetadata";
import ListingName from "./ListingName";

const ListingRenderer = ({
  id: listingId,
  name,
  description,
  creator_id: creatorId,
  creator_name: creatorName,
  creator_username: creatorUsername,
  views,
  created_at: createdAt,
  artifacts: initialArtifacts,
  can_edit: canEdit,
}: ListingResponse) => {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  return (
    <div className="max-w-6xl mx-auto p-4 pt-12">
      {/* Main content area - flex column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <ListingImageFlipper
          artifacts={artifacts}
          name={name}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
        />

        {/* Right side - Header and details - full width on mobile, half width on desktop */}
        <div className="w-full md:w-1/2 mt-8">
          {/* Header */}
          <ListingName listingId={listingId} name={name} edit={canEdit} />

          <hr className="border-gray-200 my-4" />

          {/* Metadata */}
          <ListingMetadata
            creatorId={creatorId}
            creatorName={creatorName}
            creatorUsername={creatorUsername}
            views={views}
            createdAt={createdAt}
          />

          <hr className="border-gray-200 my-4" />

          {/* Description */}
          <ListingDescription
            listingId={listingId}
            description={description}
            edit={canEdit}
          />
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
          onUpload={(newArtifacts) => {
            setArtifacts((prevArtifacts) => [
              ...newArtifacts.artifacts,
              ...prevArtifacts,
            ]);
          }}
        />
      )}
    </div>
  );
};

export default ListingRenderer;
