import { useState } from "react";
import { FaStar, FaTimes } from "react-icons/fa";

import { Artifact } from "@/components/listing/types";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import { Tooltip } from "../ui/ToolTip";
import { Button } from "../ui/button";
import ListingArtifactRenderer from "./ListingArtifactRenderer";

interface Props {
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  canEdit: boolean;
  listingId: string;
}

const ListingImageItem = ({
  artifact,
  index,
  currentImageIndex,
  canEdit,
  artifacts,
  setArtifacts,
  setCurrentImageIndex,
  listingId,
}: {
  artifact: Artifact;
  index: number;
  currentImageIndex: number;
  canEdit: boolean;
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  listingId: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await auth.client.DELETE(
        "/artifacts/delete/{artifact_id}",
        {
          params: {
            path: { artifact_id: artifact.artifact_id },
          },
        },
      );
      if (response.error) {
        addErrorAlert(response.error);
        return;
      }

      const newArtifacts = artifacts.filter((_, i) => i !== index);
      setArtifacts(newArtifacts);
      if (currentImageIndex >= index) {
        setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
      }
    } catch (err) {
      addErrorAlert(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetMain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const response = await auth.client.PUT(
        "/artifacts/list/{listing_id}/main",
        {
          params: {
            path: { listing_id: listingId },
            query: {
              artifact_id: artifact.artifact_id,
            },
          },
        },
      );
      if (response.error) {
        addErrorAlert(response.error);
        return;
      }

      const currentMainIndex = artifacts.findIndex((a) => a.is_main);

      const updatedArtifacts = [...artifacts];

      if (currentMainIndex !== -1) {
        const previousMain = {
          ...updatedArtifacts[currentMainIndex],
          is_main: false,
        };
        const newMain = { ...updatedArtifacts[index], is_main: true };
        updatedArtifacts[currentMainIndex] = newMain;
        updatedArtifacts[index] = previousMain;
      } else {
        updatedArtifacts[index] = { ...updatedArtifacts[index], is_main: true };
      }

      setArtifacts(updatedArtifacts);

      if (currentMainIndex !== -1) {
        setCurrentImageIndex(currentMainIndex);
      }
    } catch (err) {
      addErrorAlert(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        key={artifact.urls.large}
        className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative ${
          currentImageIndex === index ? "ring-2 ring-gray-7" : ""
        } ${artifact.is_main ? "ring-2 ring-white" : ""}`}
        onClick={() => setCurrentImageIndex(index)}
      >
        <ListingArtifactRenderer artifact={artifact} />
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-2">
            {!artifact.is_main && artifact.artifact_type === "image" && (
              <Tooltip content="Set as Main Image" position="left" size="sm">
                <Button
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetMain(e);
                  }}
                  disabled={isUpdating}
                  className="text-gray-1 hover:bg-gray-1 hover:text-gray-12"
                >
                  <FaStar />
                </Button>
              </Tooltip>
            )}
            <Tooltip content="Delete Image" position="left" size="sm">
              <Button
                variant={isDeleting ? "ghost" : "destructive"}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                disabled={isDeleting}
              >
                <FaTimes />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        buttonText="Delete Image"
      />
    </>
  );
};

const ListingImageGallery = ({ listingId, ...props }: Props) => {
  const {
    artifacts,
    setArtifacts,
    currentImageIndex,
    setCurrentImageIndex,
    canEdit,
  } = props;

  return (
    <>
      {artifacts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {artifacts.map((artifact, index) => (
            <ListingImageItem
              key={artifact.urls.large}
              listingId={listingId}
              artifact={artifact}
              index={index}
              currentImageIndex={currentImageIndex}
              canEdit={canEdit}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              setCurrentImageIndex={setCurrentImageIndex}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">No images yet</p>
        </div>
      )}
    </>
  );
};

export default ListingImageGallery;
