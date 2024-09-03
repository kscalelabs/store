import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaPlay, FaUndo } from "react-icons/fa";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader, { URDFJoint } from "urdf-loader";

import { UntarredFile } from "./Tarfile";

interface JointControl {
  name: string;
  min: number;
  max: number;
  value: number;
}

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
  const [initialJointValues, setInitialJointValues] = useState<number[]>([]);
  const [isInStartPosition, setIsInStartPosition] = useState(true);

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

    // Center and scale the robot
    const box = new THREE.Box3().setFromObject(robot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    robot.scale.multiplyScalar(scale);
    robot.position.sub(center.multiplyScalar(scale));

    // Position camera
    const distance = 10;
    camera.position.set(distance, distance, distance);
    camera.lookAt(scene.position);
    controls.update();

    // Add a grid for reference
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Collect joint information
    const joints: JointControl[] = [];
    const initialValues: number[] = [];
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
        initialValues.push(initialValue);
      }
    });
    setJointControls(joints);
    setInitialJointValues(initialValues);

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

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
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

    // Check if all joints are in their initial positions
    const allInInitialPosition = jointControls.every(
      (joint, i) => Math.abs(joint.value - initialJointValues[i]) < 0.001,
    );
    setIsInStartPosition(allInInitialPosition);
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
    jointControls.forEach((_joint, index) => {
      handleJointChange(index, initialJointValues[index]);
    });
    setIsInStartPosition(true);
  }, [jointControls, initialJointValues, handleJointChange]);

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
          </div>
          <div className="space-y-6">
            {jointControls.map((joint, index) => (
              <div key={joint.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {joint.name}
                </label>
                <input
                  type="range"
                  min={joint.min}
                  max={joint.max}
                  step={(joint.max - joint.min) / 100}
                  value={joint.value}
                  onChange={(e) =>
                    handleJointChange(index, parseFloat(e.target.value))
                  }
                  className="w-full mb-1"
                  disabled={isCycling}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{joint.min.toFixed(2)}</span>
                  <span>{joint.value.toFixed(2)}</span>
                  <span>{joint.max.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute bottom-4 right-4 z-20 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full shadow-md"
      >
        {showControls ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
    </div>
  );
};

export default URDFRenderer;
