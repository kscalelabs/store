import { useEffect, useState } from "react";

import URDFRenderer from "@/components/files/URDFRenderer";
import { UntarredFile, untarFile } from "@/components/files/untar";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

interface Props {
  listingId: string;
}

const TerminalRobotModel = ({ listingId }: Props) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [urdfUrl, setUrdfUrl] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [untarredFiles, setUntarredFiles] = useState<
    [UntarredFile[], UntarredFile] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsFetching(true);
      try {
        const { data, error } = await auth.client.GET(
          "/robots/urdf/{listing_id}",
          {
            params: {
              path: { listing_id: listingId },
            },
          },
        );
        if (error) {
          addErrorAlert(error);
        } else {
          setUrdfUrl(data.urdf_url);
        }
      } catch (error) {
        addErrorAlert(error);
      } finally {
        setIsFetching(false);
      }
    })();
  }, [listingId]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (!urdfUrl) {
        setIsLoading(false);
        return;
      }
      const files = await untarFile(urdfUrl);
      const firstUrdfFile = files.find((file) => file.name.endsWith(".urdf"));
      if (!firstUrdfFile) {
        addErrorAlert("No URDF file found in the tarball");
      } else {
        setUntarredFiles([files, firstUrdfFile]);
      }
      setIsLoading(false);
    })();
  }, [urdfUrl]);

  if (isFetching || isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (untarredFiles === null) {
    return (
      <div className="flex justify-center items-center h-full">
        <div>Model not found</div>
      </div>
    );
  }

  const [files, urdfFile] = untarredFiles;

  return (
    <URDFRenderer
      urdfContent={new TextDecoder().decode(urdfFile.content)}
      files={files}
      supportedThemes={["dark"]}
      showWireframe={true}
      useControls={true}
    />
  );
};

export default TerminalRobotModel;
