import { useState } from "react";
import { FaStar, FaTimes } from "react-icons/fa";

import { Artifact } from "@/components/listing/types";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

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
  onClick,
  listingId,
}: {
  artifact: Artifact;
  index: number;
  currentImageIndex: number;
  canEdit: boolean;
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  onClick: () => void;
  listingId: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

      const updatedArtifacts = artifacts.map((a) => ({
        ...a,
        is_main: a.artifact_id === artifact.artifact_id,
      }));
      setArtifacts(updatedArtifacts);
    } catch (err) {
      addErrorAlert(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      key={artifact.urls.large}
      className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative ${
        currentImageIndex === index ? "ring-2 ring-blue-500" : ""
      } ${artifact.is_main ? "ring-2 ring-green-500" : ""}`}
      onClick={onClick}
    >
      <ListingArtifactRenderer artifact={artifact} />
      {canEdit && (
        <div className="absolute top-2 right-2 flex gap-2">
          {!artifact.is_main && artifact.artifact_type === "image" && (
            <Button
              variant="secondary"
              onClick={handleSetMain}
              disabled={isUpdating}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <FaStar />
            </Button>
          )}
          <Button
            variant={isDeleting ? "ghost" : "destructive"}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <FaTimes />
          </Button>
        </div>
      )}
    </div>
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
  return artifacts.length > 0 ? (
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
          onClick={() => setCurrentImageIndex(index)}
        />
      ))}
    </div>
  ) : (
    <div className="flex justify-center items-center h-full">
      <p className="text-gray-500">No images yet</p>
    </div>
  );
};

export default ListingImageGallery;
