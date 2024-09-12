import { useState } from "react";
import {
  FaCheck,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPen,
  FaSync,
  FaTimes,
} from "react-icons/fa";

import ListingOnshapeUpdate from "@/components/listing/onshape/ListingOnshapeUpdate";
import { Button } from "@/components/ui/Buttons/Button";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
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
      onChange={(e) => {
        setUrl(e.target.value);
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await handleSave();
        }
      }}
      className="border-b border-gray-6"
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

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 w-full">
      {!isEditing && url && (
        <Button
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          variant="secondary"
          className="w-full sm:w-auto flex items-center justify-center"
          disabled={disabled}
        >
          Visit Onshape
          <FaExternalLinkAlt className="ml-2" />
        </Button>
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
  edit: boolean;
  addArtifactId: (artifactId: string) => Promise<void>;
}

const ListingOnshape = (props: Props) => {
  const { listingId, edit, onshapeUrl, addArtifactId } = props;
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

  const renderUrdfInstructions = () => (
    <div className="mt-4 p-4 bg-blue-900 rounded-md w-full">
      <h4 className="text-lg font-semibold mb-2">URDF Upload Instructions</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>
          Install the K-Scale CLI by running:
          <pre className="bg-gray-11 text-gray-2 p-2 rounded-md mt-1 overflow-x-auto">
            pip install kscale
          </pre>
        </li>
        <li>
          To upload a URDF directly, use the following command:
          <pre className="bg-gray-11 text-gray-2 p-2 rounded-md mt-1 overflow-x-auto">
            kscale urdf upload {listingId}
          </pre>
        </li>
        <li>
          The source code for the K-Scale CLI is available on GitHub{" "}
          <a
            href="https://github.com/kscalelabs/kscale"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            here
          </a>
          .
        </li>
      </ol>
    </div>
  );

  return submitting ? (
    <div className="flex justify-center items-center my-2 py-2">
      <Spinner />
    </div>
  ) : (
    <div className="flex flex-col my-2 py-2 w-full">
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
          <Button
            onClick={() => setIsEditing(true)}
            variant="primary"
            className="w-full sm:w-auto flex items-center justify-center"
          >
            Add Onshape URL
          </Button>
          {edit && (
            <Button
              onClick={toggleInstructions}
              variant="secondary"
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <FaInfoCircle className="mr-2" />
              {showInstructions
                ? "Hide URDF Instructions"
                : "Show URDF Instructions"}
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
              addArtifactId={addArtifactId}
            />
          )}
        </div>
      )}
      {showInstructions && renderUrdfInstructions()}
    </div>
  );
};

export default ListingOnshape;
