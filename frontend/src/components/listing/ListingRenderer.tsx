import { useState } from "react";

import ListingDescription from "@/components/listing/ListingDescription";
import ListingFeatureButton from "@/components/listing/ListingFeatureButton";
import ListingFileUpload from "@/components/listing/ListingFileUpload";
import ListingImageFlipper from "@/components/listing/ListingImageFlipper";
import ListingImageGallery from "@/components/listing/ListingImageGallery";
import ListingMetadata from "@/components/listing/ListingMetadata";
import ListingName from "@/components/listing/ListingName";
import ListingOnshape from "@/components/listing/ListingOnshape";
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
  } = listing;
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const addArtifacts = (newArtifacts: Artifact[]) => {
    setArtifacts((prevArtifacts) =>
      [...newArtifacts, ...prevArtifacts].sort((a, b) =>
        a.is_main ? -1 : b.is_main ? 1 : 0,
      ),
    );
  };

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
            listingId={listingId}
            listingSlug={slug}
            creatorId={creatorId || ""}
            creatorName={creatorName}
            creatorUsername={creatorUsername}
            views={views}
            createdAt={createdAt}
            userVote={userVote}
          />

          <hr className="border-gray-200 my-4" />

          {/* Build this robot */}
          <div className="flex items-center gap-4">
            <ListingRegisterRobot listingId={listingId} />
            <ListingFeatureButton
              listingId={listingId}
              initialFeatured={isFeatured}
            />
          </div>

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
          addArtifacts={addArtifacts}
        />
      )}

      {/* Only show if there's a URL or user can edit */}
      {(onshapeUrl || canEdit) && (
        <ListingOnshape
          listingId={listingId}
          onshapeUrl={onshapeUrl}
          canEdit={canEdit}
          addArtifacts={addArtifacts}
        />
      )}
    </div>
  );
};

export default ListingRenderer;
