import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";

import { components } from "@/gen/api";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { format } from "date-fns";

import ImageArtifact from "./ImageArtifact";
import TgzArtifact from "./TgzArtifact";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface Props {
  artifact: SingleArtifactResponse;
  onDelete: () => void;
  canEdit: boolean;
}

const ArtifactCard: React.FC<Props> = ({ artifact, onDelete, canEdit }) => {
  const createdAt = new Date(artifact.timestamp * 1000);
  const formattedDate = format(createdAt, "MMM d, yyyy 'at' h:mm a");
  const [deleting, setDeleting] = useState(false);
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();

  const handleDelete = async () => {
    if (!canEdit) {
      addErrorAlert("You don't have permission to delete this artifact");
      return;
    }

    setDeleting(true);

    try {
      const { error } = await auth.client.DELETE(
        "/artifacts/delete/{artifact_id}",
        {
          params: { path: { artifact_id: artifact.artifact_id } },
        },
      );

      if (error) {
        addErrorAlert(error);
        setDeleting(false);
      } else {
        addAlert("Artifact deleted successfully", "success");
        onDelete();
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
      setDeleting(false);
    }
  };

  return (
    <div
      className={`bg-gray-2 shadow-md rounded-lg overflow-hidden flex flex-col relative ${deleting ? "opacity-50" : ""}`}
    >
      {deleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <p className="text-gray-12 font-semibold">Deleting...</p>
        </div>
      )}
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg text-gray-11 font-semibold">
            {artifact.name}
          </h3>
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-500 hover:text-red-500 transition-colors duration-200"
              aria-label="Delete artifact"
            >
              <FaTrash className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-10 mb-2">{artifact.description}</p>
        <p className="text-xs text-gray-10 mb-4">Created on {formattedDate}</p>
        {artifact.artifact_type === "tgz" ? (
          <TgzArtifact artifact={artifact} />
        ) : artifact.artifact_type === "image" ? (
          <ImageArtifact artifact={artifact} />
        ) : null}
      </div>
    </div>
  );
};

export default ArtifactCard;
