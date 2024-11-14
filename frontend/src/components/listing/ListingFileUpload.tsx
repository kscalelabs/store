import { useCallback, useState } from "react";
import { DropzoneOptions } from "react-dropzone";

import {
  FileInput,
  FileSubmitButton,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/listing/FileUpload";
import { Artifact } from "@/components/listing/types";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { Paperclip } from "lucide-react";

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
        addArtifacts(data.artifacts);
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
    <FileUploader
      value={files}
      onValueChange={setFiles}
      dropzoneOptions={dropzoneOptions}
      className="relative bg-background mt-4 rounded-lg"
    >
      <FileInput>
        <div className="flex justify-center w-full h-32">
          <div className="align-middle h-full justify-center flex flex-col">
            <div className="text-center">{description}</div>
            {fileExtensions && (
              <div className="text-center">
                File extensions: {fileExtensions.join(", ")}
              </div>
            )}
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
