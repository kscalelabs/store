import { useState } from "react";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";

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
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-normal flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={handleChange}
              className="border rounded px-2 py-1"
              disabled={submitting}
            />
            <button
              onClick={handleSave}
              disabled={submitting}
              className="text-green-600 hover:text-green-700 disabled:text-gray-400"
            >
              <FaSave />
            </button>
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
          </div>
        ) : (
          <>
            {name}
            {edit && (
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsEditing(true)}
              >
                <span className="text-sm">
                  <FaPencilAlt />
                </span>
              </button>
            )}
          </>
        )}
      </h1>
      <ListingVote listingId={listingId} userVote={userVote} />
    </div>
  );
};

export default ListingName;
