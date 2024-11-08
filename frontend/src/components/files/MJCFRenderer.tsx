import React, { forwardRef, useEffect, useRef, useState } from "react";
import { UntarredFile } from "./Tarfile";
import load_mujoco, { mujoco } from "@/lib/mujoco/mujoco_wasm.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface MJCFRendererProps {
  mjcfContent: string;
  files?: UntarredFile[];
  width?: string | number;
  height?: string | number;
  useControls?: boolean;
  showWireframe?: boolean;
}

const MJCFRenderer = forwardRef<any, MJCFRendererProps>(({
  mjcfContent,
  files = [],
  width = "100%",
  height = "100%",
  useControls = true,
  showWireframe = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const robotRef = useRef<THREE.Object3D | null>(null);

  const [isMujocoReady, setIsMujocoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mujocoRef = useRef<mujoco | null>(null);
  const modelRef = useRef<InstanceType<mujoco["Model"]> | null>(null);
  const stateRef = useRef<InstanceType<mujoco["State"]> | null>(null);
  const simulationRef = useRef<InstanceType<mujoco["Simulation"]> | null>(null);

  useEffect(() => {
    const initializeScene = async () => {
      if (!containerRef.current) return;

      try {
        mujocoRef.current = await load_mujoco();
        console.log("MuJoCo loaded successfully");

        // Set up file system
        mujocoRef.current.FS.mkdir("/working");
        mujocoRef.current.FS.mount(
          mujocoRef.current.MEMFS,
          { root: "." },
          "/working"
        );

        // Create a simple test model without meshes
        const testModel = `
        <mujoco>
          <compiler angle="radian"/>
          <option gravity="0 0 -9.81"/>
          <worldbody>
            <light diffuse=".5 .5 .5" pos="0 0 3" dir="0 0 -1"/>
            <geom type="plane" size="5 5 0.1" rgba=".9 .9 .9 1"/>
            <body name="torso" pos="0 0 0.5">
              <freejoint name="root"/>
              <inertial pos="0 0 0" mass="1" diaginertia="0.1 0.1 0.1"/>
              <geom type="box" size="0.15 0.1 0.1" rgba="0.5 0.5 1 1"/>
            </body>
          </worldbody>
        </mujoco>`;

        const modelPath = "/working/model.xml";
        console.log("Writing model file to:", modelPath);
        mujocoRef.current.FS.writeFile(modelPath, testModel);

        // Load model
        console.log("Loading model...");
        modelRef.current = new mujocoRef.current.Model(modelPath);
        console.log("Model properties:", {
          nq: modelRef.current.nq,
          nv: modelRef.current.nv,
          nbody: modelRef.current.nbody,
          ngeom: modelRef.current.ngeom
        });

        stateRef.current = new mujocoRef.current.State(modelRef.current);
        simulationRef.current = new mujocoRef.current.Simulation(
          modelRef.current,
          stateRef.current
        );

        const nq = modelRef.current.nq;
        if (nq !== 7) {
          throw new Error(`Unexpected number of position coordinates: ${nq}`);
        }

        const initialQPos = new Float64Array(7);
        initialQPos[0] = 0;  // x
        initialQPos[1] = 0;  // y
        initialQPos[2] = 1;  // z
        initialQPos[3] = 1;  // qw
        initialQPos[4] = 0;  // qx
        initialQPos[5] = 0;  // qy
        initialQPos[6] = 0;  // qz

        const qpos = simulationRef.current.qpos;
        for (let i = 0; i < 7; i++) {
          qpos[i] = initialQPos[i];
        }

        // Initialize Three.js scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xf0f0f0);

        // Initialize camera
        const camera = new THREE.PerspectiveCamera(
          45,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000,
        );
        cameraRef.current = camera;
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current = renderer;
        renderer.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        );
        renderer.shadowMap.enabled = true;
        containerRef.current.appendChild(renderer.domElement);

        // Initialize controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Create visual representation
        const robot = new THREE.Group();
        robotRef.current = robot;
        scene.add(robot);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);

          // Update robot position from simulation state
          if (simulationRef.current && robotRef.current) {
            const qpos = simulationRef.current.qpos;

            // Update root body position and orientation
            robotRef.current.position.set(qpos[0], qpos[1], qpos[2]);

            // Convert quaternion to Three.js format (w, x, y, z)
            robotRef.current.quaternion.set(qpos[4], qpos[5], qpos[6], qpos[3]);

            // Step the simulation
            try {
              simulationRef.current.step();
            } catch (error) {
              console.error("Simulation step error:", error);
            }
          }

          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        setIsMujocoReady(true);
      } catch (error) {
        console.error("Error initializing scene:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    };

    initializeScene();

    return () => {
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [files]);

  return (
    <div
      ref={containerRef}
      style={{
        width: width,
        height: height,
        position: "relative",
      }}
    >
      {!isMujocoReady ? (
        <div className="text-gray-600">Loading MuJoCo...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : null}
    </div>
  );
});

export default MJCFRenderer;
