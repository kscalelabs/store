// Import necessary dependencies
import { useEffect, useRef, useState } from "react";

import load_mujoco, { mujoco } from "@/lib/mujoco/mujoco_wasm.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Playground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mujocoRef = useRef<mujoco | null>(null);
  const modelRef = useRef<InstanceType<mujoco["Model"]> | null>(null);
  const stateRef = useRef<InstanceType<mujoco["State"]> | null>(null);
  const simulationRef = useRef<InstanceType<mujoco["Simulation"]> | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);

  // Add state for joint angles
  const [leftLegAngle, setLeftLegAngle] = useState(0);
  const [rightLegAngle, setRightLegAngle] = useState(0);

  // Add new refs for physics simulation
  const isSimulatingRef = useRef(false);

  // Add simulation state
  const [isSimulating, setIsSimulating] = useState(false);

  // Add mujoco time tracking
  const mujocoTimeRef = useRef(0);

  // Add a state to track MuJoCo initialization
  const [isMujocoReady, setIsMujocoReady] = useState(false);

  // Add a constant for the default timestep
  const DEFAULT_TIMESTEP = 0.002;

  // Add these constants near the top of the component
  const SWING_FREQUENCY = 2.0; // Hz
  const SWING_AMPLITUDE = 0.8; // radians

  // Initialize Three.js and MuJoCo only once
  useEffect(() => {
    const initializeMuJoCo = async () => {
      try {
        // Load MuJoCo WASM module
        mujocoRef.current = await load_mujoco();

        // Set up file system and load XML model
        mujocoRef.current.FS.mkdir("/working");
        mujocoRef.current.FS.mount(
          mujocoRef.current.MEMFS,
          { root: "." },
          "/working",
        );

        // Create a simple test model with two hinge joints
        const xmlContent = `
        <mujoco>
          <option gravity="0 0 -9.81"/>
          <worldbody>
            <light diffuse=".5 .5 .5" pos="0 0 3" dir="0 0 -1"/>
            <geom type="plane" size="5 5 0.1" rgba=".9 .9 .9 1"/>
            <body name="torso" pos="0 0 0.5">
              <freejoint name="root"/>
              <inertial pos="0 0 0" mass="1" diaginertia="0.1 0.1 0.1"/>
              <geom type="box" size="0.15 0.1 0.1" rgba="0.5 0.5 1 1"/>

              <body name="left_leg" pos="-0.1 0 0">
                <inertial pos="0 0 -0.15" mass="0.2" diaginertia="0.01 0.01 0.01"/>
                <joint name="left_leg" type="hinge" axis="1 0 0" pos="0 0 0"/>
                <geom type="box" pos="0 0 -0.15" size="0.05 0.05 0.15" rgba="0.5 0.5 0.5 1"/>
              </body>

              <body name="right_leg" pos="0.1 0 0">
                <inertial pos="0 0 -0.15" mass="0.2" diaginertia="0.01 0.01 0.01"/>
                <joint name="right_leg" type="hinge" axis="1 0 0" pos="0 0 0"/>
                <geom type="box" pos="0 0 -0.15" size="0.05 0.05 0.15" rgba="0.5 0.5 0.5 1"/>
              </body>
            </body>
          </worldbody>
          <actuator>
            <motor joint="left_leg" name="left_motor"/>
            <motor joint="right_leg" name="right_motor"/>
          </actuator>
        </mujoco>`;

        mujocoRef.current.FS.writeFile("/working/model.xml", xmlContent);

        // Load model
        modelRef.current = new mujocoRef.current.Model("/working/model.xml");

        // Create initial state
        stateRef.current = new mujocoRef.current.State(modelRef.current);

        // Create simulation
        simulationRef.current = new mujocoRef.current.Simulation(
          modelRef.current,
          stateRef.current,
        );

        // Verify qpos exists
        if (!simulationRef.current.qpos) {
          throw new Error("MuJoCo simulation data not properly initialized");
        }

        setIsMujocoReady(true);
      } catch (error) {
        console.error("Error initializing MuJoCo:", error);
        setIsMujocoReady(false);
      }
    };

    const initializeThreeJS = () => {
      const container = containerRef.current;
      if (!container) return;

      // Set up Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0.15, 0.25, 0.35);
      sceneRef.current = scene;

      // Set up camera with container dimensions instead of window
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.001,
        100,
      );
      camera.position.set(2.0, 1.7, 1.7);
      scene.add(camera);
      cameraRef.current = camera;

      // Set up renderer with container dimensions
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Set up controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.7, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controlsRef.current = controls;

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add floor
      const floorGeometry = new THREE.PlaneGeometry(4, 4);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.7,
        metalness: 0.1,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      floor.position.y = 0; // Place at y=0
      scene.add(floor);

      // Add directional light for better shadows
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.position.set(5, 5, 5);
      scene.add(dirLight);

      // Remove the existing block code and add robot parts
      // Robot body
      const bodyGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.2);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4444ff });
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.position.y = 0.5;
      scene.add(bodyMesh);

      // Robot legs
      const legGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
      // Move the geometry's origin to the top
      legGeometry.translate(0, -0.15, 0);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

      // Left leg
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.1, 0.4, 0); // Adjusted Y position up to match with body
      scene.add(leftLeg);
      leftLegRef.current = leftLeg;

      // Right leg
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.1, 0.4, 0); // Adjusted Y position up to match with body
      scene.add(rightLeg);
      rightLegRef.current = rightLeg;

      const animate = (timeMS: number) => {
        if (leftLegRef.current && rightLegRef.current) {
          if (
            isSimulatingRef.current &&
            simulationRef.current &&
            modelRef.current
          ) {
            try {
              if (timeMS - mujocoTimeRef.current > 35.0) {
                mujocoTimeRef.current = timeMS;
              }

              while (mujocoTimeRef.current < timeMS) {
                // Add oscillating control signals
                const time = mujocoTimeRef.current / 1000.0;
                const ctrl = simulationRef.current.ctrl;

                // Left leg leads by π radians (180 degrees)
                ctrl[0] =
                  SWING_AMPLITUDE *
                  Math.sin(2 * Math.PI * SWING_FREQUENCY * time);
                // Right leg follows
                ctrl[1] =
                  SWING_AMPLITUDE *
                  Math.sin(2 * Math.PI * SWING_FREQUENCY * time + Math.PI);

                simulationRef.current.step();
                mujocoTimeRef.current += DEFAULT_TIMESTEP * 1000.0;

                if (simulationRef.current.qpos) {
                  const qpos = simulationRef.current.qpos;
                  if (leftLegRef.current) {
                    leftLegRef.current.userData.angle = qpos[7];
                  }
                  if (rightLegRef.current) {
                    rightLegRef.current.userData.angle = qpos[8];
                  }
                }
              }
            } catch (error) {
              console.error("Simulation error:", error);
              isSimulatingRef.current = false;
            }
          }

          // Update visual representation
          leftLegRef.current.rotation.x =
            leftLegRef.current.userData.angle || 0;
          rightLegRef.current.rotation.x =
            rightLegRef.current.userData.angle || 0;

          // Update leg positions
          leftLegRef.current.position.z =
            Math.sin(leftLegRef.current.userData.angle || 0) * 0.15;
          rightLegRef.current.position.z =
            Math.sin(rightLegRef.current.userData.angle || 0) * 0.15;
        }

        controlsRef.current?.update();
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
        requestAnimationFrame(animate);
      };

      animate(performance.now());
    };

    const handleResize = () => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const container = containerRef.current;
      if (renderer && camera && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
    };

    // Initialize MuJoCo and Three.js components
    initializeMuJoCo();
    initializeThreeJS();

    // Event listener for window resizing
    window.addEventListener("resize", handleResize);

    return () => {
      // Clean up resources on component unmount
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current) rendererRef.current.dispose();
      stopPhysicsSimulation();
    };
  }, []); // Empty dependency array - run only once

  // Update the effect that handles slider changes
  useEffect(() => {
    if (isMujocoReady && !isSimulatingRef.current && simulationRef.current) {
      try {
        // Safety check to ensure qpos exists
        if (!simulationRef.current.qpos) {
          console.warn("MuJoCo simulation data not properly initialized");
          return;
        }

        // Update MuJoCo state
        const qpos = simulationRef.current.qpos;

        // Clamp values to safe ranges
        const maxAngle = Math.PI / 2;
        const clampedLeftAngle = Math.max(
          -maxAngle,
          Math.min(maxAngle, leftLegAngle),
        );
        const clampedRightAngle = Math.max(
          -maxAngle,
          Math.min(maxAngle, rightLegAngle),
        );

        qpos[7] = clampedLeftAngle;
        qpos[8] = clampedRightAngle;

        // Forward the simulation to update positions
        simulationRef.current.forward();

        // Update Three.js visualization
        if (leftLegRef.current) {
          leftLegRef.current.userData.angle = clampedLeftAngle;
        }
        if (rightLegRef.current) {
          rightLegRef.current.userData.angle = clampedRightAngle;
        }
      } catch (error) {
        console.error("Error updating MuJoCo state:", error);
      }
    }
  }, [leftLegAngle, rightLegAngle, isMujocoReady]);

  // Add physics simulation loop
  const startPhysicsSimulation = () => {
    if (
      !simulationRef.current ||
      isSimulatingRef.current ||
      !mujocoRef.current ||
      !modelRef.current
    )
      return;

    try {
      // Create a new state to reset the simulation
      stateRef.current = new mujocoRef.current.State(modelRef.current);
      simulationRef.current = new mujocoRef.current.Simulation(
        modelRef.current,
        stateRef.current,
      );

      // Set initial joint positions (qpos)
      const qpos = simulationRef.current.qpos;
      // First 7 values are for the free joint (position[3] + quaternion[4])
      qpos[0] = 0; // x position
      qpos[1] = 0; // y position
      qpos[2] = 0.5; // z position
      qpos[3] = 1; // quaternion w
      qpos[4] = 0; // quaternion x
      qpos[5] = 0; // quaternion y
      qpos[6] = 0; // quaternion z
      // Then the leg joints
      qpos[7] = leftLegAngle; // Left leg
      qpos[8] = rightLegAngle; // Right leg

      // Reset velocities to zero (qvel)
      const qvel = simulationRef.current.qvel;
      for (let i = 0; i < qvel.length; i++) {
        qvel[i] = 0;
      }

      isSimulatingRef.current = true;
      mujocoTimeRef.current = performance.now();
    } catch (error) {
      console.error("Error starting simulation:", error);
    }
  };

  const stopPhysicsSimulation = () => {
    isSimulatingRef.current = false;
  };

  // Add simulation controls to the UI
  return (
    <div className="w-full h-[80vh] flex flex-col lg:flex-row">
      {/* 3D Viewer */}
      <div className="w-full lg:w-2/3 h-1/2 lg:h-full">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-1/3 h-1/2 lg:h-full p-4 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">Joint Controls</h2>

        {!isMujocoReady ? (
          <div className="text-gray-600">Loading MuJoCo...</div>
        ) : (
          <>
            {/* Simulation button */}
            <button
              onClick={() => {
                if (isSimulating) {
                  stopPhysicsSimulation();
                } else {
                  startPhysicsSimulation();
                }
                setIsSimulating(!isSimulating);
              }}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isSimulating ? "Stop Simulation" : "Start Simulation"}
            </button>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Left Leg Angle</label>
                <input
                  type="range"
                  min="-1.57" // -π/2
                  max="1.57" // π/2
                  step="0.01"
                  value={leftLegAngle}
                  onChange={(e) => setLeftLegAngle(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isSimulating}
                />
                <div className="text-sm text-gray-600">
                  {((leftLegAngle * 180) / Math.PI).toFixed(1)}°
                </div>
              </div>

              <div>
                <label className="block mb-2">Right Leg Angle</label>
                <input
                  type="range"
                  min="-1.57" // -π/2
                  max="1.57" // π/2
                  step="0.01"
                  value={rightLegAngle}
                  onChange={(e) => setRightLegAngle(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isSimulating}
                />
                <div className="text-sm text-gray-600">
                  {((rightLegAngle * 180) / Math.PI).toFixed(1)}°
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Playground;
