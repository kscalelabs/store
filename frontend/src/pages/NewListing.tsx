import ListingForm from "components/ListingForm";
import { api, Artifact, Listing } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const NewListing: React.FC = () => {
  const { theme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [message, setMessage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [child_ids, setChildIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (artifacts.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Listing = {
      id: "",
      name,
      description: description,
      user_id: "",
      artifact_ids: artifacts.map((artifact) => artifact.id),
      child_ids,
    };
    try {
      await auth_api.addListing(newFormData);
      setMessage(`Listing added successfully.`);
      navigate("/listings/me/1");
    } catch (error) {
      setMessage("Error adding Listing ");
    }
  };

  return (
    <ListingForm
      theme={theme}
      title="Add a New Listing"
      message={message}
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      artifacts={artifacts}
      setArtifacts={setArtifacts}
      child_ids={child_ids}
      setChildIds={setChildIds}
      handleSubmit={handleSubmit}
    />
  );
};

export default NewListing;
