import { UntarredFile } from "@/components/files/untar";
import load_mujoco, { mujoco } from "@/lib/mujoco/mujoco_wasm";
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
  files: UntarredFile[];
}

const formatXML = (xmlDoc: Document): string => {
  const format = (node: Node, level: number): string => {
    const indent = "  ".repeat(level);

    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim() || "";
      return text ? `${indent}${text}` : "";
    }

    if (node.nodeType === 8) {
      // Comment node
      return `${indent}<!--${node.nodeValue}-->`;
    }

    if (node.nodeType !== 1) return ""; // Not an element node

    const element = node as Element;
    let result = `${indent}<${element.tagName}`;

    // Add attributes
    for (const attr of Array.from(element.attributes)) {
      result += ` ${attr.name}="${attr.value}"`;
    }

    if (!element.childNodes.length) {
      return `${result}/>`;
    }

    result += ">";

    // Handle child nodes
    const children = Array.from(element.childNodes)
      .map((child) => format(child, level + 1))
      .filter(Boolean);

    if (children.length) {
      result += "\n" + children.join("\n");
      result += `\n${indent}`;
    }

    result += `</${element.tagName}>`;
    return result;
  };

  return format(xmlDoc.documentElement, 0);
};

const processModelXML = (modelXML: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(modelXML, "text/xml");

  // Add timestep option if not present
  const optionElements = xmlDoc.getElementsByTagName("option");
  if (optionElements.length === 0) {
    const optionElement = xmlDoc.createElement("option");
    optionElement.setAttribute("timestep", "0.005");
    const mujocoElement = xmlDoc.getElementsByTagName("mujoco")[0];
    mujocoElement.insertBefore(optionElement, mujocoElement.firstChild);
  } else {
    const optionElement = optionElements[0];
    if (!optionElement.hasAttribute("timestep")) {
      optionElement.setAttribute("timestep", "0.005");
    }
  }

  // Process joint elements and collect joint names
  const jointElements = xmlDoc.getElementsByTagName("joint");
  const jointNames: string[] = [];

  for (let i = 0; i < jointElements.length; i++) {
    const joint = jointElements[i];
    const name = joint.getAttribute("name");
    const pos = joint.getAttribute("pos");
    const axis = joint.getAttribute("axis");

    if (name) jointNames.push(name);

    // Remove all attributes
    while (joint.attributes.length > 0) {
      joint.removeAttribute(joint.attributes[0].name);
    }

    // Add back only the desired attributes
    if (name) joint.setAttribute("name", name);
    if (pos) joint.setAttribute("pos", pos);
    if (axis) joint.setAttribute("axis", axis);
  }

  // Handle actuator section
  let actuatorElement = xmlDoc.getElementsByTagName("actuator")[0];
  if (!actuatorElement) {
    actuatorElement = xmlDoc.createElement("actuator");
    xmlDoc.documentElement.appendChild(actuatorElement);
  } else {
    // Clear existing actuator content
    while (actuatorElement.firstChild) {
      actuatorElement.removeChild(actuatorElement.firstChild);
    }
  }

  // Add motor elements for each joint
  jointNames.forEach((jointName) => {
    const motorElement = xmlDoc.createElement("motor");
    motorElement.setAttribute("name", jointName);
    motorElement.setAttribute("joint", jointName);
    motorElement.setAttribute("gear", "40"); // Default gear value
    actuatorElement.appendChild(motorElement);
  });

  // Convert back to string and format
  return formatXML(xmlDoc);
};

export const initializeMujoco = async ({
  modelXML,
  files,
}: MujocoInitOptions) => {
  const MODEL_DIR = "/working";
  const MODEL_FILE = "model.xml";
  const MODEL_PATH = `${MODEL_DIR}/${MODEL_FILE}`;

  // Load MuJoCo WASM module
  const mj = await load_mujoco();

  // Set up file system and load XML model
  // @ts-expect-error: mj.FS is not typed
  if (!mj.FS.analyzePath(MODEL_DIR).exists) {
    mj.FS.mkdir(MODEL_DIR);
  }

  // Write all asset files to the filesystem
  for (const file of files) {
    // Skip non-mesh files
    if (
      !file.name.toLowerCase().endsWith(".stl") &&
      !file.name.toLowerCase().endsWith(".obj")
    ) {
      continue;
    }

    const filePath = `${MODEL_DIR}/${file.name}`;
    const dirs = file.name.split("/");
    if (dirs.length > 1) {
      let currentPath = MODEL_DIR;
      for (const dir of dirs.slice(0, -1)) {
        currentPath = `${currentPath}/${dir}`;
        // @ts-expect-error: mj.FS is not typed
        if (!mj.FS.analyzePath(currentPath).exists) {
          mj.FS.mkdir(currentPath);
        }
      }
    }
    mj.FS.writeFile(filePath, file.content);
  }

  modelXML = processModelXML(modelXML);

  console.log(modelXML);

  // Write the main model XML file
  mj.FS.writeFile(MODEL_PATH, modelXML);
  mj.FS.chdir(MODEL_DIR);
  const model = mj.Model.load_from_xml(MODEL_FILE);
  const state = new mj.State(model);
  const simulation = new mj.Simulation(model, state);
  simulation.forward(); // Compute initial positions and orientations
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

const getMeshGeometry = (model: mujoco["Model"], i: number) => {
  // Get mesh data from MuJoCo
  const meshId = model.geom_dataid[i];
  if (meshId < 0) {
    throw new Error(`Mesh data not found for geom ${i}`);
  }

  const vertCount = model.mesh_vertnum[meshId];
  const faceCount = model.mesh_facenum[meshId];

  // Get vertex positions
  const vertStart = model.mesh_vertadr[meshId];
  const vertices = model.mesh_vert.subarray(
    vertStart * 3,
    (vertStart + vertCount) * 3,
  );

  // Get face indices
  const faceStart = model.mesh_faceadr[meshId];
  const faces = model.mesh_face.subarray(
    faceStart * 3,
    (faceStart + faceCount) * 3,
  );

  // Create Three.js geometry
  const geometry = new THREE.BufferGeometry();

  // Set vertices (converting from MuJoCo to Three.js coordinate system)
  const positions = new Float32Array(vertCount * 3);
  for (let v = 0; v < vertCount; v++) {
    positions[v * 3] = vertices[v * 3]; // x
    positions[v * 3 + 1] = vertices[v * 3 + 2]; // y -> z
    positions[v * 3 + 2] = -vertices[v * 3 + 1]; // z -> -y
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Set faces
  geometry.setIndex(Array.from(faces));

  // Compute normals
  geometry.computeVertexNormals();

  return geometry;
};

export const setupModelGeometry = (refs: MujocoRefs) => {
  const { sceneRef, modelRef, mujocoRef } = refs;
  if (!sceneRef.current || !modelRef.current || !mujocoRef.current) return;
  const model = modelRef.current;
  const mj = mujocoRef.current;

  // Create body groups first
  const bodies: { [key: number]: THREE.Group } = {};
  for (let b = 0; b < model.nbody; b++) {
    bodies[b] = new THREE.Group();
    bodies[b].name = `body_${b}`;
    bodies[b].userData.bodyId = b;

    // Add to parent body or scene
    if (b === 0 || !bodies[0]) {
      sceneRef.current.add(bodies[b]);
    } else {
      bodies[0].add(bodies[b]);
    }
  }

  try {
    for (let i = 0; i < model.ngeom; i++) {
      // Get geom properties from the model
      const geomType = model.geom_type[i];
      const geomSize = model.geom_size.subarray(i * 3, i * 3 + 3);

      // Create corresponding Three.js geometry
      let geometry: THREE.BufferGeometry;
      switch (geomType) {
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_PLANE.value:
          geometry = new THREE.PlaneGeometry(geomSize[0] * 2, geomSize[1] * 2);
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_SPHERE.value:
          geometry = new THREE.SphereGeometry(geomSize[0], 32, 32);
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_CAPSULE.value:
          // Capsule is a cylinder with hemispheres at the ends
          geometry = new THREE.CapsuleGeometry(
            geomSize[0],
            geomSize[1] * 2,
            4,
            32,
          );
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_ELLIPSOID.value:
          // Create a sphere and scale it to make an ellipsoid
          geometry = new THREE.SphereGeometry(1, 32, 32);
          geometry.scale(geomSize[0], geomSize[1], geomSize[2]);
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_CYLINDER.value:
          geometry = new THREE.CylinderGeometry(
            geomSize[0],
            geomSize[0],
            geomSize[1] * 2,
            32,
          );
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_BOX.value:
          geometry = new THREE.BoxGeometry(
            geomSize[0] * 2,
            geomSize[1] * 2,
            geomSize[2] * 2,
          );
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
        case mj.mjtGeom.mjGEOM_MESH.value:
          geometry = getMeshGeometry(model, i);
          break;
        // @ts-expect-error: mj.mjtGeom is not typed
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
        const pos = refs.simulationRef.current!.xpos.subarray(b * 3, b * 3 + 3);
        bodies[b].position.set(pos[0], pos[2], -pos[1]);

        const quat = refs.simulationRef.current!.xquat.subarray(
          b * 4,
          b * 4 + 4,
        );
        bodies[b].quaternion.set(-quat[1], -quat[3], quat[2], -quat[0]);

        bodies[b].updateWorldMatrix(true, true);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const setupScene = (refs: MujocoRefs) => {
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

export const updateBodyTransforms = (refs: MujocoRefs) => {
  const { modelRef, simulationRef, sceneRef } = refs;
  if (!modelRef.current || !simulationRef.current || !sceneRef.current) return;

  // Update body transforms
  for (let b = 0; b < modelRef.current.nbody; b++) {
    const body = sceneRef.current.getObjectByName(`body_${b}`);
    if (body) {
      const pos = simulationRef.current.xpos.subarray(b * 3, b * 3 + 3);
      body.position.set(pos[0], pos[2], -pos[1]);

      const quat = simulationRef.current.xquat.subarray(b * 4, b * 4 + 4);
      body.quaternion.set(-quat[1], -quat[3], quat[2], -quat[0]);

      body.updateWorldMatrix(true, true);
    }
  }
};

export const getJoints = (refs: MujocoRefs) => {
  const jointNames = [];
  const numJoints = refs.modelRef.current?.nu;
  if (!numJoints) return [];

  for (let i = 0; i < numJoints; i++) {
    const name = refs.simulationRef.current?.id2name(
      // @ts-expect-error: mj.mjtObj is not typed
      mj.mjtObj.mjOBJ_ACTUATOR.value,
      i,
    );
    // @ts-expect-error: mj.State is not typed
    const qpos = refs.stateRef.current?.qpos || [];
    jointNames.push({ name, value: qpos[i] || 0 });
  }
};

export const getJointNames = (refs: MujocoRefs, mj: mujoco) => {
  const jointNames: { name: string; value: number }[] = [];
  const numJoints = refs.modelRef.current?.nu;
  if (!numJoints) return jointNames;

  for (let i = 0; i < numJoints; i++) {
    const name = refs.simulationRef.current?.id2name(
      // @ts-expect-error: mj.mjtObj is not typed
      mj.mjtObj.mjOBJ_JOINT.value,
      i,
    );
    if (!name) continue;
    // @ts-expect-error: mj.mjtObj is not typed
    const qpos = refs.stateRef.current?.qpos || [];
    jointNames.push({ name, value: qpos[i] || 0 });
  }
  return jointNames;
};

export const resetJoints = (
  refs: MujocoRefs,
  joints: { name: string; value: number }[],
) => {
  // @ts-expect-error: mj.State is not typed
  const qpos = refs.stateRef.current?.qpos || [];
  return joints.map((joint, i) => ({
    ...joint,
    value: qpos[i] || 0,
  }));
};
