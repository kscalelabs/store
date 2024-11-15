import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

import placeholder from "@/components/listing/pics/placeholder.jpg";
import { Artifact } from "@/components/listing/types";

interface Props {
  artifacts: Artifact[];
  name: string;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

const ListingImageFlipper = (props: Props) => {
  const { artifacts, name, currentImageIndex, setCurrentImageIndex } = props;
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (artifacts.length === 0) {
    return (
      <div className="w-full md:w-1/2 relative">
        <div className="aspect-square bg-white rounded-lg overflow-hidden">
          <img
            src={placeholder}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  const currentArtifact = artifacts[currentImageIndex];

  return (
    <>
      <div className="relative">
        <img
          src={currentArtifact.urls.large}
          alt={name}
          onClick={() => setIsFullScreen(true)}
          className="cursor-zoom-in rounded-lg w-[500px]"
        />
        {/* Navigation arrows */}
        {artifacts.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === 0 ? artifacts.length - 1 : prev - 1,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-gray-11"
            >
              <FaChevronLeft className="text-gray-11" />
            </button>
            <button
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === artifacts.length - 1 ? 0 : prev + 1,
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-gray-11"
            >
              <FaChevronRight className="text-gray-11" />
            </button>
          </>
        )}
      </div>

      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsFullScreen(false)}
        >
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 text-gray-2 hover:text-gray-11 p-2"
          >
            <FaTimes className="w-6 h-6" />
          </button>
          <img
            src={currentArtifact.urls.large}
            alt={name}
            className="max-h-[90vh] max-w-[90vw]"
          />
        </div>
      )}
    </>
  );
};

export default ListingImageFlipper;
