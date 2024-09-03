import STLRenderer from "./STLRenderer";
import { UntarredFile } from "./Tarfile";
import URDFRenderer from "./URDFRenderer";

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

export default FileRenderer;
