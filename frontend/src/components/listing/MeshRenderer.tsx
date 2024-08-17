/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/* eslint-disable react/no-unknown-property */
import { Suspense, useRef, useState } from "react";

import {
  Center,
  OrbitControls,
  PerspectiveCamera,
  Plane,
} from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { cx } from "class-variance-authority";
import { Group } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader from "urdf-loader";

import Loader from "components/listing/Loader";
import { Button } from "components/ui/Button/Button";

type MeshType = "wireframe" | "basic";

const MeshTypes: MeshType[] = ["wireframe", "basic"];

const getMaterial = (meshType: MeshType) => {
  switch (meshType) {
    case "wireframe":
      return <meshBasicMaterial attach="material" wireframe />;
    case "basic":
    default:
      return (
        <meshStandardMaterial
          attach="material"
          color="white"
          roughness={0.5}
          metalness={0.5}
        />
      );
  }
};

interface UrdfModelProps {
  url: string;
  meshType: MeshType;
}

const UrdfModel = ({ url, meshType }: UrdfModelProps) => {
  const ref = useRef<Group>();
  const [robot, setRobot] = useState<Group>();

  const loader = new URDFLoader();

  loader.load(url, (robot) => {
    setRobot(robot);
  });

  return robot ? (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={10}
      >
        <primitive
          ref={ref}
          object={robot}
          position={[0, 0, 0]}
          dispose={null}
          castShadow
        />
        {getMaterial(meshType)}
      </mesh>
      <Plane receiveShadow rotation={[0, 0, 0]} args={[1000, 1000]} scale={30}>
        <shadowMaterial opacity={0.25} />
      </Plane>
    </group>
  ) : null;
};

interface StlModelProps {
  url: string;
  meshType: MeshType;
}

const StlModel = ({ url, meshType }: StlModelProps) => {
  const geom = useLoader(STLLoader, url);

  return (
    <mesh scale={1.2} castShadow receiveShadow>
      <primitive attach="geometry" object={geom}></primitive>
      {getMaterial(meshType)}
    </mesh>
  );
};

interface ModelProps {
  url: string;
  meshType: MeshType;
  kind: "stl" | "urdf";
}

const Model = ({ url, meshType, kind }: ModelProps) => {
  switch (kind) {
    case "stl":
      return <StlModel url={url} meshType={meshType} />;
    case "urdf":
      return <UrdfModel url={url} meshType={meshType} />;
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
  kind: "stl" | "urdf";
}

const MeshRenderer = ({ url, name, edit, onDelete, disabled, kind }: Props) => {
  const [meshType, setMeshType] = useState<MeshType>("basic");
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
          position={[25, 25, 0]}
          up={[0, 0, 1]}
          near={0.1}
          far={500}
        ></PerspectiveCamera>
        <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
        <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
        <OrbitControls zoomSpeed={0.2} />
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={url} meshType={meshType} kind={kind} />
          </Center>
        </Suspense>
      </Canvas>

      {/* Button grid */}
      <div
        className={cx(
          "grid grid-cols-1 gap-2 md:gap-4 mx-auto w-full",
          edit ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        <Button
          onClick={() => {
            setMeshType(
              MeshTypes[(MeshTypes.indexOf(meshType) + 1) % MeshTypes.length],
            );
          }}
          variant="secondary"
          className="rounded-full"
        >
          <code>{meshType}</code>
        </Button>
        <div className="group relative">
          <Button
            onClick={() => {
              setClickedCopyButton(true);
              navigator.clipboard.writeText(url);

              setTimeout(() => {
                setClickedCopyButton(false);
              }, 1000);
            }}
            variant="secondary"
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
              variant="secondary"
              className="rounded-full"
              disabled={disabled ?? false}
            >
              <code>delete</code>
            </Button>
            {confirmDelete && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                  <p className="text-lg mb-2">
                    Are you sure you want to delete this artifact?
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => {
                        onDelete?.();
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
    </div>
  );
};

export default MeshRenderer;
