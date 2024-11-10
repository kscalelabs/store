import { useState } from "react";
import { FaFile, FaFolder, FaFolderOpen } from "react-icons/fa";

import { UntarredFile } from "@/components/files/untar";

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
          className="flex items-center cursor-pointer hover:bg-gray-5 py-1"
          style={{ paddingLeft: `${indent}px` }}
          onClick={toggleOpen}
        >
          {isOpen ? (
            <FaFolderOpen className="mr-2 text-yellow-500 flex-shrink-0" />
          ) : (
            <FaFolder className="mr-2 text-yellow-500 flex-shrink-0" />
          )}
          <span className="text-sm truncate text-gray-11" title={node.name}>
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
        className={`flex items-center cursor-pointer hover:bg-gray-6 py-1 ${
          isSelected ? "bg-blue-800" : ""
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() =>
          onFileSelect({ name: node.name, content: node.content! })
        }
        title={node.name}
      >
        <FaFile
          className={`mr-2 flex-shrink-0 ${
            isSelected ? "text-blue-500" : "text-gray-10"
          }`}
        />
        <span
          className={`text-sm truncate ${
            isSelected ? "font-semibold text-blue-300" : "text-gray-11"
          }`}
        >
          {truncatedName}
        </span>
      </div>
    );
  }
};

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

export default FileTreeViewer;
