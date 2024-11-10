import { useState } from "react";
import Highlight from "react-highlight";
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaCopy,
  FaEye,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { components } from "@/gen/api";
import ROUTES from "@/lib/types/routes";
import { cx } from "class-variance-authority";

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
      variant="default"
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
        navigate(ROUTES.FILE.buildPath({ artifactId: artifact.artifact_id }));
      }}
      variant="default"
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

const CodeInstructions = ({ artifactId }: { artifactId: string }) => {
  return (
    <div className="mt-4 p-4 rounded-lg">
      <h4 className="text-sm font-semibold mb-2">Use this in your code:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>
          Install the library:
          <DownloadButton command="pip install kscale" />
        </li>
        <li>
          Configure your{" "}
          <Link to={ROUTES.KEYS.path} className="link">
            API key
          </Link>
        </li>
        <li>
          In your Python code:
          <pre className="text-gray-800 bg-gray-200 p-2 rounded mt-1 text-xs overflow-x-auto">
            <Highlight
              className="language-python"
              innerHTML={true}
            >{`import asyncio
from kscale import KScale

api = KScale()
urdf_path = asyncio.run(
  api.urdf("${artifactId}")
)`}</Highlight>
          </pre>
        </li>
      </ol>
    </div>
  );
};

interface Props {
  artifact: SingleArtifactResponse;
}

const TgzArtifact = ({ artifact }: Props) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <DownloadButton
        command={`kscale urdf download ${artifact.artifact_id}`}
        isFirst={true}
      />
      <UrdfViewerButton artifact={artifact} />
      <Button
        className="p-3 w-full mt-2"
        onClick={() => setShowInstructions(!showInstructions)}
        variant="default"
      >
        <span className="text-xs font-mono truncate flex-grow mr-2">
          {showInstructions
            ? "Hide Code Instructions"
            : "Show Code Instructions"}
        </span>
        <span className="flex-shrink-0">
          {showInstructions ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </Button>
      {showInstructions && (
        <CodeInstructions artifactId={artifact.artifact_id} />
      )}
    </>
  );
};

export default TgzArtifact;
