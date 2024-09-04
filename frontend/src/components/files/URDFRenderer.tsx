import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowsAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaUndo,
} from "react-icons/fa";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader, { URDFJoint, URDFLink } from "urdf-loader";

import { UntarredFile } from "./Tarfile";

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

type Orientation = "Z-up" | "Y-up" | "X-up";

const URDFRenderer: React.FC<{
  urdfContent: string;
  files: UntarredFile[];
}> = ({ urdfContent, files }) => {
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
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

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

    // Lighting setup
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(1, 1, 1);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const loader = new URDFLoader();
    loader.loadMeshCb = (path, _manager, onComplete) => {
      const fileContent = files.find((f) => f.name.endsWith(path))?.content;
      if (fileContent) {
        const geometry = new STLLoader().parse(fileContent.buffer);
        const material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
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

    // Add a grid for reference
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Collect joint information
    const joints: JointControl[] = [];
    robot.traverse((child) => {
      if ("isURDFJoint" in child && child.isURDFJoint) {
        const joint = child as URDFJoint;
        const initialValue =
          (Number(joint.limit.lower) + Number(joint.limit.upper)) / 2;
        joints.push({
          name: joint.name,
          min: Number(joint.limit.lower),
          max: Number(joint.limit.upper),
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
  }, [urdfContent, files, orientation]);

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
    const duration = 2500; // 2.5 seconds

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
      if (sceneRef.current && robotRef.current) {
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
      return newOrientation;
    });
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      <div ref={containerRef} className="flex-grow h-[60vh] lg:h-auto" />
      <div
        className={`absolute right-0 top-0 bottom-0 w-64 bg-gray-100 transition-transform duration-300 ease-in-out ${
          showControls ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 overflow-y-auto h-full">
          <h3 className="text-lg font-semibold mb-4">Joint Controls</h3>
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
              onClick={toggleOrientation}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
            >
              <FaArrowsAlt className="inline-block mr-2" />
              {`Orientation: ${orientation}`}
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
              <ul className="text-sm text-gray-800">
                <li>Joint Count: {urdfInfo.jointCount}</li>
                <li>Link Count: {urdfInfo.linkCount}</li>
              </ul>
            </div>
          )}
          <div className="space-y-2">
            {jointControls.map((joint, index) => (
              <div key={joint.name} className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-gray-700">
                    {joint.name}
                  </label>
                  <span className="text-xs text-gray-500">
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{joint.min.toFixed(2)}</span>
                  <span>{joint.max.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 right-4 z-20 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full shadow-md"
        >
          <FaChevronLeft />
        </button>
      )}
    </div>
  );
};

export default URDFRenderer;
