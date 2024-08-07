import { useCallback, useState } from "react";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { Paperclip } from "lucide-react";

import {
  FileInput,
  FileSubmitButton,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "components/listing/FileUpload";
import Spinner from "components/ui/Spinner";

interface Props {
  artifactType: string;
  fileExtensions: string[];
  maxSize: number;
  listingId: string;
  onUpload: (artifact: components["schemas"]["UploadArtifactResponse"]) => void;
}

const ListingFileUpload = (props: Props) => {
  const { artifactType, fileExtensions, maxSize, listingId, onUpload } = props;

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
            artifact_type: artifactType,
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
          "image/*": fileExtensions,
        },
        maxSize,
      }}
      className="relative bg-background rounded-lg pt-4 pb-2 px-2"
    >
      <FileInput>
        <div className="flex justify-center pt-3 pb-4 w-full h-32">
          <div className="text-sm align-middle h-full justify-center flex flex-col">
            <div className="text-center">
              <span>Drag and drop</span>
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

export default ListingFileUpload;
