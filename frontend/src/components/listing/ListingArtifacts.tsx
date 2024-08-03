import Carousel from "components/ui/Carousel";
import { FileSvgDraw } from "components/ui/FileSvgDraw";
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "components/ui/FileUpload";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { FileInput, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  listingId: string;
  // TODO: If can edit, allow the user to add and delete artifacts.
  edit: boolean;
}

const ListingArtifacts = (props: Props) => {
  const { listingId, edit } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [files, setFiles] = useState<File[] | null>(null);

  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"] | null
  >(null);

  useEffect(() => {
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
  }, [listingId]);

  if (artifacts != null && artifacts.artifacts.length > 0) {
    return (
      <>
        <Carousel
          items={artifacts.artifacts.map((artifact) => {
            return {
              url: artifact.url,
              caption: artifact.name,
            };
          })}
        />
        {edit ?? (
          <div>
            <FileUploader
              value={files}
              onValueChange={setFiles}
              dropzoneOptions={{
                maxFiles: 5,
                maxSize: 1024 * 1024 * 4,
                multiple: true,
              }}
              className="relative bg-background rounded-lg p-2"
            >
              <FileInput className="outline-dashed outline-1 outline-white">
                <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
                  <FileSvgDraw />
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
            </FileUploader>
          </div>
        )}
      </>
    );
  } else {
    return <></>;
  }
};

export default ListingArtifacts;
