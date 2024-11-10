import { useEffect, useState } from "react";
import {
  FaCheck,
  FaFileDownload,
  FaList,
  FaPen,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import FileRenderer from "@/components/files/FileRenderer";
import FileTreeViewer from "@/components/files/FileTreeViewer";
import { UntarredFile, untarFile } from "@/components/files/untar";
import Spinner from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/ToolTip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { components } from "@/gen/api";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

const FileBrowser = () => {
  const { artifactId, fileName } = useTypedParams(ROUTES.FILE);
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UntarredFile | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!artifactId) {
    navigate(ROUTES.HOME.path);
    return null;
  }

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
              const files = await untarFile(data.urls.large);
              setUntarredFiles(files);

              if (fileName) {
                const file = files.find((file) => file.name === fileName);
                if (file) {
                  setSelectedFile(file);
                }
              }
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
        setIsLoading(false);
      }
    })();
  }, [artifactId, auth.client, addErrorAlert]);

  useEffect(() => {
    if (fileName && untarredFiles.length > 0) {
      const file = untarredFiles.find((file) => file.name === fileName);
      if (file) {
        setSelectedFile(file);
      }
    }
  }, [fileName, untarredFiles]);

  useEffect(() => {
    if (artifact) {
      setEditedDescription(artifact.description || "");
    }
  }, [artifact]);

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
    navigate(ROUTES.FILE.buildPath({ artifactId, fileName: file.name }), {
      replace: true,
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await auth.client.PUT("/artifacts/edit/{artifact_id}", {
        params: {
          query: { id: artifactId },
        },
        body: {
          description: editedDescription,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifact((prev) =>
          prev ? { ...prev, description: editedDescription } : null,
        );
        setIsEditing(false);
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return isLoading ? (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  ) : artifact?.urls.large ? (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2 min-w-0">
        {isEditing ? (
          <div className="flex-1 mr-4 min-w-0">
            <h1 className="text-2xl font-semibold break-all overflow-wrap-anywhere">
              {artifact.name}
            </h1>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full break-words mt-2"
              placeholder="Description (optional)"
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-2xl font-semibold break-all overflow-wrap-anywhere">
              {artifact.name}
            </h1>
            {artifact.description && (
              <p className="text-sm text-gray-600 mt-2 break-words whitespace-pre-wrap overflow-wrap-anywhere">
                {artifact.description}
              </p>
            )}
          </div>
        )}
        <div className="flex space-x-2 pl-4">
          {isEditing ? (
            <>
              <Tooltip content="Save Changes" position="bottom">
                <Button
                  onClick={handleSaveEdit}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner className="h-4 w-4" /> : <FaCheck />}
                </Button>
              </Tooltip>
              <Tooltip content="Cancel" position="bottom">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isSaving}
                >
                  <FaTimes />
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              {artifact.can_edit && (
                <Tooltip content="Edit Artifact Details" position="bottom">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <FaPen />
                  </Button>
                </Tooltip>
              )}
              <Tooltip content="View Listing" position="bottom">
                <Button
                  onClick={() =>
                    navigate(
                      ROUTES.BOT.buildPath({
                        username: artifact.username,
                        slug: artifact.slug,
                      }),
                    )
                  }
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <FaList />
                </Button>
              </Tooltip>
              <Tooltip content="Download Files" position="bottom">
                <Button
                  onClick={handleDownload}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!artifact.urls?.large}
                >
                  <FaFileDownload />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
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
            {selectedFile ? (
              <>
                <div className="absolute top-2 left-2 z-10 bg-black/50 text-white px-2 py-1 rounded max-w-[80%] truncate">
                  {selectedFile.name}
                </div>
                <FileRenderer file={selectedFile} allFiles={untarredFiles} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a file to view its 3D model
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center pt-8">
      Error loading artifact
    </div>
  );
};

export default FileBrowser;
