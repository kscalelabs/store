import { useState } from "react";
import { FaCheck, FaCopy, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { cx } from "class-variance-authority";
import { components } from "gen/api";

import { Button } from "components/ui/Button/Button";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface ButtonProps {
  command: string;
  isFirst?: boolean;
  prefix?: string;
}

const DownloadButton = ({ command, isFirst, prefix }: ButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (command: string) => {
    setCopied(true);
    await navigator.clipboard.writeText(command);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className={cx("p-3 w-full", isFirst ? "mt-0" : "mt-2")}
      onClick={() => copyToClipboard(command)}
      title={command}
      disabled={copied}
      variant="secondary"
    >
      <code className="text-xs font-mono truncate flex-grow mr-2">
        {prefix ? `${prefix}: ${command}` : command}
      </code>
      <span className="flex-shrink-0">
        {copied ? (
          <FaCheck className="text-green-500" />
        ) : (
          <FaCopy className="text-gray-500" />
        )}
      </span>
    </Button>
  );
};

const UrdfViewerButton = ({ artifact }: Props) => {
  const navigate = useNavigate();

  return (
    <Button
      className="p-3 w-full mt-2"
      onClick={() => {
        navigate(`/file/${artifact.artifact_id}`);
      }}
      variant="secondary"
    >
      <code className="text-xs font-mono truncate flex-grow mr-2">
        View Files
      </code>
      <span className="flex-shrink-0">
        <FaEye className="text-gray-500" />
      </span>
    </Button>
  );
};

interface Props {
  artifact: SingleArtifactResponse;
}

const TgzArtifact = ({ artifact }: Props) => {
  return (
    <>
      <DownloadButton
        command={`kscale urdf download ${artifact.artifact_id}`}
        isFirst={true}
      />
      <UrdfViewerButton artifact={artifact} />
    </>
  );
};

export default TgzArtifact;
