import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCompress,
  FaExpand,
  FaPlay,
  FaSync,
  FaUndo,
} from "react-icons/fa";

import { UntarredFile } from "@/components/files/untar";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader, { URDFJoint, URDFLink } from "urdf-loader";

interface JointControl {
  name: string;
  min: number;
  max: number;
  value: number;
}

interface URDFInfo {
  jointCount: number;
  linkCount: number;
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

interface Props {
  urdfContent: string;
  files: UntarredFile[];
  useControls?: boolean;
  showWireframe?: boolean;
  supportedThemes?: Theme[];
  overrideColor?: string | null;
}

const URDFRenderer = ({
  urdfContent,
  files,
  useControls = true,
  showWireframe = false,
  supportedThemes = ["light", "dark"],
  overrideColor = null,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const robotRef = useRef<THREE.Object3D | null>(null);
  const [jointControls, setJointControls] = useState<JointControl[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [isCycling, setIsCycling] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [urdfInfo, setUrdfInfo] = useState<URDFInfo | null>(null);

  // Used to toggle the wireframe.
  const [isWireframe, setIsWireframe] = useState(showWireframe);

  // Control the theme colors.
  const [theme, setTheme] = useState<Theme>(() => supportedThemes[0]);

  // Toggle fullscreen.
  const [isFullScreen, setIsFullScreen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Used to store the renderer.
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Add new state/refs for auto-rotation
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isNowFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isNowFullScreen);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  const updateMaterials = useCallback(() => {
    if (!robotRef.current) return;

    robotRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const originalColor =
          child.material instanceof THREE.Material
            ? (child.material as THREE.MeshPhysicalMaterial).color
            : new THREE.Color(0x808080);
        child.material = new THREE.MeshPhysicalMaterial({
          metalness: 0.4,
          roughness: 0.5,
          wireframe: isWireframe,
          color: overrideColor ? new THREE.Color(overrideColor) : originalColor,
        });
      }
    });
  }, [theme, isWireframe]);

  const updateTheme = useCallback(() => {
    if (!sceneRef.current) return;

    const themeColors = getThemeColors(theme);
    sceneRef.current.background = new THREE.Color(themeColors.backgroundColor);
  }, [theme]);

  useEffect(() => {
    updateMaterials();
  }, [updateMaterials, isWireframe]);

  useEffect(() => {
    updateTheme();
  }, [updateTheme]);

  const toggleWireframe = useCallback(() => {
    setIsWireframe((prev) => !prev);
  }, []);

  const toggleOrientation = useCallback(() => {
    if (!robotRef.current) return;

    robotRef.current.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextIndex =
        (supportedThemes.indexOf(prev) + 1) % supportedThemes.length;
      return supportedThemes[nextIndex];
    });
  }, [supportedThemes]);

  // Setup the scene.
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera.
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    cameraRef.current = camera;

    // Setup renderer.
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    containerRef.current.appendChild(renderer.domElement);

    // Setup controls.
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.autoRotateSpeed = 4.0;

    scene.children.forEach((child) => {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    // Setup lights.
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    // Setup fill light.
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // Setup ambient light.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Setup loader.
    const loader = new URDFLoader();
    loader.loadMeshCb = (path, _manager, onComplete) => {
      const fileContent = files.find((f) => f.name.endsWith(path))?.content;

      if (fileContent) {
        const geometry = new STLLoader().parse(fileContent.buffer);
        const mesh = new THREE.Mesh(geometry);
        onComplete(mesh);
      } else {
        onComplete(new THREE.Object3D());
      }
    };

    // Parse URDF.
    const robot = loader.parse(urdfContent);
    robotRef.current = robot;
    scene.add(robot);

    // Calculate URDF information
    let jointCount = 0;
    let linkCount = 0;

    robot.traverse((child) => {
      if ("isURDFLink" in child && child.isURDFLink) {
        linkCount++;
      } else if ("isURDFJoint" in child && child.isURDFJoint) {
        jointCount++;
      }
    });

    setUrdfInfo({
      jointCount,
      linkCount,
    });

    // Center and scale the robot
    const box = new THREE.Box3().setFromObject(robot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    robot.scale.multiplyScalar(scale);
    robot.position.sub(center.multiplyScalar(scale));

    // Position camera in front of the robot
    const distance = 10;
    camera.position.set(0, distance / 2, -distance);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.update();

    // Collect joint information
    const joints: JointControl[] = [];
    robot.traverse((child) => {
      if ("isURDFJoint" in child && child.isURDFJoint) {
        const joint = child as URDFJoint;
        const min = Number(joint.limit.lower);
        const max = Number(joint.limit.upper);
        const initialValue = min <= 0 && max >= 0 ? 0 : (min + max) / 2;

        joints.push({
          name: joint.name,
          min: min,
          max: max,
          value: initialValue,
        });
        joint.setJointValue(initialValue);
      }
    });
    setJointControls(joints);

    // Collect link information.
    const links: URDFLink[] = [];
    robot.traverse((child) => {
      if ("isURDFLink" in child && child.isURDFLink) {
        const link = child as URDFLink;
        links.push(link);
      }
    });

    // Setup the animation loop.
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controls.update();

      renderer.render(scene, camera);
      return animationId;
    };

    const animationId = animate();

    // Handle window resizing.
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current)
        return;

      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
    };

    window.addEventListener("resize", handleResize);

    // Add fullscreen change handler that just triggers a resize
    const handleFullScreenChange = () => {
      const isNowFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isNowFullScreen);
      requestAnimationFrame(handleResize);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    // Update the theme, materials, etc.
    updateTheme();
    updateMaterials();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });

      if (renderer) {
        renderer.dispose();
      }

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
        controlsRef.current.dispose();
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [urdfContent, files]);

  const handleJointChange = (index: number, value: number) => {
    setJointControls((prevControls) => {
      const newControls = [...prevControls];
      newControls[index].value = value;
      return newControls;
    });

    if (robotRef.current) {
      robotRef.current.traverse((child) => {
        if ("isURDFJoint" in child && child.isURDFJoint) {
          const joint = child as URDFJoint;
          if (joint.name === jointControls[index].name) {
            joint.setJointValue(value);
          }
        }
      });
    }
  };

  const cycleAllJoints = useCallback(() => {
    if (isCycling) return;
    setIsCycling(true);

    const startPositions = jointControls.map((joint) => joint.value);
    const startTime = Date.now();
    const duration = 3000;

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      jointControls.forEach((joint, index) => {
        const range = joint.max - joint.min;
        const startPosition = startPositions[index];
        const cycleProgress = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
        const newValue = startPosition + (cycleProgress - 0.5) * range;
        const clampedValue = Math.max(joint.min, Math.min(joint.max, newValue));
        handleJointChange(index, clampedValue);
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        jointControls.forEach((_joint, index) => {
          handleJointChange(index, startPositions[index]);
        });
        setIsCycling(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [jointControls, handleJointChange]);

  const resetJoints = useCallback(() => {
    jointControls.forEach((joint, index) => {
      handleJointChange(
        index,
        joint.min > 0 || joint.max < 0 ? (joint.min + joint.max) / 2 : 0,
      );
    });
  }, [jointControls, handleJointChange]);

  const toggleFullScreen = useCallback(() => {
    if (!parentRef.current) return;

    if (!document.fullscreenElement) {
      parentRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleAutoRotate = useCallback(() => {
    const newIsAutoRotating = !isAutoRotating;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = newIsAutoRotating;
    }
    setIsAutoRotating(newIsAutoRotating);
  }, [isAutoRotating]);

  return (
    <div
      ref={parentRef}
      className={`relative ${isFullScreen ? "h-screen" : "h-full"}`}
    >
      <div
        ref={containerRef}
        className={`absolute inset-0 ${getThemeColors(theme).background}`}
      >
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <button
            onClick={toggleOrientation}
            className={
              "bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
            }
          >
            <FaChevronUp />
          </button>
          <button
            onClick={toggleAutoRotate}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
          >
            <FaSync className={isAutoRotating ? "animate-pulse" : ""} />
          </button>
          <button
            onClick={toggleFullScreen}
            className={
              "bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
            }
          >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            onClick={toggleWireframe}
            className={
              "bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
            }
          >
            {isWireframe ? "S" : "W"}
          </button>
          {supportedThemes.length > 1 && (
            <button
              onClick={toggleTheme}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center"
            >
              {theme.charAt(0).toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {useControls && showControls && (
        <div className="absolute top-0 right-0 bottom-0 w-64 z-30">
          <div
            className={`h-full overflow-y-auto ${getThemeColors(theme).background}`}
          >
            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-2 mb-4">
                <button
                  onClick={cycleAllJoints}
                  disabled={isCycling}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  <FaPlay className="inline-block mr-2" />
                  {isCycling ? "Cycling..." : "Cycle All Joints"}
                </button>
                <button
                  onClick={resetJoints}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  <FaUndo className="inline-block mr-2" />
                  Reset Joints
                </button>
                <button
                  onClick={() => setShowControls(false)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  <FaChevronRight className="inline-block mr-2" />
                  Hide Controls
                </button>
              </div>
              {urdfInfo && (
                <div className="p-4 rounded-lg shadow-md mb-4 bg-grey-100 font-mono">
                  <ul className={`text-sm ${getThemeColors(theme).text}`}>
                    <li>Joint Count: {urdfInfo.jointCount}</li>
                    <li>Link Count: {urdfInfo.linkCount}</li>
                  </ul>
                </div>
              )}
              <div className="space-y-2">
                {jointControls.map((joint, index) => (
                  <div key={joint.name} className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <label
                        className={`font-medium ${getThemeColors(theme).text}`}
                      >
                        {joint.name}
                      </label>
                      <span className={`text-xs ${getThemeColors(theme).text}`}>
                        {joint.value.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={joint.min}
                      max={joint.max}
                      step={(joint.max - joint.min) / 100}
                      value={joint.value}
                      onChange={(e) =>
                        handleJointChange(index, parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isCycling}
                    />
                    <div
                      className={`flex justify-between text-xs ${
                        getThemeColors(theme).text
                      } mt-1`}
                    >
                      <span>{joint.min.toFixed(2)}</span>
                      <span>{joint.max.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {useControls && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className={`${
            isFullScreen ? "fixed" : "absolute"
          } bottom-4 right-4 z-30 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full shadow-md`}
        >
          <FaChevronLeft />
        </button>
      )}
    </div>
  );
};

export default URDFRenderer;
