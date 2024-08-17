import { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";

interface Props {
  listingId: string;
}

const ListingDeleteButton = (props: Props) => {
  const { listingId: listing_id } = props;
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
          path: { listing_id },
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
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
            <p className="text-lg mb-2">
              Are you sure you want to delete this listing?
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  handleDelete();
                  setConfirmDelete(false);
                }}
                variant="secondary"
              >
                <code>yes</code>
              </Button>
              <Button
                onClick={() => setConfirmDelete(false)}
                variant="secondary"
              >
                <code>no</code>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingDeleteButton;
