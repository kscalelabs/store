import { useEffect, useState } from "react";

import { parseTar } from "@/components/files/Tarfile";
import URDFRenderer from "@/components/files/URDFRenderer";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import pako from "pako";

interface Props {
  listingId: string;
}

interface UntarredFile {
  name: string;
  content: Uint8Array;
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
      const response = await fetch(urdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decompressed = pako.ungzip(uint8Array);
      const files = parseTar(decompressed);
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
      useControls={false}
    />
  );
};

export default TerminalRobotModel;
