import { useState } from "react";
import { FaFile, FaPen, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

interface Props {
  listingId: string;
  title: string;
  edit: boolean;
}

const ListingTitle = (props: Props) => {
  const { listingId, title: initialTitle, edit } = props;

  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }
    if (newTitle.length < 4) {
      addErrorAlert("Title must be at least 4 characters long.");
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: listingId },
      },
      body: {
        name: newTitle,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center">
      {submitting ? (
        <Spinner />
      ) : (
        <>
          {isEditing ? (
            <Input
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setHasChanged(true);
              }}
              className="border-b border-gray-300 dark:border-gray-700"
            />
          ) : (
            <h1 className="text-2xl font-semibold">{newTitle}</h1>
          )}
          {edit && (
            <Button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              variant="ghost"
            >
              {isEditing ? <FaFile /> : <FaPen />}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

const CloseButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(-1)}
      variant="outline"
      className="hover:bg-gray-200 dark:hover:bg-gray-700 bg-opacity-50"
    >
      <span className="md:hidden block mr-2">Close</span>
      <FaTimes />
    </Button>
  );
};

const ListingHeader = (props: Props) => {
  return (
    <div className="relative border-b p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <ListingTitle {...props} />
        <CloseButton />
      </div>
    </div>
  );
};

export default ListingHeader;
