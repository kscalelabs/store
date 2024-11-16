import { useState } from "react";
import { FaPen, FaSave, FaTimes } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import ListingVote from "./ListingVote";

interface Props {
  listingId: string;
  name: string;
  edit: boolean;
  userVote: boolean | null;
}

const ListingName = (props: Props) => {
  const { listingId, name: initialName, edit, userVote } = props;

  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: listingId },
      },
      body: {
        name: newName,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditing(false);
    }
    setName(newName);
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setHasChanged(true);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
      <h1 className="text-2xl font-normal flex items-center gap-2">
        {isEditing ? (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={handleChange}
              className="border rounded px-2 py-1 bg-black text-white sm:mr-2"
              disabled={submitting}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewName(name);
                  setHasChanged(false);
                }}
                disabled={submitting}
                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
              >
                <FaTimes />
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="text-green-500/80 hover:text-green-500/60 disabled:text-gray-400"
              >
                <FaSave />
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="sm:mr-2">{name}</span>
            {edit && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="icon"
                disabled={submitting}
              >
                <FaPen />
              </Button>
            )}
          </>
        )}
      </h1>
      <ListingVote listingId={listingId} userVote={userVote} />
    </div>
  );
};

export default ListingName;
