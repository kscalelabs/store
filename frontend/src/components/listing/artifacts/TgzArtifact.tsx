import { useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";

import { cx } from "class-variance-authority";
import { components } from "gen/api";

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
    <button
      className={cx(
        "bg-gray-100 p-3 rounded-md flex items-center justify-between cursor-pointer w-full text-left hover:bg-gray-200 transition-colors duration-200",
        isFirst ? "mt-0" : "mt-2",
      )}
      onClick={() => copyToClipboard(command)}
      title={command}
      disabled={copied}
    >
      <code className="text-xs text-gray-500 font-mono truncate flex-grow mr-2">
        {prefix ? `${prefix}: ${command}` : command}
      </code>
      <span className="flex-shrink-0">
        {copied ? (
          <FaCheck className="text-green-500" />
        ) : (
          <FaCopy className="text-gray-500" />
        )}
      </span>
    </button>
  );
};

interface Props {
  artifact: SingleArtifactResponse;
}

const TgzArtifact = ({ artifact }: Props) => {
  const url = artifact.urls?.large;

  return (
    <>
      <DownloadButton
        command={`kscale urdf download ${artifact.artifact_id}`}
        isFirst={true}
      />
      {url && (
        <DownloadButton command={`${url}`} isFirst={false} prefix="URL" />
      )}
    </>
  );
};

export default TgzArtifact;
