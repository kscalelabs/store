import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCompress,
  FaExpand,
  FaPlay,
  FaUndo,
} from "react-icons/fa";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader, { URDFJoint, URDFLink } from "urdf-loader";

import { UntarredFile } from "./Tarfile";

type Orientation = "Z-up" | "Y-up" | "X-up";

type VisualizationTheme = "default" | "terminal" | "dark";

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

interface Props {
  urdfContent: string;
  files: UntarredFile[];
  useControls?: boolean;
  visualTheme?: VisualizationTheme | null;
  showWireframe?: boolean;
}

const URDFRenderer = ({
  urdfContent,
  files,
  useControls = true,
  visualTheme = null,
  showWireframe = false,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const robotRef = useRef<THREE.Object3D | null>(null);
  const [jointControls, setJointControls] = useState<JointControl[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [isCycling, setIsCycling] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [isInStartPosition, setIsInStartPosition] = useState(true);
  const [urdfInfo, setUrdfInfo] = useState<URDFInfo | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("Z-up");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const [forceRerender, setForceRerender] = useState(0);
  const jointPositionsRef = useRef<{ name: string; value: number }[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isWireframe, setIsWireframe] = useState(showWireframe);
  const wireframeStateRef = useRef<boolean>(showWireframe);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const darkBackgroundStateRef = useRef<boolean>(true);

  const applyTheme = useCallback((theme: VisualizationTheme) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    switch (theme) {
      case "terminal":
        scene.background = new THREE.Color(0x000000);
        robotRef.current?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: 0x00aa00,
              wireframe: true,
              wireframeLinewidth: 1,
            });
          }
        });
        break;

      case "dark":
        scene.background = new THREE.Color(0x222222);
        robotRef.current?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0x4444ff,
              emissive: 0x000044,
            });
          }
        });
        break;

      default:
        scene.background = new THREE.Color(0xf0f0f0);
        robotRef.current?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0xaaaaaa,
            });
          }
        });
        break;
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isNowFullScreen = !!document.fullscreenElement;

      if (isNowFullScreen) {
        setIsFullScreen(true);
      } else {
        jointPositionsRef.current = jointControls.map((joint) => ({
          name: joint.name,
          value: joint.value,
        }));
        wireframeStateRef.current = isWireframe;
        darkBackgroundStateRef.current = isDarkBackground;

        setIsFullScreen(false);
        setForceRerender((prev) => prev + 1);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [jointControls, isWireframe, isDarkBackground]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(
      darkBackgroundStateRef.current ? 0x000000 : 0xf0f0f0,
    );
    setIsDarkBackground(darkBackgroundStateRef.current);

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    scene.children.forEach((child) => {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const loader = new URDFLoader();
    loader.loadMeshCb = (path, _manager, onComplete) => {
      const fileContent = files.find((f) => f.name.endsWith(path))?.content;
      if (fileContent) {
        const geometry = new STLLoader().parse(fileContent.buffer);

        const material = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.4,
          roughness: 0.6,
          wireframe: showWireframe || false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        onComplete(mesh);
      } else {
        onComplete(new THREE.Object3D());
      }
    };

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
        const storedPosition = jointPositionsRef.current.find(
          (pos) => pos.name === joint.name,
        );
        const initialValue = storedPosition
          ? storedPosition.value
          : min <= 0 && max >= 0
            ? 0
            : (min + max) / 2;

        joints.push({
          name: joint.name,
          min: min,
          max: max,
          value: initialValue,
        });
        joint.setJointValue(initialValue);
      }
    });

    // Sort joints alphabetically by name
    joints.sort((a, b) => a.name.localeCompare(b.name));
    setJointControls(joints);

    // Collect link information.
    const links: URDFLink[] = [];
    robot.traverse((child) => {
      if ("isURDFLink" in child && child.isURDFLink) {
        const link = child as URDFLink;
        links.push(link);
      }
    });

    // Apply visual theme if specified
    if (visualTheme !== null) {
      applyTheme(visualTheme);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
    };

    window.addEventListener("resize", handleResize);

    const updateOrientation = (newOrientation: Orientation) => {
      if (robotRef.current) {
        const robot = robotRef.current;

        // Reset rotations
        robot.rotation.set(0, 0, 0);

        switch (newOrientation) {
          case "Y-up":
            robot.rotateX(-Math.PI / 2);
            break;
          case "X-up":
            robot.rotateZ(Math.PI / 2);
            break;
          // 'Z-up' is the default, no rotation needed
        }
      }
    };

    updateOrientation(orientation);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      updateOrientation("Z-up"); // Reset orientation on unmount
    };
  }, [urdfContent, files, orientation, forceRerender]);

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

    setIsInStartPosition(false);
  };

  const cycleAllJoints = useCallback(() => {
    if (isCycling) return;
    setIsCycling(true);

    const startPositions = jointControls.map((joint) => joint.value);
    const startTime = Date.now();
    const duration = 10000; // 10 seconds

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
        // Reset to original positions
        jointControls.forEach((_joint, index) => {
          handleJointChange(index, startPositions[index]);
        });
        setIsCycling(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [jointControls, handleJointChange]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const resetJoints = useCallback(() => {
    jointControls.forEach((joint, index) => {
      handleJointChange(index, (joint.max + joint.min) / 2);
    });
    setIsInStartPosition(true);
  }, [jointControls, handleJointChange]);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => {
      const newOrientation =
        prev === "Z-up" ? "Y-up" : prev === "Y-up" ? "X-up" : "Z-up";
      if (robotRef.current) {
        const robot = robotRef.current;
        robot.rotation.set(0, 0, 0);

        switch (newOrientation) {
          case "Y-up":
            robot.rotateX(-Math.PI / 2);
            break;
          case "X-up":
            robot.rotateZ(Math.PI / 2);
            break;
          // 'Z-up' is the default, no rotation needed
        }
      }
      return newOrientation;
    });
  }, []);

  // Add this helper function before the return statement
  const getOrientationButtonColors = (theme: VisualizationTheme | null) => {
    switch (theme) {
      case "terminal":
        return "bg-green-600 hover:bg-green-700";
      case "dark":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-purple-500 hover:bg-purple-600";
    }
  };

  const resetViewerState = useCallback(() => {
    if (
      !containerRef.current ||
      !robotRef.current ||
      !sceneRef.current ||
      !rendererRef.current
    )
      return;

    const renderer = rendererRef.current;
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    const distance = 10;
    camera.position.set(0, distance / 2, -distance);
    camera.lookAt(0, 0, 0);

    const robot = robotRef.current;
    const box = new THREE.Box3().setFromObject(robot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    robot.scale.setScalar(scale);
    robot.position.sub(center.multiplyScalar(scale));

    renderer.render(sceneRef.current, camera);
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isNowFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isNowFullScreen);

      if (!isNowFullScreen) {
        setTimeout(() => {
          resetViewerState();
        }, 100);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [resetViewerState]);

  const toggleFullScreen = useCallback(() => {
    if (!parentRef.current || isCycling) return;

    if (!document.fullscreenElement) {
      parentRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  }, [isCycling]);

  const toggleBackground = useCallback(() => {
    if (sceneRef.current) {
      setIsDarkBackground((prev) => {
        const newIsDark = !prev;
        sceneRef.current!.background = new THREE.Color(
          newIsDark ? 0x000000 : 0xf0f0f0,
        );
        return newIsDark;
      });
    }
  }, []);

  const getBackgroundColor = useCallback(() => {
    return isDarkBackground ? "bg-black" : "bg-[#f0f0f0]";
  }, [isDarkBackground]);

  useEffect(() => {
    if (robotRef.current) {
      robotRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.wireframe = wireframeStateRef.current;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [forceRerender]);

  useEffect(() => {
    if (robotRef.current) {
      robotRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.wireframe = isWireframe;
          child.material.needsUpdate = true;
        }
      });
    }
    wireframeStateRef.current = isWireframe;
  }, [isWireframe]);

  useEffect(() => {
    if (robotRef.current) {
      robotRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.userData.originalColor) {
            child.userData.originalColor = child.material.color.clone();
          }

          const material = new THREE.MeshStandardMaterial({
            color: isDarkBackground ? 0x00aa00 : child.userData.originalColor,
            metalness: 0.4,
            roughness: 0.6,
            wireframe: isWireframe,
            emissive: isDarkBackground ? 0x00aa00 : 0x000000,
            emissiveIntensity: isDarkBackground ? 0.5 : 0,
          });
          child.material = material;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [orientation, isWireframe, isDarkBackground]);

  useEffect(() => {
    if (sceneRef.current) {
      const backgroundColor = isDarkBackground ? 0x000000 : 0xf0f0f0;
      sceneRef.current.background = new THREE.Color(backgroundColor);
      darkBackgroundStateRef.current = isDarkBackground;
    }
  }, [isDarkBackground]);

  useEffect(() => {
    if (!robotRef.current || !sceneRef.current) return;

    const robot = robotRef.current;
    robot.rotation.set(0, 0, 0);

    switch (orientation) {
      case "Y-up":
        robot.rotateX(-Math.PI / 2);
        break;
      case "X-up":
        robot.rotateZ(Math.PI / 2);
        break;
    }

    robot.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = new THREE.MeshStandardMaterial({
          color: isDarkBackground ? 0x00aa00 : child.userData.originalColor,
          metalness: 0.4,
          roughness: 0.6,
          wireframe: isWireframe,
          emissive: isDarkBackground ? 0x00aa00 : 0x000000,
          emissiveIntensity: isDarkBackground ? 0.5 : 0,
        });
        child.material = material;
        child.material.needsUpdate = true;
      }
    });
  }, [orientation, isDarkBackground, isWireframe]);

  return (
    <div
      ref={parentRef}
      className={`relative ${isFullScreen ? "h-screen" : "h-full"}`}
    >
      <div
        ref={containerRef}
        className={`absolute inset-0 ${getBackgroundColor()}`}
      >
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <button
            onClick={toggleOrientation}
            className={`${getOrientationButtonColors(visualTheme)} text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center`}
          >
            {orientation.charAt(0)}
          </button>
          <button
            onClick={toggleFullScreen}
            disabled={isCycling}
            className={`${getOrientationButtonColors(visualTheme)} text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center disabled:opacity-50`}
          >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`${getOrientationButtonColors(visualTheme)} text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center`}
          >
            {isWireframe ? "S" : "W"}
          </button>
          {visualTheme !== "terminal" && (
            <button
              onClick={toggleBackground}
              className={`${getOrientationButtonColors(visualTheme)} text-white font-bold w-8 h-8 rounded-full shadow-md flex items-center justify-center`}
            >
              {isDarkBackground ? "L" : "D"}
            </button>
          )}
        </div>
      </div>

      {useControls && showControls && (
        <div className="absolute top-0 right-0 bottom-0 w-64 z-30">
          <div className={`h-full overflow-y-auto ${getBackgroundColor()}`}>
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
                  disabled={isCycling || isInStartPosition}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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
                  <ul
                    className={`text-sm ${isDarkBackground ? "text-gray-200" : "text-gray-800"}`}
                  >
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
                        className={`font-medium ${isDarkBackground ? "text-gray-200" : "text-gray-700"}`}
                      >
                        {joint.name}
                      </label>
                      <span
                        className={`text-xs ${isDarkBackground ? "text-gray-400" : "text-gray-500"}`}
                      >
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
                      className={`flex justify-between text-xs ${isDarkBackground ? "text-gray-400" : "text-gray-500"} mt-1`}
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
