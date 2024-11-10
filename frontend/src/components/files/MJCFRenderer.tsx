import { useEffect, useRef, useState } from "react";

import humanoid from "@/components/files/demo/humanoid.xml";
import {
  MujocoRefs,
  cleanupMujoco,
  initializeMujoco,
  initializeThreeJS,
} from "@/components/files/mujoco/mujoco";
import Spinner from "@/components/ui/Spinner";
import { humanReadableError } from "@/hooks/useAlertQueue";
import { mujoco } from "@/lib/mujoco/mujoco_wasm";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface Props {
  useControls?: boolean;
}

const MJCFRenderer = ({ useControls = true }: Props) => {
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Create refs object for MuJoCo and Three.js
  const refs: MujocoRefs = {
    mujocoRef: useRef<mujoco | null>(null),
    modelRef: useRef<InstanceType<mujoco["Model"]> | null>(null),
    stateRef: useRef<InstanceType<mujoco["State"]> | null>(null),
    simulationRef: useRef<InstanceType<mujoco["Simulation"]> | null>(null),
    rendererRef: useRef<THREE.WebGLRenderer | null>(null),
    sceneRef: useRef<THREE.Scene | null>(null),
    cameraRef: useRef<THREE.PerspectiveCamera | null>(null),
    controlsRef: useRef<OrbitControls | null>(null),
  };

  // State management
  const isSimulatingRef = useRef(false);
  const mujocoTimeRef = useRef(0);
  const [isMujocoReady, setIsMujocoReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Constants
  const DEFAULT_TIMESTEP = 0.01;

  const setupModelGeometry = () => {
    const { sceneRef, modelRef } = refs;
    if (!sceneRef.current || !modelRef.current) return;
    const model = modelRef.current;

    // Loop over all geoms in the model
    for (let i = 0; i < model.ngeom; i++) {
      // Get geom properties from the model
      const geomType = model.geom_type[i];
      const geomSize = model.geom_size.subarray(i * 3, i * 3 + 3);
      const geomPos = model.geom_pos.subarray(i * 3, i * 3 + 3);
      const geomMat = model.geom_mat.subarray(i * 9, i * 9 + 9);

      // Create corresponding Three.js geometry
      let geometry: THREE.BufferGeometry;
      switch (geomType) {
        case mj.mjtGeom.mjGEOM_BOX:
          geometry = new THREE.BoxGeometry(
            geomSize[0] * 2,
            geomSize[1] * 2,
            geomSize[2] * 2,
          );
          break;
        case mj.mjtGeom.mjGEOM_SPHERE:
          geometry = new THREE.SphereGeometry(geomSize[0], 32, 32);
          break;
        case mj.mjtGeom.mjGEOM_CYLINDER:
          geometry = new THREE.CylinderGeometry(
            geomSize[0],
            geomSize[0],
            geomSize[1] * 2,
            32,
          );
          break;
        // Add cases for other geom types as needed
        default:
          console.warn(`Unsupported geom type: ${geomType}`);
          continue;
      }

      // Create material (you can customize this based on geom properties)
      const material = new THREE.MeshPhongMaterial({ color: 0x808080 });

      // Create mesh and set initial position and orientation
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(geomPos[0], geomPos[1], geomPos[2]);

      // Set orientation from geomMat
      const rotationMatrix = new THREE.Matrix4().fromArray([
        geomMat[0],
        geomMat[3],
        geomMat[6],
        0,
        geomMat[1],
        geomMat[4],
        geomMat[7],
        0,
        geomMat[2],
        geomMat[5],
        geomMat[8],
        0,
        0,
        0,
        0,
        1,
      ]);
      mesh.setRotationFromMatrix(rotationMatrix);

      // Store geom index for later updates
      mesh.userData.geomIndex = i;

      // Add mesh to the scene
      sceneRef.current.add(mesh);
    }
  };

  const animate = (time: number) => {
    if (
      !refs.rendererRef.current ||
      !refs.sceneRef.current ||
      !refs.cameraRef.current
    ) {
      return;
    }

    // Update physics if simulating
    if (isSimulatingRef.current && refs.simulationRef.current) {
      mujocoTimeRef.current += DEFAULT_TIMESTEP;
      refs.simulationRef.current.step();
    }

    // Update controls if enabled
    if (useControls && refs.controlsRef.current) {
      refs.controlsRef.current.update();
    }

    // Render the scene
    refs.rendererRef.current.render(
      refs.sceneRef.current,
      refs.cameraRef.current,
    );

    // Request next frame
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopPhysicsSimulation = () => {
    isSimulatingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    (async () => {
      try {
        if (!containerRef.current) throw new Error("Container ref is null");

        // Initialize MuJoCo with the humanoid model
        const { mj, model, state, simulation } = await initializeMujoco({
          modelXML: humanoid,
          refs,
        });
        refs.mujocoRef.current = mj;
        refs.modelRef.current = model;
        refs.stateRef.current = state;
        refs.simulationRef.current = simulation;

        // Initialize Three.js scene
        const { renderer, scene, camera, controls } = initializeThreeJS(
          containerRef.current,
        );
        refs.rendererRef.current = renderer;
        refs.sceneRef.current = scene;
        refs.cameraRef.current = camera;
        refs.controlsRef.current = controls;

        // Add model-specific setup (bodies, geometries, etc.)
        setupModelGeometry();

        // Start animation loop
        animate(performance.now());
      } catch (error) {
        setError(error as Error);
      }
    })();

    // Handle window resize
    const handleResize = () => {
      if (
        refs.rendererRef.current &&
        refs.cameraRef.current &&
        containerRef.current
      ) {
        refs.cameraRef.current.aspect =
          containerRef.current.clientWidth / containerRef.current.clientHeight;
        refs.cameraRef.current.updateProjectionMatrix();
        refs.rendererRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanupMujoco(refs);
      stopPhysicsSimulation();
    };
  }, [useControls, containerRef.current]);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {!isMujocoReady && (
        <div className="flex justify-center items-center w-full h-full">
          <Spinner />
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center w-full h-full">
          <div className="text-red-500">{humanReadableError(error)}</div>
        </div>
      )}
    </div>
  );
};

export default MJCFRenderer;
