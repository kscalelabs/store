import React, { useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";

import { components } from "gen/api";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface Props {
  artifact: SingleArtifactResponse;
}

const TgzArtifact = ({ artifact }: Props) => {
  const [copied, setCopied] = useState(false);

  const command = `kscale urdf download ${artifact.artifact_id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div
      className="bg-gray-100 p-3 rounded-md flex items-center justify-between cursor-pointer"
      onClick={copyToClipboard}
    >
      <code className="text-xs font-mono truncate flex-grow mr-2">
        {command}
      </code>
      <button className="flex-shrink-0 focus:outline-none">
        {copied ? (
          <FaCheck className="text-green-500" />
        ) : (
          <FaCopy className="text-gray-500" />
        )}
      </button>
    </div>
  );
};

export default TgzArtifact;
