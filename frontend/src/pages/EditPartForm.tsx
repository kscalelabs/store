import PartForm from "components/PartForm";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Image, Part } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditPartForm: React.FC = () => {
  const { theme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  // Parse the ID from the URL.
  const { id } = useParams();

  // States.
  const [message, setMessage] = useState<string>("");
  const [Part_name, setName] = useState<string>("");
  const [Part_description, setDescription] = useState<string>("");
  const [Part_images, setImages] = useState<Image[]>([]);
  const [Part_id, setPartId] = useState<string>("");

  const { addAlert } = useAlertQueue();

  useEffect(() => {
    const fetchPart = async () => {
      try {
        const PartData = await auth_api.getPartById(id);
        setName(PartData.part_name);
        setDescription(PartData.description);
        setImages(PartData.images);
        setPartId(PartData.part_id);
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchPart();
  }, [id]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Part_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Part = {
      part_id: Part_id,
      part_name: Part_name,
      description: Part_description,
      owner: "",
      images: Part_images,
    };
    try {
      await auth_api.editPart(newFormData);
      setMessage(`Part edited successfully.`);
      navigate(`/parts/your/`);
    } catch (error) {
      setMessage("Error adding part ");
    }
  };

  return (
    <PartForm
      theme={theme}
      title="Edit Part"
      message={message}
      part_name={Part_name}
      setName={setName}
      part_description={Part_description}
      setDescription={setDescription}
      part_images={Part_images}
      setImages={setImages}
      handleSubmit={handleSubmit}
    />
  );
};

export default EditPartForm;
