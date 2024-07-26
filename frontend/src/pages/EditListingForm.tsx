import ListingForm from "components/ListingForm";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Listing } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditListingForm: React.FC = () => {
  const { theme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  // Parse the ID from the URL.
  const { id } = useParams();

  // States.
  const [message, setMessage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [Listing_description, setDescription] = useState<string>("");
  const [Listing_images, setImages] = useState<string[]>([]);
  const [Listing_id, setListingId] = useState<string>("");

  const { addAlert } = useAlertQueue();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const ListingData = await auth_api.getListingById(id);
        setName(ListingData.name);
        setDescription(ListingData.description || "");
        setImages(ListingData.artifact_ids);
        setListingId(ListingData.id);
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchListing();
  }, [id]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Listing_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Listing = {
      id: Listing_id,
      name: name,
      description: Listing_description,
      user_id: "",
      artifact_ids: [],
      child_ids: [],
    };
    try {
      await auth_api.editListing(newFormData);
      setMessage(`Listing edited successfully.`);
      navigate(`/parts/me/1`);
    } catch (error) {
      setMessage("Error adding part ");
    }
  };

  return (
    <ListingForm
      theme={theme}
      title="Edit Listing"
      message={message}
      name={name}
      setName={setName}
      part_description={Listing_description}
      setDescription={setDescription}
      part_artifacts={Listing_images}
      setArtifacts={setArtifacts}
      handleSubmit={handleSubmit}
    />
  );
};

export default EditListingForm;
