import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Artifact } from "@/components/listing/types";

interface Props {
  artifacts: Artifact[];
}

const ListingPlaygroundButton = ({ artifacts }: Props) => {
  const navigate = useNavigate();

  const tgzArtifact = artifacts.find(a => a.artifact_type === 'tgz');

  if (!tgzArtifact?.artifact_id) return null;

  return (
    <Button
      variant="primary"
      className="flex items-center"
      onClick={() => navigate(`/playground/${tgzArtifact.artifact_id}`)}
    >
      <FaPlay className="mr-2 h-4 w-4" />
      <span className="mr-2">View on Playground</span>
    </Button>
  );
};

export default ListingPlaygroundButton;
