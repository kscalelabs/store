import RobotForm from "components/RobotForm";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Bom, Image, Part, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditRobotForm: React.FC = () => {
  const { theme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  // Parse the ID from the URL.
  const { id } = useParams();

  // States.
  const [message, setMessage] = useState<string>("");
  const [robot_name, setName] = useState<string>("");
  const [robot_description, setDescription] = useState<string>("");
  const [robot_height, setHeight] = useState<string>("");
  const [robot_weight, setWeight] = useState<string>("");
  const [robot_degrees_of_freedom, setDof] = useState<string>("");
  const [robot_bom, setBom] = useState<Bom[]>([]);
  const [robot_images, setImages] = useState<Image[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [robot_id, setRobotId] = useState<string>("");

  const { addAlert } = useAlertQueue();

  useEffect(() => {
    const fetchRobot = async () => {
      try {
        const robotData = await auth_api.getRobotById(id);
        setName(robotData.name);
        setDescription(robotData.description);
        setBom(robotData.bom);
        setImages(robotData.images);
        setRobotId(robotData.robot_id);
        setHeight(robotData.height);
        setWeight(robotData.weight);
        setDof(robotData.degrees_of_freedom);
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchRobot();
  }, [id]);

  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (robot_images.length === 0) {
      setMessage("Please upload at least one image.");
      return;
    }
    const newFormData: Robot = {
      robot_id: robot_id,
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
      await auth_api.editRobot(newFormData);
      setMessage(`Robot edited successfully.`);
      navigate(`/robots/your/1`);
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
      theme={theme}
      title="Edit Robot"
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

export default EditRobotForm;
