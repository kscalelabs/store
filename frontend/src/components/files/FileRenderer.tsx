import MJCFRenderer from "./MJCFRenderer";
import STLRenderer from "./STLRenderer";
import { UntarredFile } from "./Tarfile";
import URDFRenderer from "./URDFRenderer";

const isMJCFFile = (content: string, filename: string): boolean => {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension !== "xml" && extension !== "mjcf") {
    return false;
  }

  return content.includes("<mujoco") && content.includes("</mujoco>");
};

const FileRenderer: React.FC<{
  file: UntarredFile;
  allFiles: UntarredFile[];
}> = ({ file, allFiles }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const fileContent = new TextDecoder().decode(file.content);

  switch (fileExtension) {
    case "urdf":
      return (
        <URDFRenderer
          urdfContent={new TextDecoder().decode(file.content)}
          files={allFiles}
          supportedThemes={["light", "dark"]}
        />
      );
    case "stl":
      return <STLRenderer stlContent={file.content.buffer} />;
    case "xml":
    case "mjcf":
      if (isMJCFFile(fileContent, file.name)) {
        return <MJCFRenderer mjcfContent={fileContent} height="100%" />;
      } else {
        return (
          <div className="h-full w-full flex items-center justify-center">
            <p>Invalid MJCF file format</p>
          </div>
        );
      }
    default:
      return (
        <div className="h-full w-full flex items-center justify-center">
          <p>Unsupported file type: {fileExtension}</p>
        </div>
      );
  }
};

export default FileRenderer;
