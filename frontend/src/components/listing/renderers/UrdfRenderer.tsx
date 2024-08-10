/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/* eslint-disable react/no-unknown-property */
import { Suspense, useRef } from "react";
import { FaTimes } from "react-icons/fa";

import {
  Center,
  OrbitControls,
  PerspectiveCamera,
  Plane,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { Group } from "three";
import URDFLoader from "urdf-loader";

import Loader from "components/listing/renderers/Loader";
import { Button } from "components/ui/Button/Button";

interface ModelProps {
  url: string;
}

const Model = ({ url }: ModelProps) => {
  const ref = useRef<Group>();
  const robot = useLoader(URDFLoader, url);

  return (
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
      </mesh>
      <Plane receiveShadow rotation={[0, 0, 0]} args={[1000, 1000]} scale={30}>
        <shadowMaterial opacity={0.25} />
      </Plane>
    </group>
  );
};

interface Props {
  url: string;
  edit?: boolean;
  onDelete?: () => void;
  disabled?: boolean;
}

const UrdfRenderer = ({ url, edit, onDelete, disabled }: Props) => {
  return (
    <>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          fov={50}
          aspect={window.innerWidth / window.innerHeight}
          position={[25, 25, 25]}
          up={[0, 0, 1]}
          near={0.1}
          far={500}
        ></PerspectiveCamera>
        <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
        <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
        <OrbitControls zoomSpeed={0.2} />
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={url} />
          </Center>
        </Suspense>
      </Canvas>
      {edit && (
        <Button
          onClick={onDelete}
          variant="destructive"
          className="absolute top-5 right-5 rounded-full"
          disabled={disabled ?? false}
        >
          <FaTimes />
        </Button>
      )}
    </>
  );
};

export default UrdfRenderer;
