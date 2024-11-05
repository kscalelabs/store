import { useState } from "react";
import { IconType } from "react-icons";
import {
  FaCheck,
  FaCopy,
  FaInfoCircle,
  FaPen,
  FaSync,
  FaTimes,
} from "react-icons/fa";

import ListingOnshapeUpdate from "@/components/listing/onshape/ListingOnshapeUpdate";
import { Artifact } from "@/components/listing/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import CopyableCode from "@/components/ui/CopyableCode";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/ToolTip";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

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
      className="flex-1 px-4 py-2 bg-gray-50 rounded-md hover:underline truncate"
    >
      Linked Onshape Document
    </a>
    <Button
      onClick={onCopy}
      variant="secondary"
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
  variant = "secondary",
  disabled = false,
}: {
  icon: IconType;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "destructive";
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
  <Button onClick={onToggle} variant="secondary">
    <FaInfoCircle />
    <span className="ml-2">{showInstructions ? "Hide Help" : "Show Help"}</span>
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
        variant="primary"
        disabled={disabled}
      />
    )}
    <HelpButton
      showInstructions={showInstructions}
      onToggle={onToggleInstructions}
    />
  </div>
);

interface Props {
  listingId: string;
  onshapeUrl: string | null;
  canEdit: boolean;
  addArtifacts: (artifacts: Artifact[]) => void;
}

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

  const renderUrdfInstructions = (listingId: string) => (
    <div className="mt-6 p-8 bg-gray-50 rounded-xl shadow-lg w-full border border-gray-200">
      <h4 className="text-2xl font-semibold mb-6 text-blue-600">
        URDF Upload Instructions
      </h4>
      <ol className="list-decimal list-outside ml-6 space-y-6 text-base">
        <li className="leading-relaxed">
          Install the K-Scale CLI:
          <CopyableCode
            code="pip install kscale"
            className="bg-gray-100 text-green-600 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200"
          />
        </li>
        <li className="leading-relaxed">
          Upload your URDF file:
          <CopyableCode
            code={`kscale urdf upload ${listingId} /path/to/your/urdf/directory/`}
            className="bg-gray-100 text-green-600 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200"
          />
        </li>
      </ol>
    </div>
  );

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col items-start w-full">
          <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
          {edit && (
            <UpdateButtons
              isEditing={true}
              onEdit={() => {}}
              onSave={handleSave}
              onToggleInstructions={toggleInstructions}
              showInstructions={showInstructions}
            />
          )}
        </div>
      );
    }

    if (!url) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsEditing(true)} variant="primary">
            Add Onshape URL
          </Button>
          {edit && (
            <HelpButton
              showInstructions={showInstructions}
              onToggle={toggleInstructions}
            />
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

  return edit ? (
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
            </div>
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  ) : null;
};

export default ListingOnshape;
