import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

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
      navigate(ROUTES.BOTS.BROWSE.path);
    }
  };

  return (
    <>
      <Button
        onClick={() => setConfirmDelete(true)}
        variant={deleting ? "ghost" : "destructive"}
        disabled={deleting}
        className="flex items-center space-x-2 !px-3 !py-1 !rounded-lg transition-all duration-300 bg-red-500 hover:bg-red-600 text-white"
      >
        <FaTrash className="text-lg" />
        <span>{deleting ? "Deleting..." : "Delete Listing"}</span>
      </Button>
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="p-8 bg-gray-3 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-12">
            Confirm Deletion
          </h2>
          <p className="mb-6 text-gray-11">
            Are you sure you want to delete this listing? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setConfirmDelete(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDelete();
                setConfirmDelete(false);
              }}
              variant="destructive"
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ListingDeleteButton;
