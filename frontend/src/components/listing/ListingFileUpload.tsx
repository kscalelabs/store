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
  accept: {
    [key: string]: string[];
  };
  maxSize: number;
  listingId: string;
  onUpload: (artifact: components["schemas"]["UploadArtifactResponse"]) => void;
}

const ListingFileUpload = (props: Props) => {
  const { accept, maxSize, listingId, onUpload } = props;

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
      const { data, error } = await auth.api.upload(files, {
        listing_id: listingId,
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setFiles(null);
        onUpload(data);
      }
      setUploading(false);
    })();
  }, [files, auth, listingId, addErrorAlert]);

  const fileExtensions = Object.values(accept).flat();

  return uploading ? (
    <div className="w-full flex justify-center mt-4">
      <Spinner />
    </div>
  ) : (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      dropzoneOptions={{
        accept,
        maxSize,
      }}
      className="relative bg-background mt-4 rounded-lg"
    >
      <FileInput>
        <div className="flex justify-center w-full h-32">
          <div className="align-middle h-full justify-center flex flex-col">
            <div className="text-center">Drag and drop or click to browse</div>
            <div className="text-center">
              File extensions: {fileExtensions.join(", ")}
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
