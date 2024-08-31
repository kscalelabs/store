import { useEffect, useState } from "react";
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

const FileTreeView: React.FC<{ node: FileTreeNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0);

  const toggleOpen = () => setIsOpen(!isOpen);

  const indent = depth * 20;

  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center cursor-pointer"
          style={{ paddingLeft: `${indent}px` }}
          onClick={toggleOpen}
        >
          {isOpen ? (
            <FaFolderOpen className="mr-2 text-yellow-500" />
          ) : (
            <FaFolder className="mr-2 text-yellow-500" />
          )}
          <span>{node.name}</span>
        </div>
        {isOpen && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeView key={index} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
        <FaFile className="mr-2 text-gray-500" />
        <span>{node.name}</span>
        <span className="ml-2 text-xs text-gray-500">
          ({node.content?.length} bytes)
        </span>
      </div>
    );
  }
};

const URDFViewer = ({ files }: { files: UntarredFile[] }) => {
  const fileTree = buildFileTree(files);

  return (
    <div className="h-[600px] w-full border border-gray-300 rounded-md p-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">URDF Files:</h2>
      <FileTreeView node={fileTree} />
    </div>
  );
};

const parseTar = (buffer: Uint8Array): UntarredFile[] => {
  const files: UntarredFile[] = [];
  let offset = 0;

  while (offset < buffer.length - 512) {
    const header = buffer.slice(offset, offset + 512);
    const filenameBuffer = header.slice(0, 100);
    const filename = new TextDecoder()
      .decode(filenameBuffer)
      .replace(/\0/g, "")
      .trim();

    if (filename === "") break;

    const fileSizeBuffer = header.slice(124, 136);
    const fileSizeStr = new TextDecoder().decode(fileSizeBuffer).trim();
    const fileSize = parseInt(fileSizeStr, 8);

    offset += 512;
    const content = buffer.slice(offset, offset + fileSize);
    offset += Math.ceil(fileSize / 512) * 512;

    // Skip PaxHeader entries, empty filenames, and files starting with "./"
    if (
      !filename.includes("PaxHeader") &&
      filename !== "" &&
      !filename.startsWith("./")
    ) {
      files.push({ name: filename, content });
    }
  }

  return files;
};

const URDF = () => {
  const { artifactId } = useParams<{ artifactId: string }>();
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
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
          onClick={handleLoadAndUntar}
          variant="primary"
          disabled={untarring}
          className="w-full sm:w-auto"
        >
          <FaDownload className="mr-2" />
          {untarring ? "Loading..." : "Load and Untar"}
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
      {untarredFiles.length > 0 ? (
        <URDFViewer files={untarredFiles} />
      ) : (
        <div className="h-[600px] w-full border border-gray-300 rounded-md p-4 flex items-center justify-center text-gray-500">
          Click "Load and Untar" to view the URDF files
        </div>
      )}
    </div>
  );
};

export default URDF;
