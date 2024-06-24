import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import URDFLoader from "urdf-loader";

interface LoadModelProps {
  filepath: string;
}

const LoadModel: React.FC<LoadModelProps> = ({ filepath }) => {
  const ref = useRef<THREE.Object3D | null>(null);

  /* eslint-disable */
  // @ts-ignore
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
      packages: {} as { [key: string]: string },
    };
    if (typeof loader.packages !== "object") {
      loader.packages = {};
    }
    const urls = [
      "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/atlas_description/urdf/atlas_v4_with_multisense.urdf",
      "atlas_description",
      "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/atlas_description",
    ];
    for (let i = 0; i < urls.length; i += 2) {
      loader.packages[urls[i]] = urls[i + 1];
    }
    // loader.packages = {
    //   atlas_description:
    //     "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/atlas_description",
    //   r2_description:
    //     "https://raw.githubusercontent.com/gkjohnson/nasa-urdf-robots/master/r2_description",
    //   urdf: "https://raw.githubusercontent.com/adubredu/DigitRobot.jl/main/urdf",
    //   multisense_sl_description:
    //     "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/multisense_sl_description",
    // };
  }) as THREE.Group;

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

export const URDFComponent = () => {
  // Parse URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const modelPath =
    urlParams.get("filepath") ||
    // "https://raw.githubusercontent.com/gkjohnson/nasa-urdf-robots/master/r2_description/robots/r2c1.urdf";
    // "https://raw.githubusercontent.com/adubredu/DigitRobot.jl/main/urdf/digit_model.urdf";
    "https://raw.githubusercontent.com/openai/roboschool/1.0.49/roboschool/models_robot/atlas_description/urdf/atlas_v4_with_multisense.urdf";
  // "https://raw.githubusercontent.com/vrtnis/robot-web-viewer/main/public/urdf/robot.urdf";
  // "https://raw.githubusercontent.com/is2ac2/URDF/main/urdf/robot.urdf";

  const containerStyle = {
    width: "50vw",
    height: "50vh",
    backgroundColor: "#272727",
  };
  return (
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
        <LoadModel filepath={modelPath} />
      </Suspense>
      <OrbitControls zoomSpeed={0.3} />
      <axesHelper />
    </Canvas>
  );
};
