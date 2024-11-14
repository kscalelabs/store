import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCompress,
  FaExpand,
  FaPause,
  FaPlay,
  FaUndo,
} from "react-icons/fa";

import {
  MujocoRefs,
  cleanupMujoco,
  getJointNames,
  initializeMujoco,
  initializeThreeJS,
  resetJoints,
  setupModelGeometry,
  setupScene,
  updateBodyTransforms,
} from "@/components/files/mujoco/mujoco";
import { UntarredFile } from "@/components/files/untar";
import Spinner from "@/components/ui/Spinner";
import { humanReadableError } from "@/hooks/useAlertQueue";
import { mujoco } from "@/lib/mujoco/mujoco_wasm";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface Props {
  mjcfContent: string;
  files?: UntarredFile[];
  useControls?: boolean;
}

const MJCFRenderer = ({ mjcfContent, files, useControls = true }: Props) => {
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
  const [errorToShow, setErrorToShow] = useState<Error | null>(null);

  // Constants
  const DEFAULT_TIMESTEP = 0.002;

  // Add new state for sidebar visibility
  const [showControls, setShowControls] = useState(true);

  // Add state for simulation control
  const [isSimulating, setIsSimulating] = useState(false);

  // Add new state for joint controls
  const [joints, setJoints] = useState<{ name: string; value: number }[]>([]);

  // Add new state for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = useCallback(() => {
    if (!parentRef.current) return;

    if (!document.fullscreenElement) {
      parentRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Add function to update joint positions
  const updateJointPosition = (index: number, value: number) => {
    if (
      refs.stateRef.current &&
      refs.simulationRef.current &&
      refs.modelRef.current
    ) {
      const qposAddr = refs.modelRef.current.jnt_qposadr[index];
      refs.simulationRef.current.qpos[qposAddr] = value;
      refs.simulationRef.current.forward();
      updateBodyTransforms(refs);

      // Update state
      setJoints((prev) =>
        prev.map((joint, i) => (i === index ? { ...joint, value } : joint)),
      );
    }
  };

  const animate = (time: number) => {
    if (
      !refs.rendererRef.current ||
      !refs.sceneRef.current ||
      !refs.cameraRef.current
    )
      return;

    // Update physics if simulating
    if (isSimulatingRef.current && refs.simulationRef.current) {
      const timestep = DEFAULT_TIMESTEP;
      if (time - mujocoTimeRef.current > 35.0) {
        mujocoTimeRef.current = time;
      }

      while (mujocoTimeRef.current < time) {
        refs.simulationRef.current.step();
        mujocoTimeRef.current += timestep * 1000.0;
      }

      // Update body transforms after physics step
      updateBodyTransforms(refs);
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
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopPhysicsSimulation = () => {
    isSimulatingRef.current = false;
    setIsSimulating(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Add a function to start physics simulation
  const startPhysicsSimulation = () => {
    isSimulatingRef.current = true;
    setIsSimulating(true);
    animate(performance.now());
  };

  // Toggle simulation function
  const toggleSimulation = () => {
    if (isSimulating) {
      stopPhysicsSimulation();
    } else {
      startPhysicsSimulation();
    }
  };

  // Add function to restart simulation
  const restartSimulation = () => {
    if (refs.stateRef.current && refs.simulationRef.current) {
      refs.simulationRef.current.resetData();
      refs.simulationRef.current.forward();
      updateBodyTransforms(refs);

      // Reset joint slider values
      if (refs.modelRef.current) {
        setJoints(resetJoints(refs, joints));
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Define handleResize first
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

    // Then define cleanup
    const cleanup = () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanupMujoco(refs);
      stopPhysicsSimulation();
      Object.keys(refs).forEach((key) => {
        refs[key as keyof MujocoRefs].current = null;
      });
    };

    // Rest of the effect remains the same...
    cleanup();

    (async () => {
      try {
        if (!containerRef.current) throw new Error("Container ref is null");

        // Initialize MuJoCo with the humanoid model
        const { mj, model, state, simulation } = await initializeMujoco({
          modelXML: mjcfContent,
          files: files ?? [],
        });

        // Only set refs if component is still mounted
        if (containerRef.current) {
          refs.mujocoRef.current = mj;
          refs.modelRef.current = model;
          refs.stateRef.current = state;
          refs.simulationRef.current = simulation;

          // Initialize Three.js scene
          const { renderer, scene, camera, controls } = initializeThreeJS(
            containerRef.current,
            {
              backgroundColor: new THREE.Color("#f0f0f0"),
            },
          );

          // Add camera positioning
          camera.position.set(2, 2, 2); // Set initial camera position
          camera.lookAt(0, 0, 0);

          // Configure controls
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.maxDistance = 10;
          controls.minDistance = 0.5;

          refs.rendererRef.current = renderer;
          refs.sceneRef.current = scene;
          refs.cameraRef.current = camera;
          refs.controlsRef.current = controls;

          // Add model-specific setup (bodies, geometries, etc.)
          setupModelGeometry(refs);
          setupScene(refs);
          setIsMujocoReady(true);

          // Get joint names and set initial joint values.
          if (mj) {
            setJoints(getJointNames(refs, mj));
          }

          // Start animation loop.
          animate(performance.now());

          isSimulatingRef.current = false;
          setIsSimulating(false);
        }
      } catch (error) {
        setErrorToShow(error as Error);
      }
    })();

    window.addEventListener("resize", handleResize);

    // Add fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      // ... existing cleanup code ...
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []); // Empty dependency array

  return (
    <div
      ref={parentRef}
      className={`relative ${isFullscreen ? "h-screen" : "h-full"}`}
    >
      {errorToShow && (
        <div className="flex justify-center items-center w-full h-full">
          <div className="text-red-500 font-mono p-4">
            {errorToShow.name}: {humanReadableError(errorToShow)}
          </div>
        </div>
      )}

      {!isMujocoReady && (
        <div className="flex justify-center items-center w-full h-full">
          <Spinner />
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {useControls && showControls && (
        <div className="absolute top-0 right-0 bottom-0 w-64 z-30">
          <div className="h-full overflow-y-auto bg-[#f0f0f0]">
            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-4">
                {/* Add notification banner */}
                {!mjcfContent && (
                  <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
                    <p className="text-sm">
                      This is a placeholder for the MuJoco renderer, which is
                      still a work in progress. If you would like to contribute,
                      see the project source code{" "}
                      <a
                        className="text-gray-11"
                        target="_blank"
                        rel="noreferrer"
                        href="https://github.com/kscalelabs/urdf2mjcf"
                      >
                        here
                      </a>
                      .
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowControls(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaChevronRight className="inline-block" />
                  Hide Controls
                </button>

                {/* Add joint controls */}
                <div className="space-y-2">
                  <h3 className="font-bold text-[#333]">Joint Controls</h3>
                  {joints.map((joint, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-medium text-[#333]">
                          {joint.name}
                        </label>
                        <span className="text-xs text-[#333]">
                          {joint.value.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-3.14"
                        max="3.14"
                        step="0.01"
                        value={joint.value}
                        onChange={(e) =>
                          updateJointPosition(index, parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-[#333] mt-1">
                        <span>{"-3.14"}</span>
                        <span>{"3.14"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {useControls && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 right-4 z-30 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full shadow-md"
        >
          <FaChevronLeft />
        </button>
      )}

      <div className="absolute bottom-4 left-4 z-50 flex gap-2">
        <button
          onClick={toggleSimulation}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
        >
          {isSimulating ? <FaPause /> : <FaPlay />}
        </button>
        <button
          onClick={restartSimulation}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
        >
          <FaUndo />
        </button>
        <button
          onClick={toggleFullScreen}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
};

export default MJCFRenderer;
