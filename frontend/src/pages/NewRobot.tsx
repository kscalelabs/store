import RobotForm from "components/RobotForm";
import { api, Bom, Image, Package, Part, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NewRobot: React.FC = () => {
  const { theme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [message, setMessage] = useState<string>("");
  const [robot_name, setName] = useState<string>("");
  const [robot_height, setHeight] = useState<string>("");
  const [robot_weight, setWeight] = useState<string>("");
  const [robot_urdf, setURDF] = useState<string>("");
  const [robot_degrees_of_freedom, setDof] = useState<string | undefined>(
    undefined,
  );
  const [robot_description, setDescription] = useState<string>("");
  const [robot_packages, setPackages] = useState<Package[]>([]);
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
      id: "",
      name: robot_name,
      description: robot_description,
      owner: "",
      bom: robot_bom,
      images: robot_images,
      urdf: "",
      height: robot_height,
      weight: robot_weight,
      degrees_of_freedom: robot_degrees_of_freedom,
      packages: robot_packages,
    };
    try {
      await auth_api.addRobot(newFormData);
      setMessage(`Robot added successfully.`);
      navigate(`/robots/me/1`);
    } catch (error) {
      setMessage("Error adding robot ");
    }
  };

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const partsQuery = await auth_api.dumpParts();
        setParts(partsQuery);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParts();
  }, []);

  return (
    <RobotForm
      theme={theme}
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
      setURDF={setURDF}
      robotURDF={robot_urdf}
      robot_packages={robot_packages}
      setPackages={setPackages}
    />
  );
};

export default NewRobot;
