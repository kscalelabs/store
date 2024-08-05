import { Button } from "components/ui/Button/Button";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  listingId: string;
}

const ListingDeleteButton = (props: Props) => {
  const { listingId: listing_id } = props;
  const [deleting, setDeleting] = useState(false);

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
    <Button
      onClick={handleDelete}
      variant={deleting ? "ghost" : "destructive"}
      disabled={deleting}
    >
      <span className="mr-2">{deleting ? "Deleting..." : "Delete"}</span>
      <FaExclamation />
    </Button>
  );
};

export default ListingDeleteButton;
