import React, { useState } from "react";

import { components } from "gen/api";

import ImageModal from "./ImageModal";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface Props {
  artifact: SingleArtifactResponse;
}

const ImageArtifact = ({ artifact }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="w-full pt-[100%] relative bg-gray-200 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={artifact.urls.large}
          alt={artifact.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={artifact.urls.large}
        altText={artifact.name}
      />
    </>
  );
};

export default ImageArtifact;
