/* eslint-disable */
// @ts-nocheck
import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import URDFLoader from "urdf-loader";

interface LoadModelProps {
  filepath: string;
  packages: string[] | null;
}

const LoadModel: React.FC<LoadModelProps> = ({ filepath, packages }) => {
  const ref = useRef<THREE.Object3D | null>(null);
  //@ts-ignore
  const robot = useLoader(URDFLoader, filepath, (loader) => {
    // Configure loader
    loader.loadMeshFunc = (
      path: string,
      manager: THREE.LoadingManager,
      done: (mesh: THREE.Object3D | null, err?: Error | undefined) => void,
    ) => {
      new STLLoader(manager).load(
        path,
        (result) => {
          const material = new THREE.MeshPhongMaterial();
          const mesh = new THREE.Mesh(result, material);
          done(mesh);
        },
        undefined,
        (err) => done(null, err as Error | undefined),
      );
    };
    loader.fetchOptions = {
      headers: { Accept: "application/vnd.github.v3.raw" },
    };

    loader.packages = loader.packages || {};

    // loader.packages = {
    //     "r2_description":
    //         "https://raw.githubusercontent.com/gkjohnson/nasa-urdf-robots/master/r2_description",
    // };
    if (packages) {
      for (let i = 0; i < packages.length; i += 2) {
        loader.packages[packages[i]] = packages[i + 1];
      }
    }
  });

  // Check for load errors
  if (!robot) {
    throw new Error("Failed to load model");
  }

  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-0.5 * Math.PI, 0, Math.PI]}
      scale={[10, 10, 10]}
    >
      <primitive ref={ref} object={robot} dispose={null} />
    </mesh>
  );
};
interface URDFComponentProps {
  url: string | null;
  packages: string[] | null;
}
export const InputerURDFComponent: React.FC<URDFComponentProps> = ({
  url,
  packages,
}) => {
  const modelPath = url ? url : "";
  // "https://raw.githubusercontent.com/vrtnis/robot-web-viewer/main/public/urdf/robot.urdf";
  // "https://raw.githubusercontent.com/gkjohnson/nasa-urdf-robots/master/r2_description/robots/r2c1.urdf";
  // "https://raw.githubusercontent.com/adubredu/DigitRobot.jl/main/urdf/digit_model.urdf";
  // "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/atlas_description/urdf/atlas_v4_with_multisense.urdf";
  // "https://raw.githubusercontent.com/vrtnis/robot-web-viewer/main/public/urdf/robot.urdf";

  const containerStyle = {
    width: "50vw",
    height: "50vh",
    backgroundColor: "#272727",
  };
  return (
    <div style={containerStyle}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <ambientLight intensity={0.5} />
        <hemisphereLight
          color={"#455A64"}
          groundColor={"#000"}
          intensity={0.5}
          position={[0, 1, 0]}
        />
        <directionalLight
          color={0xffffff}
          position={[4, 10, 1]}
          shadow-mapWidth={2048}
          shadow-mapHeight={2048}
          castShadow
        />
        <Suspense fallback={null}>
          <LoadModel
            filepath={modelPath}
            packages={packages}
            key={`${modelPath}-${packages?.join(",")}`}
          />
        </Suspense>
        <OrbitControls zoomSpeed={0.3} />
        <axesHelper />
      </Canvas>
    </div>
  );
};
