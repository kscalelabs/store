import { FaFile, FaFileArchive } from "react-icons/fa";
import { Link } from "react-router-dom";

import placeholder from "@/components/listing/pics/placeholder.jpg";
import { Artifact } from "@/components/listing/types";
import ROUTES from "@/lib/types/routes";

interface Props {
  artifact: Artifact;
}

const ListingArtifactRenderer = ({ artifact }: Props) => {
  switch (artifact.artifact_type) {
    case "image":
      return (
        <img
          src={artifact.urls.large}
          alt={artifact.name}
          className="w-full h-full object-cover"
        />
      );
    case "tgz":
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <Link
            to={ROUTES.FILE.buildPath({ artifactId: artifact.artifact_id })}
            className="p-4 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaFileArchive className="w-16 h-16" />
          </Link>
          <div className="text-center">
            <div className="font-medium">{artifact.name}</div>
            <div className="text-sm">
              {new Date(artifact.timestamp * 1000).toLocaleString()}
            </div>
          </div>
        </div>
      );
    case "kernel":
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="p-4">
            <FaFile className="w-16 h-16" />
          </div>
          <div className="text-center">
            <div className="font-medium">{artifact.name}</div>
            <div className="text-xs text-gray-500 mt-1">Kernel Image File</div>
            <div className="text-sm">
              {new Date(artifact.timestamp * 1000).toLocaleString()}
            </div>
          </div>
        </div>
      );
    default:
      return (
        <img
          src={placeholder}
          alt={artifact.name}
          className="w-full h-full object-cover"
        />
      );
  }
};

export default ListingArtifactRenderer;
