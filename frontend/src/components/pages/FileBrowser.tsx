import { useEffect, useRef, useState } from "react";
import {
  FaDownload,
  FaFile,
  FaFileDownload,
  FaFolder,
  FaFolderOpen,
  FaHome,
  FaList,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import { components } from "gen/api";
import { humanReadableError, useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import pako from "pako";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import URDFLoader, { URDFJoint } from "urdf-loader";

import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface UntarredFile {
  name: string;
  content: Uint8Array;
}

const buildFileTree = (files: UntarredFile[]): FileTreeNode => {
  const root: FileTreeNode = { name: "root", isDirectory: true, children: [] };

  files.forEach((file) => {
    const parts = file.name.split("/");
    let currentNode = root;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentNode.children.push({
          name: part,
          isDirectory: false,
          children: [],
          content: file.content,
        });
      } else {
        let childNode = currentNode.children.find(
          (child) => child.name === part && child.isDirectory,
        );
        if (!childNode) {
          childNode = { name: part, isDirectory: true, children: [] };
          currentNode.children.push(childNode);
        }
        currentNode = childNode;
      }
    });
  });

  return root;
};

interface FileTreeNode {
  name: string;
  isDirectory: boolean;
  children: FileTreeNode[];
  content?: Uint8Array;
}

interface FileTreeViewProps {
  node: FileTreeNode;
  depth?: number;
  onFileSelect: (file: UntarredFile) => void;
  selectedFile: UntarredFile | null;
}

const FileTreeView: React.FC<FileTreeViewProps> = ({
  node,
  depth = 0,
  onFileSelect,
  selectedFile,
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0);

  const toggleOpen = () => setIsOpen(!isOpen);

  const indent = depth * 20;

  const truncateFilename = (filename: string, maxLength: number) => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.split(".").pop() || "";
    const nameWithoutExtension = filename.slice(0, -extension.length - 1);

    const charsToShow = maxLength - 3 - extension.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    const truncatedName =
      nameWithoutExtension.slice(0, frontChars) +
      "..." +
      nameWithoutExtension.slice(-backChars);

    return `${truncatedName}.${extension}`;
  };

  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 py-1"
          style={{ paddingLeft: `${indent}px` }}
          onClick={toggleOpen}
        >
          {isOpen ? (
            <FaFolderOpen className="mr-2 text-yellow-500 flex-shrink-0" />
          ) : (
            <FaFolder className="mr-2 text-yellow-500 flex-shrink-0" />
          )}
          <span
            className="text-sm truncate text-gray-800 dark:text-gray-200"
            title={node.name}
          >
            {node.name}
          </span>
        </div>
        {isOpen && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeView
                key={index}
                node={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    const isSelected = selectedFile && selectedFile.name === node.name;
    const truncatedName = truncateFilename(node.name, 30);
    return (
      <div
        className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 py-1 ${
          isSelected ? "bg-blue-100 dark:bg-blue-800" : ""
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() =>
          onFileSelect({ name: node.name, content: node.content! })
        }
        title={node.name}
      >
        <FaFile
          className={`mr-2 flex-shrink-0 ${
            isSelected ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}
        />
        <span
          className={`text-sm truncate ${
            isSelected
              ? "font-semibold text-blue-700 dark:text-blue-300"
              : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {truncatedName}
        </span>
      </div>
    );
  }
};

const URDFRenderer: React.FC<{
  urdfContent: string;
  files: UntarredFile[];
}> = ({ urdfContent, files }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
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
    loader.loadMeshCb = (path, manager, onComplete) => {
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

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Animate the robot
      robot.traverse((child) => {
        if ("isURDFJoint" in child && child.isURDFJoint) {
          const joint = child as URDFJoint;
          const jointMin = joint.limit.lower;
          const jointMax = joint.limit.upper;
          const jointTargetAngle =
            jointMin.valueOf() +
            ((jointMax.valueOf() - jointMin.valueOf()) * (1 + Math.sin(time))) /
              2;
          joint.setJointValue(jointTargetAngle);
        }
      });

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

  return <div ref={containerRef} className="h-full w-full" />;
};

const STLRenderer: React.FC<{ stlContent: ArrayBuffer }> = ({ stlContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
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
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;

    // Lighting setup
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(1, 1, 1);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topLight.position.set(0, 1, 0);
    scene.add(topLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const loader = new STLLoader();
    const geometry = loader.parse(stlContent);
    const material = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      specular: 0x111111,
      shininess: 200,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Center the model
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    mesh.position.sub(center);

    // Scale the model to fit the view
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 10 / maxDim;
    mesh.scale.multiplyScalar(scale);

    scene.add(mesh);

    // Add a grid helper for reference
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Position camera
    const distance = 15;
    camera.position.set(distance, distance, distance);
    camera.lookAt(scene.position);
    controls.update();

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
  }, [stlContent]);

  return <div ref={containerRef} className="h-full w-full" />;
};

const FileRenderer: React.FC<{
  file: UntarredFile;
  allFiles: UntarredFile[];
}> = ({ file, allFiles }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  switch (fileExtension) {
    case "urdf":
      return (
        <URDFRenderer
          urdfContent={new TextDecoder().decode(file.content)}
          files={allFiles}
        />
      );
    case "stl":
      return <STLRenderer stlContent={file.content.buffer} />;
    default:
      return (
        <div className="h-full w-full flex items-center justify-center">
          <p>Unsupported file type: {fileExtension}</p>
        </div>
      );
  }
};

const FileTreeViewer = ({
  files,
  onFileSelect,
  selectedFile,
}: {
  files: UntarredFile[];
  onFileSelect: (file: UntarredFile) => void;
  selectedFile: UntarredFile | null;
}) => {
  const fileTree = buildFileTree(files);

  return (
    <div className="h-full overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Files:</h2>
      <div className="pr-4">
        <FileTreeView
          node={fileTree}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  );
};

const parseTar = (buffer: Uint8Array): UntarredFile[] => {
  const files: UntarredFile[] = [];
  let offset = 0;
  let longFileName = "";

  const readString = (view: Uint8Array, start: number, length: number) => {
    return new TextDecoder()
      .decode(view.slice(start, start + length))
      .replace(/\0/g, "");
  };

  while (offset < buffer.length - 512) {
    const header = buffer.slice(offset, offset + 512);
    let fileName = readString(header, 0, 100).trim();

    // Check for GNU tar long filename
    if (fileName === "././@LongLink") {
      offset += 512;
      const sizeBuf = readString(header, 124, 12);
      const size = parseInt(sizeBuf, 8);
      longFileName = readString(
        buffer.slice(offset, offset + size),
        0,
        size,
      ).trim();
      offset += Math.ceil(size / 512) * 512;
      continue;
    }

    if (longFileName) {
      fileName = longFileName;
      longFileName = "";
    }

    const sizeBuf = readString(header, 124, 12);
    const size = parseInt(sizeBuf, 8);

    if (fileName === "" || size === 0) {
      break; // End of archive
    }

    offset += 512; // Move past the header

    // Skip PaxHeader entries
    if (!fileName.includes("PaxHeader") && !fileName.endsWith("/")) {
      const content = buffer.slice(offset, offset + size);
      files.push({ name: fileName, content });
    }

    // Move to the next 512-byte boundary
    offset += Math.ceil(size / 512) * 512;
  }

  return files;
};

const FileBrowser = () => {
  const { artifactId } = useParams<{ artifactId: string }>();
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UntarredFile | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtifact = async () => {
      if (!artifactId) return;

      try {
        const { data, error } = await auth.client.GET(
          "/artifacts/info/{artifact_id}",
          {
            params: { path: { artifact_id: artifactId } },
          },
        );

        if (error) {
          addErrorAlert(error);
        } else {
          setArtifact(data);
        }
      } catch (err) {
        addErrorAlert(humanReadableError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchArtifact();
  }, [artifactId, auth.client, addErrorAlert]);

  const handleLoadAndUntar = async () => {
    if (!artifact?.urls?.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    setUntarring(true);
    try {
      const response = await fetch(artifact.urls.large);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Decompress gzip
      const decompressed = pako.ungzip(uint8Array);

      // Parse tar
      const files = parseTar(decompressed);

      setUntarredFiles(files);
    } catch (err) {
      addErrorAlert(`Error loading file: ${humanReadableError(err)}`);
    } finally {
      setUntarring(false);
    }
  };

  const handleDownload = () => {
    if (!artifact?.urls?.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    const link = document.createElement("a");
    link.href = artifact.urls.large;
    link.download = `${artifact.name}.tgz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (file: UntarredFile) => {
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  if (!artifact?.urls?.large) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{artifact.name}</h1>
      <p className="text-gray-600 mb-4">{artifact.description}</p>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-6">
        <Button
          onClick={() => navigate("/")}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <FaHome className="mr-2" />
          Home
        </Button>
        <Button
          onClick={() => navigate(`/item/${artifact.listing_id}`)}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <FaList className="mr-2" />
          View Listing
        </Button>
        <Button
          onClick={handleDownload}
          variant="secondary"
          disabled={!artifact.urls?.large}
          className="w-full sm:w-auto"
        >
          <FaFileDownload className="mr-2" />
          Download TGZ
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row lg:space-x-4">
        <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
          <div className="border border-gray-300 rounded-md p-6 relative lg:h-[600px] overflow-auto">
            {untarredFiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={handleLoadAndUntar}
                  variant="primary"
                  disabled={untarring}
                  className="w-full sm:w-auto"
                >
                  <FaDownload className="mr-2" />
                  {untarring ? "Loading..." : "Load and Untar"}
                </Button>
              </div>
            ) : (
              <FileTreeViewer
                files={untarredFiles}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            )}
          </div>
        </div>
        <div className="w-full lg:w-2/3">
          <div className="border border-gray-300 rounded-md overflow-hidden relative h-[600px]">
            {selectedFile && (
              <div className="absolute top-0 left-0 right-0 bg-gray-100 text-gray-800 p-2 border-b border-gray-300 break-all z-10">
                {selectedFile.name}
              </div>
            )}
            <div className="h-full">
              {selectedFile ? (
                <FileRenderer file={selectedFile} allFiles={untarredFiles} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to view its 3D model
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;
