import load_mujoco, { mujoco } from "@/lib/mujoco/mujoco_wasm.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface MujocoRefs {
  mujocoRef: React.MutableRefObject<mujoco | null>;
  modelRef: React.MutableRefObject<InstanceType<mujoco["Model"]> | null>;
  stateRef: React.MutableRefObject<InstanceType<mujoco["State"]> | null>;
  simulationRef: React.MutableRefObject<InstanceType<
    mujoco["Simulation"]
  > | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  controlsRef: React.MutableRefObject<OrbitControls | null>;
}

export interface MujocoInitOptions {
  modelXML: string;
  refs: MujocoRefs;
  onInitialized?: () => void;
  onError?: (error: Error) => void;
}

export const initializeMujoco = async ({
  modelXML,
  onInitialized,
}: MujocoInitOptions) => {
  const MODEL_DIR = "/working";
  const MODEL_FILE = "model.xml";
  const MODEL_PATH = `${MODEL_DIR}/${MODEL_FILE}`;

  // Load MuJoCo WASM module
  const mj = await load_mujoco();

  // Set up file system and load XML model
  // @ts-ignore
  if (!mj.FS.analyzePath(MODEL_DIR).exists) {
    mj.FS.mkdir(MODEL_DIR);
  }
  mj.FS.writeFile(MODEL_PATH, modelXML);

  const model = new mj.Model(MODEL_PATH);
  const state = new mj.State(model);
  const simulation = new mj.Simulation(model, state);

  onInitialized?.();
  return { mj, model, state, simulation };
};

export interface ThreeJSInitOptions {
  cameraDistance?: number;
  cameraHeight?: number;
  backgroundColor?: THREE.Color;
  onError?: (error: Error) => void;
}

export const initializeThreeJS = (
  container: HTMLDivElement,
  {
    cameraDistance = 2.5,
    cameraHeight = 1.5,
    backgroundColor = new THREE.Color(0.15, 0.25, 0.35),
  }: ThreeJSInitOptions = {},
) => {
  // Set up renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  if (!renderer.getContext()) {
    throw new Error("Failed to get WebGL context");
  }

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Set up scene
  const scene = new THREE.Scene();
  scene.background = backgroundColor;

  // Set up camera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.001,
    100,
  );
  camera.position.set(
    cameraDistance * Math.cos(Math.PI / 4),
    cameraHeight,
    cameraDistance * Math.sin(Math.PI / 4),
  );
  scene.add(camera);

  // Set up controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 1.0;
  controls.maxDistance = 5.0;
  controls.update();

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // Add floor
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.7,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  return { renderer, scene, camera, controls };
};

export const cleanupMujoco = (refs: MujocoRefs) => {
  // Clean up Three.js resources
  if (refs.rendererRef.current) {
    refs.rendererRef.current.dispose();
    refs.rendererRef.current.forceContextLoss();
    refs.rendererRef.current.domElement.remove();
  }

  if (refs.sceneRef.current) {
    refs.sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        }
      }
    });
  }

  if (refs.controlsRef.current) {
    refs.controlsRef.current.dispose();
  }
  if (refs.stateRef.current) {
    refs.stateRef.current.free();
  }
  if (refs.simulationRef.current) {
    refs.simulationRef.current.free();
  }
  if (refs.modelRef.current) {
    refs.modelRef.current.free();
  }

  // Reset all refs except containerRef
  refs.mujocoRef.current = null;
  refs.modelRef.current = null;
  refs.stateRef.current = null;
  refs.simulationRef.current = null;
  refs.rendererRef.current = null;
  refs.sceneRef.current = null;
  refs.cameraRef.current = null;
  refs.controlsRef.current = null;
};
