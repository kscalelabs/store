import ListingForm from "components/ListingForm";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Artifact, Listing } from "hooks/api";
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
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [Listing_id, setListingId] = useState<string>("");
  const [child_ids, setChildIds] = useState<string[]>([]);

  const { addAlert } = useAlertQueue();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const ListingData = await auth_api.getListingById(id);
        setName(ListingData.name);
        setDescription(ListingData.description || "");
        const artifacts: Artifact[] = [];
        ListingData.artifact_ids.forEach((id) => {
          const artifact: Artifact = {
            id,
            caption: "hi",
          };
          artifacts.push(artifact);
        });
        setArtifacts(artifacts);
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
    if (artifacts.length === 0) {
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
      navigate(`/listings/me/1`);
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
      description={Listing_description}
      setDescription={setDescription}
      artifacts={artifacts}
      setArtifacts={setArtifacts}
      child_ids={child_ids}
      setChildIds={setChildIds}
      handleSubmit={handleSubmit}
    />
  );
};

export default EditListingForm;
