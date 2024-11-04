import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import placeholder from "@/components/listing/pics/placeholder.jpg";
import { Artifact } from "@/components/listing/types";

import ListingArtifactRenderer from "./ListingArtifactRenderer";

interface Props {
  artifacts: Artifact[];
  name: string;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

const ListingImageFlipper = (props: Props) => {
  const { artifacts, name, currentImageIndex, setCurrentImageIndex } = props;

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
      {/* Main image - full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 relative">
        <div className="aspect-square bg-white rounded-lg overflow-hidden">
          <ListingArtifactRenderer artifact={currentArtifact} />
        </div>

        {/* Navigation arrows */}
        {artifacts.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === 0 ? artifacts.length - 1 : prev - 1,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === artifacts.length - 1 ? 0 : prev + 1,
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ListingImageFlipper;
