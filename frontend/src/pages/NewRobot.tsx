import RobotForm from "components/RobotForm";
import { api, Bom, Image, Part, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NewRobot: React.FC = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [message, setMessage] = useState<string>("");
  const [robot_name, setName] = useState<string>("");
  const [robot_height, setHeight] = useState<string>("");
  const [robot_weight, setWeight] = useState<string>("");
  const [robot_degrees_of_freedom, setDof] = useState<string>("");
  const [robot_description, setDescription] = useState<string>("");
  const [robot_bom, setBom] = useState<Bom[]>([]);
  const [robot_images, setImages] = useState<Image[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (robot_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Robot = {
      robot_id: "",
      name: robot_name,
      description: robot_description,
      owner: "",
      bom: robot_bom,
      images: robot_images,
      height: robot_height,
      weight: robot_weight,
      degrees_of_freedom: robot_degrees_of_freedom,
    };
    try {
      await auth_api.addRobot(newFormData);
      setMessage(`Robot added successfully.`);
      navigate(`/robots/your/`);
    } catch (error) {
      setMessage("Error adding robot ");
    }
  };

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const partsQuery = await auth_api.getParts();
        setParts(partsQuery);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParts();
  }, []);

  return (
    <RobotForm
      title="Add a New Robot"
      robot_name={robot_name}
      setName={setName}
      robot_height={robot_height}
      setHeight={setHeight}
      robot_weight={robot_weight}
      setWeight={setWeight}
      robot_degrees_of_freedom={robot_degrees_of_freedom}
      setDof={setDof}
      robot_description={robot_description}
      setDescription={setDescription}
      robot_bom={robot_bom}
      setBom={setBom}
      parts={parts}
      handleSubmit={handleSubmit}
      robot_images={robot_images}
      setImages={setImages}
      message={message}
    />
  );
};

export default NewRobot;
