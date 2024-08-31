import React, { useEffect, useState } from "react";

import { components } from "gen/api";
import { humanReadableError, useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ArtifactCard from "components/listing/artifacts/ArtifactCard";
import ImageArtifact from "components/listing/artifacts/ImageArtifact";
import LoadingArtifactCard from "components/listing/artifacts/LoadingArtifactCard";
import TgzArtifact from "components/listing/artifacts/TgzArtifact";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface ListingArtifactProps {
  artifactId: string;
  onDelete: (artifactId: string) => void;
  canEdit: boolean;
}

const ListingArtifact: React.FC<ListingArtifactProps> = ({
  artifactId,
  onDelete,
  canEdit,
}) => {
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await auth.client.GET(
          "/artifacts/info/{artifact_id}",
          {
            params: { path: { artifact_id: artifactId } },
          },
        );

        if (error) {
          addErrorAlert(error);
        } else {
          setArtifact(data);
        }
      } catch (err) {
        addErrorAlert(humanReadableError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [artifactId, auth.client, addErrorAlert]);

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
          params: { path: { artifact_id: artifactId } },
        },
      );

      if (error) {
        addErrorAlert(error);
        setDeleting(false);
      } else {
        addAlert("Artifact deleted successfully", "success");
        onDelete(artifactId);
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingArtifactCard />;
  }

  if (!artifact) {
    return <div>Failed to load artifact</div>;
  }

  const renderArtifactContent = () => {
    switch (artifact.artifact_type) {
      case "image":
        return <ImageArtifact artifact={artifact} />;
      case "tgz":
        return <TgzArtifact artifact={artifact} />;
      default:
        return (
          <div>
            <p>Unsupported artifact type: {artifact.artifact_type}</p>
          </div>
        );
    }
  };

  return (
    <ArtifactCard
      name={artifact.name}
      description={artifact.description}
      timestamp={artifact.timestamp}
      onDelete={handleDelete}
      canEdit={canEdit}
      isDeleting={deleting}
    >
      {renderArtifactContent()}
    </ArtifactCard>
  );
};

export default ListingArtifact;
