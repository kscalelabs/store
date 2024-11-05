import { FaFileArchive } from "react-icons/fa";
import { Link } from "react-router-dom";

import placeholder from "@/components/listing/pics/placeholder.jpg";
import { Artifact } from "@/components/listing/types";

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
        <div className="w-full h-full bg-gray-3 flex flex-col items-center justify-center gap-2">
          <Link
            to={`/file/${artifact.artifact_id}`}
            className="p-4 hover:bg-gray-4 rounded-lg transition-colors"
          >
            <FaFileArchive className="w-16 h-16" />
          </Link>
          <div className="text-center">
            <div className="font-medium">{artifact.name}</div>
            <div className="text-sm text-gray-600">
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
