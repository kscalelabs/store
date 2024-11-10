import { Suspense, useRef, useState } from "react";

import Loader from "@/components/listing/Loader";
import { Button } from "@/components/ui/button";
import { Center, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { cx } from "class-variance-authority";
import { Group } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

interface ObjModelProps {
  url: string;
}

const ObjModel = ({ url }: ObjModelProps) => {
  const groupRef = useRef<Group>(null);
  const geom = useLoader(OBJLoader, url);

  return (
    // eslint-disable-next-line react/no-unknown-property
    <group ref={groupRef} scale={[0.5, 0.5, 0.5]} position={[0, 0, 0]}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <primitive object={geom} />
    </group>
  );
};

interface ModelProps {
  url: string;
  kind: "obj";
}

const Model = ({ url, kind }: ModelProps) => {
  switch (kind) {
    case "obj":
      return <ObjModel url={url} />;
    default:
      return null;
  }
};

interface Props {
  url: string;
  name: string;
  edit?: boolean;
  onDelete?: () => void;
  disabled?: boolean;
  kind: "obj";
}

const MeshRenderer = ({ url, name, edit, onDelete, disabled, kind }: Props) => {
  const [clickedCopyButton, setClickedCopyButton] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col space-y-2 w-full mt-4">
      {/* Title */}
      <div className="flex justify-center">
        <h2 className="text-lg">{name}</h2>
      </div>

      {/* Canvas */}
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
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
        <OrbitControls zoomSpeed={0.2} />
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={url} kind={kind} />
          </Center>
        </Suspense>
      </Canvas>

      {/* Button grid */}
      <div
        className={cx(
          "grid grid-cols-1 gap-2 md:gap-4 mx-auto w-full",
          edit ? "md:grid-cols-2" : "md:grid-cols-1",
        )}
      >
        <div className="group relative">
          <Button
            onClick={() => {
              setClickedCopyButton(true);
              navigator.clipboard.writeText(url);

              setTimeout(() => {
                setClickedCopyButton(false);
              }, 1000);
            }}
            variant="default"
            className="rounded-full w-full"
            disabled={clickedCopyButton}
          >
            <code>{clickedCopyButton ? "copied!" : "copy url"}</code>
          </Button>
        </div>

        {edit && (
          <>
            <Button
              onClick={() => setConfirmDelete(true)}
              variant="default"
              className="rounded-full"
              disabled={disabled ?? false}
            >
              <code>delete</code>
            </Button>
            {confirmDelete && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="bg-gray-1 rounded-lg shadow-lg p-4">
                  <p className="text-lg mb-2">
                    Are you sure you want to delete this artifact?
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => {
                        onDelete?.();
                        setConfirmDelete(false);
                      }}
                      variant="default"
                    >
                      <code>yes</code>
                    </Button>
                    <Button
                      onClick={() => setConfirmDelete(false)}
                      variant="default"
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
    </div>
  );
};

export default MeshRenderer;
