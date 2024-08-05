import {
  FileInput,
  FileSubmitButton,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "components/listing/FileUpload";
import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { Paperclip } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

interface ListingUploadProps {
  listingId: string;
  onUpload: (artifact: components["schemas"]["UploadArtifactResponse"]) => void;
}

const ListingUpload = (props: ListingUploadProps) => {
  const { listingId, onUpload } = props;

  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();

  const [files, setFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const onValueChange = useCallback(() => {
    if (files === null) {
      return;
    }

    setUploading(true);
    (async () => {
      await Promise.all(
        files.map(async (file: File) => {
          const { data, error } = await auth.api.upload(file, {
            artifact_type: "image",
            listing_id: listingId,
          });

          if (error) {
            addErrorAlert(error);
          } else {
            setFiles(null);
            onUpload(data);
          }
        }),
      );
      setUploading(false);
    })();
  }, [files, auth, listingId, addErrorAlert]);

  return uploading ? (
    <div className="my-4 w-full flex justify-center">
      <Spinner />
    </div>
  ) : (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      dropzoneOptions={{
        accept: {
          "image/*": [".jpg", ".jpeg", ".png", ".gif"],
        },
        maxSize: 4 * 1024 * 1024,
      }}
      className="relative bg-background rounded-lg pt-4 pb-2 px-2"
    >
      <FileInput>
        <div className="flex justify-center pt-3 pb-4 w-full h-32">
          <div className="text-sm align-middle h-full justify-center flex flex-col">
            <div className="text-center">
              <span>Drag and drop your images here</span>
            </div>
            <div className="text-center">
              <span>or</span>
            </div>
            <div className="text-center">
              <span>click to browse</span>
            </div>
          </div>
        </div>
      </FileInput>
      <FileUploaderContent>
        {files &&
          files.length > 0 &&
          files.map((file, index: number) => (
            <FileUploaderItem key={index} index={index}>
              <Paperclip className="h-4 w-4 stroke-current" />
              <span>{file.name}</span>
            </FileUploaderItem>
          ))}
      </FileUploaderContent>
      {files && files.length > 0 && (
        <FileSubmitButton onClick={onValueChange}>
          <span>Upload</span>
        </FileSubmitButton>
      )}
    </FileUploader>
  );
};

interface Props {
  listingId: string;
  edit: boolean;
}

const ListingArtifacts = (props: Props) => {
  const { listingId, edit } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"] | null
  >(null);

  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    if (artifacts !== null) {
      return;
    }

    const fetchArtifacts = async () => {
      const { data, error } = await auth.client.GET("/artifacts/{listing_id}", {
        params: {
          path: { listing_id: listingId },
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifacts(data);
      }
    };
    fetchArtifacts();
  }, [listingId, artifacts]);

  const onDelete = async (artifactId: string) => {
    setDeletingIds([...deletingIds, artifactId]);

    const { error } = await auth.client.DELETE(
      "/artifacts/delete/{artifact_id}",
      {
        params: {
          path: { artifact_id: artifactId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      setArtifacts({
        artifacts: artifacts!.artifacts.filter(
          (artifact) => artifact.artifact_id !== artifactId,
        ),
      });
      setDeletingIds(deletingIds.filter((id) => id !== artifactId));
    }
  };

  return artifacts === null ? (
    <div className="my-4 w-full flex justify-center">
      <Spinner />
    </div>
  ) : (
    <div className="my-4">
      {artifacts.artifacts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 mx-auto">
          {artifacts.artifacts.map((artifact) => (
            <div
              key={artifact.artifact_id}
              className="bg-background rounded-lg p-2 relative"
            >
              <img
                src={artifact.url}
                alt={artifact.name}
                className="rounded-lg w-full aspect-square"
              />
              {edit && (
                <Button
                  onClick={() => onDelete(artifact.artifact_id)}
                  variant="destructive"
                  className="absolute top-5 right-5 rounded-full"
                  disabled={deletingIds.includes(artifact.artifact_id)}
                >
                  <FaTimes />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {edit && (
        <ListingUpload
          listingId={listingId}
          onUpload={(artifact) => {
            setArtifacts({
              artifacts: [...artifacts.artifacts, artifact.artifact],
            });
          }}
        />
      )}
    </div>
  );
};

export default ListingArtifacts;
