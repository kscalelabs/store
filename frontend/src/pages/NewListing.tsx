import ListingForm from "components/ListingForm";
import { api, Image, Listing } from "hooks/api";
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
  const [part_description, setDescription] = useState<string>("");
  const [part_images, setImages] = useState<Image[]>([]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (part_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Listing = {
      id: "",
      name: name,
      description: part_description,
      owner: "Bob",
      images: part_images,
    };
    try {
      await auth_api.addListing(newFormData);
      setMessage(`Listing added successfully.`);
      navigate("/parts/me/1");
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
      part_description={part_description}
      setDescription={setDescription}
      part_images={part_images}
      setImages={setImages}
      handleSubmit={handleSubmit}
    />
  );
};

export default NewListing;
