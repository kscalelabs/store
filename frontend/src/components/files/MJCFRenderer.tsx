import { useEffect, useRef, useState } from "react";

import humanoid from "@/components/files/demo/humanoid.xml";
import { humanReadableError } from "@/hooks/useAlertQueue";
import { mujoco } from "@/lib/mujoco/mujoco_wasm";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import Spinner from "../ui/Spinner";
import {
  MujocoRefs,
  cleanupMujoco,
  initializeMujoco,
  initializeThreeJS,
} from "./mujoco/mujoco";

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

  // Additional refs specific to this renderer
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);

  // State management
  const [leftLegAngle, setLeftLegAngle] = useState(0);
  const [rightLegAngle, setRightLegAngle] = useState(0);
  const isSimulatingRef = useRef(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const mujocoTimeRef = useRef(0);
  const [isMujocoReady, setIsMujocoReady] = useState(false);
  const [showControls, setShowControls] = useState(useControls);
  const [jointLimits, setJointLimits] = useState<{
    [key: string]: { min: number; max: number };
  }>({});
  const [error, setError] = useState<Error | null>(null);

  // Constants
  const DEFAULT_TIMESTEP = 0.002;
  const SWING_FREQUENCY = 2.0;
  const SWING_AMPLITUDE = 0.8;

  const setupModelGeometry = () => {
    if (!refs.sceneRef.current) return;

    // Setup basic geometries
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x808080 });

    leftLegRef.current = new THREE.Mesh(geometry, material);
    rightLegRef.current = new THREE.Mesh(geometry, material);

    refs.sceneRef.current.add(leftLegRef.current);
    refs.sceneRef.current.add(rightLegRef.current);
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
    setIsSimulating(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    (async () => {
      try {
        // Initialize MuJoCo with the humanoid model
        if (
          !(await initializeMujoco({
            modelXML: humanoid,
            refs,
            onInitialized: () => setIsMujocoReady(true),
            onError: (error) => setError(error),
          }))
        ) {
          return;
        }

        // Initialize Three.js scene
        if (
          !(await initializeThreeJS(refs, containerRef, {
            onError: (error) => setError(error),
          }))
        ) {
          return;
        }

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
