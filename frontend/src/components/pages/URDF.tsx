import React, { useState } from "react";
import { FaDownload, FaFileDownload, FaHome, FaList } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import { components } from "gen/api";
import { humanReadableError, useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface UntarredFile {
  name: string;
  content: string;
}

const URDFViewer: React.FC<{ files: UntarredFile[] }> = ({ files }) => {
  return (
    <div className="h-[600px] w-full border border-gray-300 rounded-md p-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Untarred Files:</h2>
      <ul>
        {files.map((file, index) => (
          <li key={index} className="mb-2">
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

const URDF: React.FC = () => {
  const { artifactId } = useParams<{ artifactId: string }>();
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchArtifact = async () => {
      if (!artifactId) return;

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
    };

    fetchArtifact();
  }, [artifactId, auth.client, addErrorAlert]);

  const handleLoadAndUntar = async () => {
    if (!artifact?.urls?.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    setUntarring(true);
    try {
      const response = await fetch(artifact.urls.large);
      const file = await response.blob();
      const decompressedReadableStream = file
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
      const decompressedBlob = await new Response(
        decompressedReadableStream,
      ).blob();
      const decompressedText = await decompressedBlob.text();

      // Simple parsing of tar file structure (this is a basic implementation and might need refinement)
      const files: UntarredFile[] = [];
      const blocks = decompressedText.match(/.{1,512}/g) || [];

      for (let i = 0; i < blocks.length; i++) {
        const header = blocks[i];
        const fileName = header.substr(0, 100).trim();
        if (fileName) {
          const fileSize = parseInt(header.substr(124, 12), 8);
          const contentBlocks = Math.ceil(fileSize / 512);
          const content = blocks
            .slice(i + 1, i + 1 + contentBlocks)
            .join("")
            .substr(0, fileSize);
          files.push({ name: fileName, content });
          i += contentBlocks;
        }
      }

      setUntarredFiles(files);
    } catch (err) {
      addErrorAlert(`Error loading file: ${humanReadableError(err)}`);
    } finally {
      setUntarring(false);
    }
  };

  const handleDownload = () => {
    if (!artifact?.urls?.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    const link = document.createElement("a");
    link.href = artifact.urls.large;
    link.download = `${artifact.name}.tgz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  if (!artifact?.urls?.large) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{artifact.name}</h1>
      <p className="text-gray-600 mb-4">{artifact.description}</p>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-6">
        <Button
          onClick={() => navigate("/")}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <FaHome className="mr-2" />
          Home
        </Button>
        <Button
          onClick={() => navigate(`/item/${artifact.listing_id}`)}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <FaList className="mr-2" />
          View Listing
        </Button>
        <Button
          onClick={handleLoadAndUntar}
          variant="primary"
          disabled={untarring}
          className="w-full sm:w-auto"
        >
          <FaDownload className="mr-2" />
          {untarring ? "Loading..." : "Load and Untar"}
        </Button>
        <Button
          onClick={handleDownload}
          variant="secondary"
          disabled={!artifact.urls?.large}
          className="w-full sm:w-auto"
        >
          <FaFileDownload className="mr-2" />
          Download TGZ
        </Button>
      </div>
      {untarredFiles.length > 0 ? (
        <URDFViewer files={untarredFiles} />
      ) : (
        <div className="h-[600px] w-full border border-gray-300 rounded-md p-4 flex items-center justify-center text-gray-500">
          Click "Load and Untar" to view the URDF files
        </div>
      )}
    </div>
  );
};

export default URDF;
