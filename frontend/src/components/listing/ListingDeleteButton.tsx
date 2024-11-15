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
  className?: string;
  initialFeatured?: boolean;
}

const ListingDeleteButton = (props: Props) => {
  const { listingId, className, initialFeatured } = props;
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { addAlert, addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);

    try {
      if (initialFeatured) {
        const featureResponse = await auth.client.DELETE(
          "/listings/featured/{listing_id}",
          {
            params: {
              path: { listing_id: listingId },
            },
          },
        );

        if (featureResponse.error) {
          addErrorAlert("Failed to remove from featured listings");
          setDeleting(false);
          return;
        }
      }

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
    } catch {
      addErrorAlert("An error occurred while deleting the listing");
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setConfirmDelete(true)}
        variant="outline"
        disabled={deleting}
        className={`flex items-center text-red-600 hover:text-red-500 hover:border-red-600 ${className}`}
      >
        <FaTrash className="mr-2 h-4 w-4" />
        <span>{deleting ? "Deleting..." : "Delete Listing"}</span>
      </Button>
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="p-8 bg-gray-12 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-2">
            Confirm Deletion
          </h2>
          <p className="mb-6 text-gray-9">
            Are you sure you want to delete this listing? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setConfirmDelete(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDelete();
                setConfirmDelete(false);
              }}
              variant="destructive"
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
