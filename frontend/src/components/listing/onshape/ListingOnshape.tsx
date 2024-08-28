import { useState } from "react";
import { FaCheck, FaPen, FaSync, FaTimes } from "react-icons/fa";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

import ListingOnshapeUpdate from "./ListingOnshapeUpdate";

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
      className="border-b border-gray-300 dark:border-gray-700"
      autoFocus
    />
  );
};

interface UrlRendererProps {
  isEditing: boolean;
  handleSave: () => Promise<void>;
  url: string | null;
  setUrl: (url: string | null) => void;
}

const UrlRenderer = (props: UrlRendererProps) => {
  const { isEditing, handleSave, url, setUrl } = props;

  return isEditing ? (
    <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
  ) : (
    <a
      href={url || "#"}
      target="_blank"
      rel="noreferrer"
      className="link overflow-ellipsis overflow-hidden whitespace-nowrap"
    >
      {url}
    </a>
  );
};

interface UpdateButtonProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleSave: () => Promise<void>;
  handleRemove?: () => Promise<void>;
  handleReload?: () => Promise<void>;
  disabled?: boolean;
}

const UpdateButtons = (props: UpdateButtonProps) => {
  const {
    isEditing,
    setIsEditing,
    handleSave,
    handleRemove,
    handleReload,
    disabled,
  } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
      <Button
        onClick={async () => {
          if (isEditing) {
            await handleSave();
          } else {
            setIsEditing(true);
          }
        }}
        variant="secondary"
        className="px-3"
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
          className="px-3"
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
          className="px-3"
          disabled={disabled}
        >
          Update URDF
          <FaSync className="ml-2" />
        </Button>
      )}
    </div>
  );
};

interface Props {
  listingId: string;
  onshapeUrl: string | null;
  edit: boolean;
}

const ListingOnshape = (props: Props) => {
  const { listingId, edit, onshapeUrl } = props;
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState<string | null>(onshapeUrl);
  const [permUrl, setPermUrl] = useState<string | null>(onshapeUrl);
  const [updateOnshape, setUpdateOnshape] = useState(false);

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

  return submitting ? (
    <div className="flex justify-center items-center my-2 py-2">
      <Spinner />
    </div>
  ) : url !== null || edit ? (
    <div className="flex flex-col my-2 py-2">
      {isEditing ? (
        <div className="flex flex-col items-start">
          <div className="flex items-center w-full">
            <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
          </div>
          {edit && (
            <UpdateButtons
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSave={handleSave}
            />
          )}
        </div>
      ) : permUrl === null ? (
        <div className="flex items-center">
          <Button
            onClick={() => setIsEditing(true)}
            variant="primary"
            className="px-2"
          >
            Add Onshape URL
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start">
          <div className="flex items-center w-full">
            <UrlRenderer
              isEditing={isEditing}
              handleSave={handleSave}
              url={url}
              setUrl={setUrl}
            />
          </div>
          {edit && (
            <UpdateButtons
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSave={handleSave}
              handleRemove={permUrl !== null ? handleRemove : undefined}
              handleReload={permUrl !== null ? handleReload : undefined}
              disabled={updateOnshape}
            />
          )}
          {updateOnshape && (
            <ListingOnshapeUpdate
              listingId={listingId}
              onClose={() => setUpdateOnshape(false)}
            />
          )}
        </div>
      )}
    </div>
  ) : null;
};

export default ListingOnshape;
