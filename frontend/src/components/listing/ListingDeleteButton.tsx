import { Button } from "components/ui/Button/Button";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  listing_id: string;
}

const ListingDeleteButton = (props: Props) => {
  const { listing_id } = props;
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
      addAlert("Listing deleted successfully", "success");
      navigate("/listings");
    }
  };

  return (
    <Button
      className="bg-red-500 hover:bg-red-600"
      onClick={handleDelete}
      variant={deleting ? "ghost" : "outline"}
      disabled={deleting}
    >
      <span className="mr-2">{deleting ? "Deleting..." : "Delete"}</span>
      <FaExclamation />
    </Button>
  );
};

export default ListingDeleteButton;
