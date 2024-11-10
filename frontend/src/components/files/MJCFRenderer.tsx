import { useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPause,
  FaPlay,
  FaUndo,
} from "react-icons/fa";

import humanoid from "@/components/files/demo/humanoid.xml";
import {
  MujocoRefs,
  cleanupMujoco,
  initializeMujoco,
  initializeThreeJS,
  setupModelGeometry,
  setupScene,
  updateBodyTransforms,
} from "@/components/files/mujoco/mujoco";
import Spinner from "@/components/ui/Spinner";
import { humanReadableError } from "@/hooks/useAlertQueue";
import { mujoco } from "@/lib/mujoco/mujoco_wasm";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface Props {
  useControls?: boolean;
  showWireframe?: boolean;
  supportedThemes?: Theme[];
  overrideColor?: string | null;
}

type Theme = "light" | "dark";

interface ThemeColors {
  background: string;
  text: string;
  backgroundColor: number;
}

const getThemeColors = (theme: Theme): ThemeColors => {
  switch (theme) {
    case "light":
      return {
        background: "bg-[#f0f0f0]",
        text: "text-gray-800",
        backgroundColor: 0xf0f0f0,
      };
    case "dark":
      return {
        background: "bg-black",
        text: "text-gray-200",
        backgroundColor: 0x000000,
      };
  }
};

const MJCFRenderer = ({
  useControls = true,
  showWireframe = false,
  supportedThemes = ["light", "dark"],
  overrideColor = null,
}: Props) => {
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
  const DEFAULT_TIMESTEP = 0.002;

  // Add new state for sidebar visibility
  const [showControls, setShowControls] = useState(true);

  // Add state for simulation control
  const [isSimulating, setIsSimulating] = useState(false);

  // Add new state for joint controls
  const [joints, setJoints] = useState<{ name: string; value: number }[]>([]);

  // Add theme state
  const [theme, setTheme] = useState<Theme>(() => supportedThemes[0]);

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
        const qpos = refs.stateRef.current.qpos || [];
        setJoints(
          joints.map((joint, i) => ({
            ...joint,
            value: qpos[i] || 0,
          })),
        );
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
        const humanoidXML = await fetch(humanoid).then((res) => res.text());
        const { mj, model, state, simulation } = await initializeMujoco({
          modelXML: humanoidXML,
          refs,
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
              backgroundColor: new THREE.Color(
                getThemeColors(theme).backgroundColor,
              ),
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

          // Add joint information after MuJoCo initialization
          if (refs.modelRef.current) {
            const jointNames = [];
            const numJoints = refs.modelRef.current.nu;

            for (let i = 0; i < numJoints + 1; i++) {
              const name = refs.simulationRef.current.id2name(
                mj.mjtObj.mjOBJ_JOINT.value,
                i,
              );
              const qpos = refs.stateRef.current?.qpos || [];
              jointNames.push({ name, value: qpos[i] || 0 });
            }
            setJoints(jointNames);
          }

          // Start animation loop but don't start simulation
          animate(performance.now());
          // Don't auto-start simulation
          isSimulatingRef.current = false;
          setIsSimulating(false);
        }
      } catch (error) {
        console.error(error);
        setError(error as Error);
      }
    })();

    window.addEventListener("resize", handleResize);
    return cleanup;
  }, []); // Empty dependency array

  return (
    <div className="w-full h-full relative">
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

      {useControls && showControls && (
        <div className="absolute top-0 right-0 bottom-0 w-64 z-30">
          <div
            className={`h-full overflow-y-auto ${getThemeColors(theme).background}`}
          >
            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-4">
                <button
                  onClick={toggleSimulation}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  {isSimulating ? (
                    <>
                      <FaPause className="inline-block" />
                      Stop Simulation
                    </>
                  ) : (
                    <>
                      <FaPlay className="inline-block" />
                      Start Simulation
                    </>
                  )}
                </button>
                <button
                  onClick={restartSimulation}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaUndo className="inline-block" />
                  Restart Simulation
                </button>
                <button
                  onClick={() => setShowControls(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaChevronRight className="inline-block" />
                  Hide Controls
                </button>

                {/* Add joint controls */}
                <div className="space-y-2">
                  <h3 className={`font-bold ${getThemeColors(theme).text}`}>
                    Joint Controls
                  </h3>
                  {joints.map((joint, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label
                          className={`font-medium ${getThemeColors(theme).text}`}
                        >
                          {joint.name}
                        </label>
                        <span
                          className={`text-xs ${getThemeColors(theme).text}`}
                        >
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
    </div>
  );
};

export default MJCFRenderer;
