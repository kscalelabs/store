import { useCallback, useState } from "react";
import { DropzoneOptions } from "react-dropzone";

import {
  FileInput,
  FileSubmitButton,
  FileUploader,
} from "@/components/listing/FileUpload";
import { Artifact } from "@/components/listing/types";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import { SelectedFiles } from "./SelectedFiles";

interface Props {
  description: string;
  listingId: string;
  dropzoneOptions: DropzoneOptions;
  addArtifacts: (artifact: Artifact[]) => void;
}

const ListingFileUpload = (props: Props) => {
  const { description, listingId, dropzoneOptions, addArtifacts } = props;

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
      const { data, error } = await auth.api.upload(files, listingId);

      if (error) {
        addErrorAlert(error);
      } else {
        setFiles(null);

        if (data.artifacts && data.artifacts.length > 0) {
          try {
            await auth.client.PUT("/artifacts/list/{listing_id}/main", {
              params: {
                path: { listing_id: listingId },
                query: {
                  artifact_id: data.artifacts[0].artifact_id,
                },
              },
            });
            addArtifacts(
              data.artifacts.map((a: Artifact, index: number) => ({
                ...a,
                is_main: index === 0,
              })),
            );
          } catch (err) {
            addErrorAlert(err);
            addArtifacts(data.artifacts);
          }
        }
      }
      setUploading(false);
    })();
  }, [files, auth, listingId, addErrorAlert, addArtifacts]);

  const fileExtensions = dropzoneOptions.accept
    ? Object.values(dropzoneOptions.accept).flat()
    : undefined;

  return uploading ? (
    <div className="w-full flex justify-center mt-4">
      <Spinner />
    </div>
  ) : (
    <div onClick={(e) => e.stopPropagation()}>
      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={dropzoneOptions}
        className="relative bg-background mt-4 rounded-lg"
      >
        <FileInput>
          <div className="flex justify-center w-full h-24 bg-gray-11 hover:bg-gray-10">
            <div className="w-full flex flex-col justify-center">
              <div className="text-center">{description}</div>
              {fileExtensions && (
                <div className="text-center text-sm text-gray-7">
                  File extensions: {fileExtensions.join(", ")}
                </div>
              )}
            </div>
          </div>
        </FileInput>

        {files && files.length > 0 && (
          <>
            <SelectedFiles
              files={files}
              onRemove={(index) => {
                const newFiles = files.filter((_, i) => i !== index);
                setFiles(newFiles.length ? newFiles : null);
              }}
            />
            <FileSubmitButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onValueChange();
              }}
              className="mt-2 border border-gray-2 hover:bg-gray-11 bg-gray-12 text-gray-2 rounded-lg"
            >
              <span>Upload</span>
            </FileSubmitButton>
          </>
        )}
      </FileUploader>
    </div>
  );
};

export default ListingFileUpload;
