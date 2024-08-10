import { Suspense, useState } from "react";
import { FaTimes } from "react-icons/fa";

import { Center, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

import Loader from "components/listing/renderers/Loader";
import { Button } from "components/ui/Button/Button";

type MeshType = "wireframe" | "basic";

const MeshTypes: MeshType[] = ["wireframe", "basic"];

interface ModelProps {
  url: string;
  meshType: MeshType;
}

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

const Model = ({ url, meshType }: ModelProps) => {
  const geom = useLoader(STLLoader, url);

  return (
    <mesh scale={1.2} castShadow receiveShadow>
      <primitive attach="geometry" object={geom}></primitive>
      {getMaterial(meshType)}
    </mesh>
  );
};

interface Props {
  url: string;
  edit?: boolean;
  onDelete?: () => void;
  disabled?: boolean;
}

const StlRenderer = ({ url, edit, onDelete, disabled }: Props) => {
  const [meshType, setMeshType] = useState<MeshType>("basic");

  return (
    <>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          fov={50}
          aspect={window.innerWidth / window.innerHeight}
          position={[25, 25, 0]}
          up={[0, 0, 1]}
          near={0.1}
          far={500}></PerspectiveCamera>
        <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
        <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
        <OrbitControls zoomSpeed={0.2} />
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={url} meshType={meshType} />
          </Center>
        </Suspense>
      </Canvas>
      {edit && (
        <Button
          onClick={onDelete}
          variant="destructive"
          className="absolute top-5 right-5 rounded-full"
          disabled={disabled ?? false}>
          <FaTimes />
        </Button>
      )}
      <Button
        onClick={() => {
          setMeshType(
            MeshTypes[(MeshTypes.indexOf(meshType) + 1) % MeshTypes.length],
          );
        }}
        variant="outline"
        className="absolute bottom-5 right-5 rounded-full">
        <code>{meshType}</code>
      </Button>
    </>
  );
};

export default StlRenderer;
