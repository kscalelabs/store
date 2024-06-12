import PartForm from "components/PartForm";
import { api, Image, Part } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const NewPart: React.FC = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [message, setMessage] = useState<string>("");
  const [part_name, setName] = useState<string>("");
  const [part_description, setDescription] = useState<string>("");
  const [part_images, setImages] = useState<Image[]>([]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (part_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Part = {
      part_id: "",
      part_name: part_name,
      description: part_description,
      owner: "Bob",
      images: part_images,
    };
    try {
      await auth_api.addPart(newFormData);
      setMessage(`Part added successfully.`);
      navigate("/parts/your/");
    } catch (error) {
      setMessage("Error adding Part ");
    }
  };

  return (
    <PartForm
      title="Add a New Part"
      message={message}
      part_name={part_name}
      setName={setName}
      part_description={part_description}
      setDescription={setDescription}
      part_images={part_images}
      setImages={setImages}
      handleSubmit={handleSubmit}
    />
  );
};

export default NewPart;
