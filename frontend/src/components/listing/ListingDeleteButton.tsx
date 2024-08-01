import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useState } from "react";
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
    <div className="mb-3">
      <TCButton
        className="mb-3"
        onClick={handleDelete}
        variant="danger"
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </TCButton>
    </div>
  );
};

export default ListingDeleteButton;
