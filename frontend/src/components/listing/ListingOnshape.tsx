import { useState } from "react";
import { FaCheck, FaPen, FaTimes } from "react-icons/fa";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

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
  edit: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleSave: () => Promise<void>;
  handleRemove: () => Promise<void>;
  showRemove?: boolean;
}

const UpdateButtons = (props: UpdateButtonProps) => {
  const {
    edit,
    isEditing,
    setIsEditing,
    handleSave,
    handleRemove,
    showRemove,
  } = props;

  return (
    <>
      {edit && (
        <Button
          onClick={async () => {
            if (isEditing) {
              await handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          variant="primary"
          className="px-3 ml-2"
        >
          {isEditing ? <FaCheck /> : <FaPen />}
        </Button>
      )}
      {showRemove && (
        <Button
          onClick={handleRemove}
          variant="destructive"
          className="px-3 ml-2"
        >
          <FaTimes />
        </Button>
      )}
    </>
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

  const handleSave = async () => {
    if (url === permUrl) {
      setIsEditing(false);
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
      addAlert("Listing updated successfully", "success");
      setPermUrl(url);
      setIsEditing(false);
    }
    setSubmitting(false);
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
      addAlert("Listing updated successfully", "success");
      setUrl(null);
      setPermUrl(null);
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
      <div className="flex items-center">
        {isEditing ? (
          <>
            <UrlInput url={url} setUrl={setUrl} handleSave={handleSave} />
            <UpdateButtons
              edit={edit}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSave={handleSave}
              handleRemove={handleRemove}
              showRemove={false}
            />
          </>
        ) : permUrl === null ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="primary"
            className="px-2"
          >
            Add Onshape URL
          </Button>
        ) : (
          <>
            <UrlRenderer
              isEditing={isEditing}
              handleSave={handleSave}
              url={url}
              setUrl={setUrl}
            />
            <UpdateButtons
              edit={edit}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSave={handleSave}
              handleRemove={handleRemove}
              showRemove={edit && permUrl !== null}
            />
          </>
        )}
      </div>
    </div>
  ) : null;
};

export default ListingOnshape;
