import { useEffect, useRef, useState } from "react";
import { IconType } from "react-icons";
import {
  FaCheck,
  FaCopy,
  FaInfoCircle,
  FaPen,
  FaSync,
  FaTimes,
} from "react-icons/fa";

import { Artifact } from "@/components/listing/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import CopyableCode from "@/components/ui/CopyableCode";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/ToolTip";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { BACKEND_URL } from "@/lib/constants/env";
import { cx } from "class-variance-authority";

interface UrlInputProps {
  url: string | null;
  setUrl: (url: string | null) => void;
  handleSave: () => Promise<void>;
}

const UrlInput = (props: UrlInputProps) => {
  const { url, setUrl, handleSave } = props;

  return (
    <Input
      type="text"
      value={url || ""}
      onChange={(e) => setUrl(e.target.value)}
      onKeyDown={async (e) => {
        if (e.key === "Enter") await handleSave();
      }}
      className="border border-gray-200 rounded-md px-4 py-2 w-full"
      placeholder="Enter Onshape URL..."
      autoFocus
    />
  );
};

interface UrlDisplayProps {
  url: string | null;
  onCopy: () => void;
  disabled: boolean;
}

const UrlDisplay = ({ url, onCopy, disabled = false }: UrlDisplayProps) => (
  <div className="flex flex-col sm:flex-row gap-2 w-full">
    <a
      href={url || ""}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 px-4 py-2 bg-gray-12 rounded-md hover:underline truncate text-gray-1"
    >
      Linked Onshape Document
    </a>
    <Button
      onClick={onCopy}
      variant="default"
      disabled={disabled}
      className="flex items-center justify-center"
    >
      <Tooltip content="Copy URL">
        <FaCopy />
      </Tooltip>
    </Button>
  </div>
);

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: {
  icon: IconType;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}) => (
  <Button onClick={onClick} variant={variant} disabled={disabled}>
    <Icon />
    <span className="ml-2">{label}</span>
  </Button>
);

const HelpButton = ({
  showInstructions,
  onToggle,
}: {
  showInstructions: boolean;
  onToggle: () => void;
}) => (
  <Button onClick={onToggle} variant="default">
    <FaInfoCircle />
    <span className="ml-2 text-sm sm:text-base">
      {showInstructions ? "Hide Instructions" : "View URDF Upload Instructions"}
    </span>
  </Button>
);

const UpdateButtons = ({
  isEditing,
  onEdit,
  onSave,
  onRemove,
  onReload,
  onToggleInstructions,
  showInstructions,
  disabled = false,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onRemove?: () => Promise<void>;
  onReload?: () => Promise<void>;
  onToggleInstructions: () => void;
  showInstructions: boolean;
  disabled?: boolean;
}) => (
  <div className="flex flex-wrap gap-2 pt-2">
    <IconButton
      icon={isEditing ? FaCheck : FaPen}
      label={isEditing ? "Save" : "Edit"}
      onClick={isEditing ? onSave : onEdit}
      disabled={disabled}
    />
    {onRemove && (
      <IconButton
        icon={FaTimes}
        label="Remove"
        onClick={onRemove}
        variant="destructive"
        disabled={disabled}
      />
    )}
    {onReload && (
      <IconButton
        icon={FaSync}
        label="Sync"
        onClick={onReload}
        variant="default"
        disabled={disabled}
      />
    )}
    <HelpButton
      showInstructions={showInstructions}
      onToggle={onToggleInstructions}
    />
  </div>
);

type Level = "success" | "info" | "error";

interface Message {
  message: string;
  level: Level;
}

interface ListingOnshapeUpdateProps {
  listingId: string;
  onClose: () => void;
  addArtifacts: (artifacts: Artifact[]) => void;
}

const ListingOnshapeUpdate = (props: ListingOnshapeUpdateProps) => {
  const { listingId, onClose, addArtifacts } = props;
  const auth = useAuthentication();
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { addErrorAlert } = useAlertQueue();

  const addMessage = (message: string, level: Level) => {
    setMessages((prevMessages) => [...prevMessages, { message, level }]);
  };

  const addArtifactId = async (artifactId: string) => {
    try {
      const response = await auth.client.GET("/artifacts/info/{artifact_id}", {
        params: {
          path: {
            artifact_id: artifactId,
          },
        },
      });
      if (response.error) {
        addErrorAlert(response.error);
      } else {
        addArtifacts([response.data]);
      }
    } catch (error) {
      addErrorAlert(error);
    }
  };

  useEffect(() => {
    const url = `${BACKEND_URL}/onshape/pull/${listingId}?token=${auth.apiKeyId}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      addMessage("Connected to Onshape update stream", "info");
    };

    eventSource.onerror = (event) => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        addMessage("Disconnected from Onshape update stream", "info");
      } else {
        addErrorAlert(event);
      }
      eventSource.close();
    };

    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      addMessage(data.message, data.level);
    });

    eventSource.addEventListener("image", (event) => {
      const data = JSON.parse(event.data);
      addMessage(`New image received: ${data.message}`, "success");
      addArtifactId(data.message);
    });

    eventSource.addEventListener("urdf", (event) => {
      const data = JSON.parse(event.data);
      addMessage(`New URDF: ${data.message}`, "success");
      addArtifactId(data.message);
    });

    eventSource.addEventListener("finish", () => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [listingId, auth.apiKeyId]);

  return (
    <div className="pt-4 flex flex-col max-w-full">
      <div
        ref={messageContainerRef}
        className="p-4 max-h-96 overflow-auto bg-gray-12 w-full"
      >
        <div className="whitespace-pre">
          {messages
            .slice(0)
            .reverse()
            .map(({ message, level }, index) => (
              <pre
                key={index}
                className={cx(
                  "text-sm font-mono break-words",
                  level === "success" && "text-green-600 font-bold my-1",
                  level === "info" && "text-gray-11",
                  level === "error" && "text-red-600 font-bold my-1",
                )}
              >
                <code>{message}</code>
              </pre>
            ))}
        </div>
      </div>
      <div className="mt-4 flex flex-row">
        <Button onClick={onClose} variant="destructive">
          Close
          <FaTimes className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

interface Props {
  listingId: string;
  onshapeUrl: string | null;
  canEdit: boolean;
  addArtifacts: (artifacts: Artifact[]) => void;
}

const InstructionCard = ({
  title,
  instructions,
}: {
  title: string;
  instructions: { step: string; code: string }[];
}) => (
  <div className="mt-6 p-8 bg-white rounded-xl shadow-lg w-full border border-gray-200">
    <h4 className="text-2xl font-semibold mb-6 text-gray-800">{title}</h4>
    <ol className="list-decimal list-outside ml-6 space-y-6 text-base text-gray-700">
      {instructions.map(({ step, code }, index) => (
        <li key={index} className="leading-relaxed">
          {step}
          <CopyableCode
            code={code}
            className="bg-gray-100 text-green-600 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200"
          />
        </li>
      ))}
    </ol>
  </div>
);

const renderUrdfInstructions = (listingId: string) => (
  <InstructionCard
    title="URDF Upload Instructions"
    instructions={[
      {
        step: "Install the K-Scale CLI:",
        code: "pip install kscale",
      },
      {
        step: "Upload your URDF file:",
        code: `kscale urdf upload ${listingId} /path/to/your/urdf/directory/`,
      },
    ]}
  />
);

const renderKernelInstructions = (listingId: string) => (
  <InstructionCard
    title="Kernel Image Upload Instructions"
    instructions={[
      {
        step: "Install the K-Scale CLI:",
        code: "pip install kscale",
      },
      {
        step: "Upload your kernel image:",
        code: `kscale kernel upload ${listingId} /path/to/your/kernel/kernel_image.img`,
      },
    ]}
  />
);

const ListingOnshape = (props: Props) => {
  const { listingId, canEdit: edit, onshapeUrl, addArtifacts } = props;
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState<string | null>(onshapeUrl);
  const [permUrl, setPermUrl] = useState<string | null>(onshapeUrl);
  const [updateOnshape, setUpdateOnshape] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showKernelInstructions, setShowKernelInstructions] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url || "");
      addAlert("URL copied", "success");
    } catch (error) {
      addErrorAlert(error);
    }
  };

  const handleRemove = async () => {
    setSubmitting(true);
    const { error } = await auth.client.POST("/onshape/set/{listing_id}", {
      params: {
        path: { listing_id: listingId },
      },
      body: {
        onshape_url: null,
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Onshape URL successfully removed", "success");
      setUrl(null);
      setPermUrl(null);
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  const handleReload = async () => {
    setUpdateOnshape(true);
  };

  const handleSave = async () => {
    if (url === permUrl) {
      setIsEditing(false);
      return;
    }

    if (url === null || url.length === 0) {
      await handleRemove();
      return;
    }

    setSubmitting(true);
    const { error } = await auth.client.POST("/onshape/set/{listing_id}", {
      params: {
        path: { listing_id: listingId },
      },
      body: {
        onshape_url: url,
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Onshape URL successfully updated", "success");
      setPermUrl(url);
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  const toggleKernelInstructions = () => {
    setShowKernelInstructions(!showKernelInstructions);
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col items-start w-full">
          <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
          {edit && (
            <div className="flex flex-wrap gap-2 pt-2">
              <IconButton
                icon={FaCheck}
                label="Save"
                onClick={handleSave}
                disabled={false}
              />
              <HelpButton
                showInstructions={showInstructions}
                onToggle={toggleInstructions}
              />
              <Button onClick={toggleKernelInstructions} variant="default">
                <FaInfoCircle />
                <span className="ml-2 text-sm sm:text-base">
                  {showKernelInstructions
                    ? "Hide Kernel Instructions"
                    : "View Kernel Image Upload Instructions"}
                </span>
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (!url) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsEditing(true)} variant="default">
            Add Onshape URL
          </Button>
          {edit && (
            <>
              <HelpButton
                showInstructions={showInstructions}
                onToggle={toggleInstructions}
              />
              <Button onClick={toggleKernelInstructions} variant="default">
                <FaInfoCircle />
                <span className="ml-2 text-sm sm:text-base">
                  {showKernelInstructions
                    ? "Hide Kernel Instructions"
                    : "View Kernel Image Upload Instructions"}
                </span>
              </Button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start w-full">
        {edit ? (
          <>
            <UrlDisplay
              url={url}
              onCopy={handleCopy}
              disabled={updateOnshape}
            />
            <UpdateButtons
              isEditing={false}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onRemove={handleRemove}
              onReload={handleReload}
              onToggleInstructions={toggleInstructions}
              showInstructions={showInstructions}
              disabled={updateOnshape}
            />
          </>
        ) : (
          <UrlDisplay url={url} onCopy={handleCopy} disabled={false} />
        )}
        {updateOnshape && (
          <ListingOnshapeUpdate
            listingId={listingId}
            onClose={() => setUpdateOnshape(false)}
            addArtifacts={addArtifacts}
          />
        )}
      </div>
    );
  };

  return (
    <Card className="mt-6 border border-gray-200 shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="space-y-6">
          {submitting ? (
            <div className="flex justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {renderContent()}
              {showInstructions && renderUrdfInstructions(listingId)}
              {showKernelInstructions && renderKernelInstructions(listingId)}
            </div>
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ListingOnshape;
