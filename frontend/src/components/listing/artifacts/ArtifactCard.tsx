import React from "react";

import { format } from "date-fns";
import { components } from "gen/api";

import ImageArtifact from "./ImageArtifact";
import TgzArtifact from "./TgzArtifact";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface Props {
  artifact: SingleArtifactResponse;
}

const ArtifactCard: React.FC<Props> = ({ artifact }) => {
  const createdAt = new Date(artifact.timestamp);
  const formattedDate = format(createdAt, "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-lg text-gray-800 dark:text-gray-200 font-semibold mb-2">
          {artifact.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {artifact.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Created on {formattedDate}
        </p>
        {artifact.artifact_type === "tgz" && (
          <TgzArtifact artifact={artifact} />
        )}
        {artifact.artifact_type === "image" && (
          <ImageArtifact artifact={artifact} />
        )}
      </div>
    </div>
  );
};

export default ArtifactCard;
