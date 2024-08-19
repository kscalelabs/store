import { Suspense, useEffect, useRef, useState } from "react";

import { Plane } from "@react-three/drei";
import { Center, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { Group } from "three";
import URDFLoader from "urdf-loader";

import Loader from "components/listing/Loader";
import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";

import ListingFileUpload from "./ListingFileUpload";

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

  return urdf !== null || edit ? (
    <div className="flex flex-col space-y-2 w-full mt-4">
      {/* Title */}
      <div className="flex justify-center">
        <h2 className="text-lg">{listingId}</h2>
      </div>

      {/* Canvas */}
      {urdf === null ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        urdf.urdf !== null && (
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
        )
      )}

      {/* Delete button */}
      {edit && (
        <>
          <Button
            onClick={() => setConfirmDelete(true)}
            variant="secondary"
            className="rounded-full"
          >
            <code>delete</code>
          </Button>
          {confirmDelete && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                <p className="text-lg mb-2">
                  Are you sure you want to delete the listing URDF?
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={async () => {
                      await onDelete();
                      setConfirmDelete(false);
                    }}
                    variant="secondary"
                  >
                    <code>yes</code>
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(false)}
                    variant="secondary"
                  >
                    <code>no</code>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  ) : null;
};

export default ListingUrdf;
