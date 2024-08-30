import React, { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import Modal from "components/ui/Modal";

interface Props {
  listingId: string;
}

const ListingDeleteButton = (props: Props) => {
  const { listingId } = props;
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { addAlert, addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);

    const { error } = await auth.client.DELETE(
      "/listings/delete/{listing_id}",
      {
        params: {
          path: { listing_id: listingId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
      setDeleting(false);
    } else {
      addAlert("Listing was deleted successfully", "success");
      navigate("/browse");
    }
  };

  return (
    <>
      <Button
        onClick={() => setConfirmDelete(true)}
        variant={deleting ? "ghost" : "destructive"}
        disabled={deleting}
      >
        <span className="mr-2">{deleting ? "Deleting..." : "Delete"}</span>
        <FaExclamation />
      </Button>
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
          <p className="text-lg mb-6">
            Are you sure you want to delete this listing?
          </p>
          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => {
                handleDelete();
                setConfirmDelete(false);
              }}
              variant="destructive"
            >
              Yes, delete
            </Button>
            <Button onClick={() => setConfirmDelete(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ListingDeleteButton;
