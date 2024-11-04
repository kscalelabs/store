import { useState } from "react";
import {
  FaCheck,
  FaCopy,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPen,
  FaSync,
  FaTimes,
} from "react-icons/fa";

import ListingOnshapeUpdate from "@/components/listing/onshape/ListingOnshapeUpdate";
import { Artifact } from "@/components/listing/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
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
      className="border border-gray-200 dark:border-gray-700 rounded-md px-4 py-2 w-full"
      placeholder="Enter Onshape URL..."
      autoFocus
    />
  );
};

interface UpdateButtonProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleSave: () => Promise<void>;
  handleRemove?: () => Promise<void>;
  handleReload?: () => Promise<void>;
  toggleInstructions: () => void;
  showInstructions: boolean;
  url: string | null;
  disabled?: boolean;
}

const UpdateButtons = (props: UpdateButtonProps) => {
  const {
    isEditing,
    setIsEditing,
    handleSave,
    handleRemove,
    handleReload,
    toggleInstructions,
    showInstructions,
    url,
    disabled,
  } = props;

  const { addErrorAlert } = useAlertQueue();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url || "");
    } catch (error) {
      addErrorAlert(error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 w-full">
      {!isEditing && url && (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-gray-50 dark:bg-gray-800"
          />
          <Button
            onClick={copyToClipboard}
            variant="secondary"
            className="w-full sm:w-auto flex items-center justify-center"
            disabled={disabled}
          >
            Copy URL
            <FaCopy className="ml-2" />
          </Button>
        </div>
      )}
      <Button
        onClick={async () => {
          if (isEditing) {
            await handleSave();
          } else {
            setIsEditing(true);
          }
        }}
        variant="secondary"
        className="w-full sm:w-auto flex items-center justify-center"
        disabled={disabled}
      >
        {isEditing ? (
          <>
            Save
            <FaCheck className="ml-2" />
          </>
        ) : (
          <>
            Edit
            <FaPen className="ml-2" />
          </>
        )}
      </Button>
      {handleRemove && (
        <Button
          onClick={handleRemove}
          variant="destructive"
          className="w-full sm:w-auto flex items-center justify-center"
          disabled={disabled}
        >
          Remove
          <FaTimes className="ml-2" />
        </Button>
      )}
      {handleReload && (
        <Button
          onClick={handleReload}
          variant="primary"
          className="w-full sm:w-auto flex items-center justify-center"
          disabled={disabled}
        >
          Sync URDF
          <FaSync className="ml-2" />
        </Button>
      )}
      <Button
        onClick={toggleInstructions}
        variant="secondary"
        className="w-full sm:w-auto flex items-center justify-center"
      >
        <FaInfoCircle className="mr-2" />
        {showInstructions ? "Hide URDF Instructions" : "Show URDF Instructions"}
      </Button>
    </div>
  );
};

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
    <div className="mt-6 p-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg w-full border border-gray-200 dark:border-gray-700">
      <h4 className="text-2xl font-semibold mb-6 text-blue-600 dark:text-blue-400">
        URDF Upload Instructions
      </h4>
      <ol className="list-decimal list-outside ml-6 space-y-6 text-base">
        <li className="leading-relaxed">
          <span className="font-medium">Install the K-Scale CLI:</span>
          <pre className="bg-gray-100 dark:bg-gray-900 text-green-600 dark:text-green-400 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200 dark:border-gray-700">
            pip install kscale
          </pre>
        </li>
        <li className="leading-relaxed">
          <span className="font-medium">Upload your URDF file:</span>
          <pre className="bg-gray-100 dark:bg-gray-900 text-green-600 dark:text-green-400 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200 dark:border-gray-700">
            kscale urdf upload {listingId}
          </pre>
        </li>
        <li className="leading-relaxed">
          <span className="font-medium">View source code:</span>
          <div className="mt-2">
            The K-Scale CLI is open source and available on{" "}
            <a
              href="https://github.com/kscalelabs/kscale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </li>
      </ol>
    </div>
  );

  return submitting ? (
    <div className="flex justify-center items-center my-4">
      <Spinner className="w-8 h-8" />
    </div>
  ) : (
    <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="space-y-6">
          <div className="flex flex-col w-full">
            {isEditing ? (
              <div className="flex flex-col items-start w-full">
                <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
                {edit && (
                  <UpdateButtons
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleSave={handleSave}
                    url={url}
                    toggleInstructions={toggleInstructions}
                    showInstructions={showInstructions}
                  />
                )}
              </div>
            ) : url === null ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="primary"
                  className="flex-1 sm:flex-none px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add Onshape URL
                </Button>
                {edit && (
                  <Button
                    onClick={toggleInstructions}
                    variant="secondary"
                    className="flex-1 sm:flex-none px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaInfoCircle className="mr-2" />
                    {showInstructions
                      ? "Hide Instructions"
                      : "Show Instructions"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-start w-full">
                {edit ? (
                  <UpdateButtons
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleSave={handleSave}
                    handleRemove={handleRemove}
                    handleReload={handleReload}
                    url={url}
                    disabled={updateOnshape}
                    toggleInstructions={toggleInstructions}
                    showInstructions={showInstructions}
                  />
                ) : (
                  <div className="flex items-center">
                    <Button
                      onClick={() =>
                        window.open(url, "_blank", "noopener,noreferrer")
                      }
                      variant="secondary"
                      className="flex items-center justify-center"
                    >
                      Visit Onshape
                      <FaExternalLinkAlt className="ml-2" />
                    </Button>
                  </div>
                )}
                {updateOnshape && (
                  <ListingOnshapeUpdate
                    listingId={listingId}
                    onClose={() => setUpdateOnshape(false)}
                    addArtifacts={addArtifacts}
                  />
                )}
              </div>
            )}
            {showInstructions && renderUrdfInstructions(listingId)}
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ListingOnshape;
