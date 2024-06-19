// @ts-nocheck
import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import URDFLoader from "urdf-loader"

// const theme = css`
//   width: 100vw;
//   height: 100vh;
//   background-color: #272727;
// `;

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const toMouseCoord = (el: HTMLElement, e: MouseEvent, v: THREE.Vector2) => {
  v.x = ((e.pageX - el.offsetLeft) / el.offsetWidth) * 2 - 1;
  v.y = -((e.pageY - el.offsetTop) / el.offsetHeight) * 2 + 1;
};

const getCollisions = (
  camera: THREE.Camera,
  robot: THREE.Object3D | null,
  mouse: THREE.Vector2,
) => {
  if (!robot) return [];
  raycaster.setFromCamera(mouse, camera);
  const meshes: THREE.Mesh[] = [];
  robot.traverse((c: any) => {
    if (c instanceof THREE.Mesh) meshes.push(c);
  });
  return raycaster.intersectObjects(meshes);
};

const isJoint = (j: any) => j.isURDFJoint && j.jointType !== "fixed";

const findNearestJoint = (m: THREE.Object3D | null) => {
  let curr: THREE.Object3D | null = m;
  while (curr) {
    if (isJoint(curr)) break;
    curr = curr.parent;
  }
  return curr;
};

interface LoadModelProps {
  filepath: string;
}

const LoadModel: React.FC<LoadModelProps> = ({ filepath }) => {
  const [hovered, setHovered] = useState<THREE.Object3D | null>(null);
  const { camera, gl } = useThree();
  const ref = useRef<THREE.Object3D | null>(null);

  const robot = useLoader(URDFLoader, filepath) as THREE.Group;

  // Configure loader
  useEffect(() => {
    const configureLoader = (loader: any) => {
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
      };
    };

    if (robot) {
      configureLoader(robot);
    }
  }, [robot]);

  const highlightMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        shininess: 10,
        color: "#FFFFFF",
        emissive: "#FFFFFF",
        emissiveIntensity: 0.25,
      }),
    [],
  );

  const highlightLinkGeometry = useCallback(
    (m: THREE.Object3D | null, revert: boolean) => {
      if (!m) return;
      const traverse = (c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (revert) {
            c.material = (c as any).__origMaterial;
            delete (c as any).__origMaterial;
          } else {
            (c as any).__origMaterial = c.material;
            c.material = highlightMaterial;
          }
        }
        if (c === m || !isJoint(c)) {
          for (let i = 0; i < c.children.length; i++) {
            traverse(c.children[i]);
          }
        }
      };
      traverse(m);
    },
    [highlightMaterial],
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      try {
        if (!robot) return;

        toMouseCoord(gl.domElement, event, mouse);
        const collision = getCollisions(camera, robot, mouse).shift() || null;
        if (collision) {
          const joint = findNearestJoint(collision.object);
          if (joint !== hovered) {
            if (hovered) {
              highlightLinkGeometry(hovered, true);
              setHovered(null);
            }
            if (joint) {
              highlightLinkGeometry(joint, false);
              setHovered(joint);
            }
          }
        }
      } catch (error) {
        console.error("Error during onMouseMove:", error);
      }
    },
    [camera, gl, hovered, robot, highlightLinkGeometry],
  );

  useEffect(() => {
    if (gl && gl.domElement) {
      gl.domElement.addEventListener("mousemove", onMouseMove);
      return () => {
        gl.domElement.removeEventListener("mousemove", onMouseMove);
      };
    }
  }, [gl, onMouseMove]);

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
    "https://raw.githubusercontent.com/vrtnis/robot-web-viewer/main/public/urdf/robot.urdf";

  return (
    <div>
      <Canvas camera={{ position: [0, 5, 10] }}>
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
        <OrbitControls />
        <axesHelper />
      </Canvas>
    </div>
  );
};
