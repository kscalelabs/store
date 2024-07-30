import ListingForm from "components/ListingForm";
import { api, Artifact, Listing } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useEffect, useState } from "react";
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
  const [URDFId, setURDFId] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (artifacts.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }

    const artifact_ids = artifacts.map((artifact) => artifact.id);
    if (URDFId != null) {
      artifact_ids.push(URDFId);
    }

    try {
      await auth_api.addListing({
        name,
        description,
        artifact_ids,
        child_ids,
      });
      setMessage(`Listing added successfully.`);
      navigate("/listings/me/1");
    } catch (error) {
      setMessage("Error adding Listing ");
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listings = await auth_api.dumpListings();
        setListings(listings);
      } catch (err) {
        console.error(err);
      }
    };
    fetchListings();
  }, []);

  return (
    <ListingForm
      theme={theme}
      listings={listings}
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
      setURDFId={setURDFId}
    />
  );
};

export default NewListing;
