import { Suspense, useEffect, useRef, useState } from "react";

import { Plane } from "@react-three/drei";
import { Center, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { Paperclip } from "lucide-react";
import { Group } from "three";
import URDFLoader from "urdf-loader";

import {
  FileInput,
  FileSubmitButton,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "components/listing/FileUpload";
import Loader from "components/listing/Loader";
import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";

type UrdfResponseType = components["schemas"]["UrdfResponse"];

interface UrdfModelProps {
  url: string;
}

const UrdfModel = ({ url }: UrdfModelProps) => {
  const ref = useRef<Group>();
  const geom = useLoader(URDFLoader, url);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <primitive
          ref={ref}
          object={geom}
          position={[0, 0, 0]}
          dispose={null}
          castShadow
        />
      </mesh>
      <Plane receiveShadow rotation={[0, 0, 0]} args={[100, 100]}>
        <shadowMaterial opacity={0.25} />
      </Plane>
    </group>
  );
};

interface Props {
  listingId: string;
  edit: boolean;
}

const ListingUrdf = (props: Props) => {
  const { listingId, edit } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [urdf, setUrdf] = useState<UrdfResponseType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [files, setFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (urdf !== null) {
      return;
    }

    (async () => {
      const { data, error } = await auth.client.GET("/urdf/info/{listing_id}", {
        params: {
          path: {
            listing_id: listingId,
          },
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setUrdf(data);
      }
    })();
  }, [listingId, urdf]);

  const onDelete = async () => {
    if (urdf === null) {
      return;
    }

    const { error } = await auth.client.DELETE("/urdf/delete/{listing_id}", {
      params: {
        path: {
          listing_id: listingId,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      setUrdf(null);
    }
  };

  const onUpload = async () => {
    if (files === null) {
      return;
    }

    if (files.length !== 1) {
      addErrorAlert("Please upload a single file");
      return;
    }

    setUploading(true);
    const { data, error } = await auth.api.uploadUrdf(files[0], listingId);

    if (error) {
      addErrorAlert(error);
    } else {
      setUrdf(data);
    }
    setUploading(false);
  };

  return urdf !== null || edit ? (
    <div className="flex flex-col space-y-2 w-full mt-4">
      {urdf === null ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        urdf.urdf !== null && (
          <>
            <Canvas className="aspect-square rounded-lg">
              <PerspectiveCamera
                makeDefault
                fov={50}
                aspect={window.innerWidth / window.innerHeight}
                position={[1, 1, 0]}
                up={[0, 0, 1]}
                near={0.1}
                far={14}
              ></PerspectiveCamera>
              <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
              <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
              <OrbitControls zoomSpeed={0.2} />
              <Suspense fallback={<Loader />}>
                <Center>
                  <UrdfModel url={urdf.urdf.url} />
                </Center>
              </Suspense>
            </Canvas>

            {/* Delete button */}
            {edit && (
              <div className="flex flex-row gap-2 justify-center">
                {confirmDelete ? (
                  <>
                    <Button
                      onClick={onDelete}
                      variant="destructive"
                      className="rounded-full"
                    >
                      <code>confirm</code>
                    </Button>
                    <Button
                      onClick={() => setConfirmDelete(false)}
                      variant="secondary"
                      className="rounded-full"
                    >
                      <code>cancel</code>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setConfirmDelete(true)}
                    variant="secondary"
                    className="rounded-full"
                  >
                    <code>delete</code>
                  </Button>
                )}
              </div>
            )}
          </>
        )
      )}

      {/* Upload */}
      {edit && (
        <FileUploader
          value={files}
          onValueChange={setFiles}
          dropzoneOptions={{
            accept: {
              "application/gzip": [".tar.gz", ".tgz"],
              "application/zip": [".zip"],
            },
            maxSize: 25 * 1024 * 1024,
            maxFiles: 1,
          }}
          className="relative bg-background mt-4 rounded-lg"
        >
          <FileInput>
            <div className="flex justify-center w-full h-32">
              <div className="align-middle h-full justify-center flex flex-col">
                <div className="text-center">Upload a new URDF</div>
                <div className="text-center">
                  File extensions: .zip, .tgz, .tar.gz
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
            <FileSubmitButton onClick={onUpload}>
              <span>Upload</span>
            </FileSubmitButton>
          )}
        </FileUploader>
      )}
    </div>
  ) : null;
};

export default ListingUrdf;
