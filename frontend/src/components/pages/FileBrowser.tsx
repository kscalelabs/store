import { useEffect, useState } from "react";
import { FaFileDownload, FaHome } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import FileRenderer from "@/components/files/FileRenderer";
import FileTreeViewer from "@/components/files/FileTreeViewer";
import { parseTar } from "@/components/files/Tarfile";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { components } from "@/gen/api";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import pako from "pako";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface UntarredFile {
  name: string;
  content: Uint8Array;
}

const FileBrowser = () => {
  const { artifactId } = useParams<{ artifactId: string }>();
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UntarredFile | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!artifactId || artifact) return;

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
          if (data.urls?.large) {
            setUntarring(true);
            try {
              const response = await fetch(data.urls.large);
              const arrayBuffer = await response.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              const decompressed = pako.ungzip(uint8Array);
              const files = parseTar(decompressed);
              setUntarredFiles(files);
            } catch (err) {
              addErrorAlert(`Error loading file: ${humanReadableError(err)}`);
            } finally {
              setUntarring(false);
            }
          }
        }
      } catch (err) {
        addErrorAlert(humanReadableError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [artifactId, auth.client, addErrorAlert, artifact]);

  const handleDownload = () => {
    if (!artifact?.urls.large) {
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

  const handleFileSelect = (file: UntarredFile) => {
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return artifact?.urls.large ? (
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
          onClick={handleDownload}
          variant="secondary"
          disabled={!artifact.urls?.large}
          className="w-full sm:w-auto"
        >
          <FaFileDownload className="mr-2" />
          Download
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row lg:space-x-4">
        <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
          <div className="border border-gray-300 rounded-md p-6 relative lg:h-[600px] overflow-auto">
            {untarring ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            ) : untarredFiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">No files available</div>
              </div>
            ) : (
              <FileTreeViewer
                files={untarredFiles}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            )}
          </div>
        </div>
        <div className="w-full lg:w-2/3">
          <div className="border border-gray-300 rounded-md overflow-hidden relative h-[600px]">
            {selectedFile && (
              <div className="absolute top-0 left-0 right-0 bg-gray-100 text-gray-800 p-2 border-b border-gray-300 break-all z-10">
                {selectedFile.name}
              </div>
            )}
            <div className="h-full">
              {selectedFile ? (
                <FileRenderer file={selectedFile} allFiles={untarredFiles} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to view its 3D model
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default FileBrowser;
