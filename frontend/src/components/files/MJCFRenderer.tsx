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
  const tmpVecRef = useRef(new THREE.Vector3());
  const tmpQuatRef = useRef(new THREE.Quaternion());
  const [isMujocoReady, setIsMujocoReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Constants
  const DEFAULT_TIMESTEP = 0.01;

  const setupModelGeometry = () => {
    const { sceneRef, modelRef, mujocoRef, simulationRef } = refs;
    if (
      !sceneRef.current ||
      !modelRef.current ||
      !mujocoRef.current ||
      !simulationRef.current
    )
      return;
    const model = modelRef.current;
    const mj = mujocoRef.current;

    // Create root object for MuJoCo scene
    const mujocoRoot = new THREE.Group();
    mujocoRoot.name = "MuJoCo Root";
    sceneRef.current.add(mujocoRoot);

    // Create body groups first
    const bodies: { [key: number]: THREE.Group } = {};
    for (let b = 0; b < model.nbody; b++) {
      bodies[b] = new THREE.Group();
      bodies[b].name = `body_${b}`;
      bodies[b].userData.bodyId = b;

      // Add to parent body based on MuJoCo's body hierarchy
      if (b === 0) {
        mujocoRoot.add(bodies[b]);
      } else {
        const parentId = model.body_parentid[b];
        if (bodies[parentId]) {
          bodies[parentId].add(bodies[b]);
        }
      }
    }

    try {
      for (let i = 0; i < model.ngeom; i++) {
        // Get geom properties from the model
        const geomType = model.geom_type[i];
        const geomSize = model.geom_size.subarray(i * 3, i * 3 + 3);
        const geomPos = model.geom_pos.subarray(i * 3, i * 3 + 3);

        // Create corresponding Three.js geometry
        let geometry: THREE.BufferGeometry;
        switch (geomType) {
          case mj.mjtGeom.mjGEOM_PLANE.value:
            geometry = new THREE.PlaneGeometry(
              geomSize[0] * 2,
              geomSize[1] * 2,
            );
            break;
          case mj.mjtGeom.mjGEOM_SPHERE.value:
            geometry = new THREE.SphereGeometry(geomSize[0], 32, 32);
            break;
          case mj.mjtGeom.mjGEOM_CAPSULE.value:
            // Capsule is a cylinder with hemispheres at the ends
            geometry = new THREE.CapsuleGeometry(
              geomSize[0],
              geomSize[1] * 2,
              4,
              32,
            );
            break;
          case mj.mjtGeom.mjGEOM_ELLIPSOID.value:
            // Create a sphere and scale it to make an ellipsoid
            geometry = new THREE.SphereGeometry(1, 32, 32);
            geometry.scale(geomSize[0], geomSize[1], geomSize[2]);
            break;
          case mj.mjtGeom.mjGEOM_CYLINDER.value:
            geometry = new THREE.CylinderGeometry(
              geomSize[0],
              geomSize[0],
              geomSize[1] * 2,
              32,
            );
            break;
          case mj.mjtGeom.mjGEOM_BOX.value:
            geometry = new THREE.BoxGeometry(
              geomSize[0] * 2,
              geomSize[1] * 2,
              geomSize[2] * 2,
            );
            break;
          case mj.mjtGeom.mjGEOM_MESH.value:
            // For mesh, you'll need to load the actual mesh data
            console.warn("Mesh geometry requires additional mesh data loading");
            geometry = new THREE.BoxGeometry(1, 1, 1); // Placeholder
            break;
          case mj.mjtGeom.mjGEOM_LINE.value:
            geometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(geomSize[0], 0, 0),
            ]);
            break;
          default:
            console.warn(`Unsupported geom type: ${geomType}`);
            continue;
        }

        // Create material (you can customize this based on geom properties)
        const material = new THREE.MeshPhongMaterial({ color: 0x808080 });

        // Create mesh and add to corresponding body
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.geomIndex = i;

        const bodyId = model.geom_bodyid[i];
        if (bodies[bodyId]) {
          // Set local position and orientation relative to body
          const pos = model.geom_pos.subarray(i * 3, i * 3 + 3);
          mesh.position.set(pos[0], pos[2], -pos[1]);

          const quat = model.geom_quat.subarray(i * 4, i * 4 + 4);
          mesh.quaternion.set(-quat[1], -quat[3], quat[2], -quat[0]);

          bodies[bodyId].add(mesh);
        }
      }

      // Update initial body positions and orientations
      for (let b = 0; b < model.nbody; b++) {
        if (bodies[b]) {
          const pos = simulationRef.current.xpos.subarray(b * 3, b * 3 + 3);
          bodies[b].position.set(pos[0], pos[2], -pos[1]);

          const quat = simulationRef.current.xquat.subarray(b * 4, b * 4 + 4);
          bodies[b].quaternion.set(-quat[1], -quat[3], quat[2], -quat[0]);
        }
      }

      // Update world matrices from root to leaves
      mujocoRoot.updateWorldMatrix(true, true);
      setIsMujocoReady(true);
    } catch (error) {
      console.error(error);
    }
  };

  const setupScene = () => {
    if (!refs.sceneRef.current || !refs.cameraRef.current) return;

    // Set up scene properties
    refs.sceneRef.current.background = new THREE.Color(0.15, 0.25, 0.35);
    refs.sceneRef.current.fog = new THREE.Fog(
      refs.sceneRef.current.background,
      30,
      50,
    );

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    ambientLight.name = "AmbientLight";
    refs.sceneRef.current.add(ambientLight);

    // Set up camera with wider view
    refs.cameraRef.current.position.set(4.0, 3.4, 3.4);
    refs.cameraRef.current.far = 100;
    refs.cameraRef.current.updateProjectionMatrix();

    // Update OrbitControls settings
    if (refs.controlsRef.current) {
      refs.controlsRef.current.target.set(0, 0.7, 0);
      refs.controlsRef.current.panSpeed = 2;
      refs.controlsRef.current.zoomSpeed = 1;
      refs.controlsRef.current.enableDamping = true;
      refs.controlsRef.current.dampingFactor = 0.1;
      refs.controlsRef.current.screenSpacePanning = true;
      refs.controlsRef.current.update();
    }
  };

  const updateBodyTransforms = () => {
    const { modelRef, simulationRef, sceneRef } = refs;
    if (!modelRef.current || !simulationRef.current || !sceneRef.current)
      return;

    const mujocoRoot = sceneRef.current.getObjectByName("MuJoCo Root");
    if (!mujocoRoot) return;

    // Update body transforms
    for (let b = 0; b < modelRef.current.nbody; b++) {
      const body = mujocoRoot.getObjectByName(`body_${b}`);
      if (body) {
        const pos = simulationRef.current.xpos.subarray(b * 3, b * 3 + 3);
        body.position.set(pos[0], pos[2], -pos[1]);

        const quat = simulationRef.current.xquat.subarray(b * 4, b * 4 + 4);
        body.quaternion.set(-quat[1], -quat[3], quat[2], -quat[0]);
      }
    }

    // Update world matrices from root to leaves
    mujocoRoot.updateWorldMatrix(true, true);
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
      updateBodyTransforms();
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
        const humanoidXML = await fetch(humanoid).then((res) => res.text());
        const { mj, model, state, simulation } = await initializeMujoco({
          modelXML: humanoidXML,
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

        // Add new scene setup
        setupScene();

        // Start animation loop
        animate(performance.now());
      } catch (error) {
        console.error(error);
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
