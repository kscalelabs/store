import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Bom, Image, Part, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const EditRobotForm: React.FC = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  // Parse the ID from the URL.
  const { id } = useParams();

  // States.
  const [message, setMessage] = useState<string | null>(null);
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

  const handleImageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newImages = [...robot_images];
    newImages[index][name as keyof Image] = value;
    setImages(newImages);
  };
  const navigate = useNavigate();
  const handleAddImage = () => {
    setImages([...robot_images, { url: "", caption: "" }]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = robot_images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleBomChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newBom = [...robot_bom];
    if (name === "quantity") {
      newBom[index][name as "quantity"] = Number(value);
    } else {
      newBom[index][name as "part_id"] = value;
    }

    setBom(newBom);
  };

  const handleAddBom = () => {
    setBom([...robot_bom, { part_id: "", quantity: 0 }]);
  };

  const handleRemoveBom = (index: number) => {
    const newBom = robot_bom.filter((_, i) => i !== index);
    setBom(newBom);
  };

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
    <Row>
      <h2>Edit Robot</h2>
      {message && <p>{message}</p>}
      <Form onSubmit={handleSubmit} className="mb-3">
        Name:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="Robot Name:"
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={robot_name}
          required
        />
        Height:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="(Optional) Robot Height:"
          onChange={(e) => {
            setHeight(e.target.value);
          }}
          value={robot_height}
        />
        Weight:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="(Optional) Robot Weight:"
          onChange={(e) => {
            setWeight(e.target.value);
          }}
          value={robot_weight}
        />
        Total Degrees of Freedom:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="(Optional) Robot Total Degrees of Freedom:"
          onChange={(e) => {
            setDof(e.target.value);
          }}
          value={robot_degrees_of_freedom}
        />
        Description:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="Robot Description:"
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          value={robot_description}
          required
        />
        Images:
        {robot_images.map((image, index) => (
          <Row key={index} className="mb-3">
            <Col md={12}>
              <Form.Control
                className="mb-1"
                type="text"
                placeholder="Image URL"
                name="url"
                value={image.url}
                onChange={(e) => handleImageChange(index, e)}
                required
              />
              <Form.Control
                className="mb-1"
                type="text"
                placeholder="Image Caption"
                name="caption"
                value={image.caption}
                onChange={(e) => handleImageChange(index, e)}
                required
              />
            </Col>
            <Col md={12}>
              <Button
                className="mb-3"
                size="sm"
                variant="danger"
                onClick={() => handleRemoveImage(index)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Col md={6}>
          <Button className="mb-3" variant="primary" onClick={handleAddImage}>
            Add Image
          </Button>
        </Col>
        Bill of Materials:
        {robot_bom.map((bom, index) => (
          <Row key={index} className="mb-3">
            <Col md={12}>
              Part:
              <Form.Control
                className="mb-1"
                as="select"
                placeholder="Part Id: "
                name="part_id"
                value={bom.part_id}
                onChange={(e) => handleBomChange(index, e)}
                required
              >
                <option value="" disabled>
                  Select a Part
                </option>
                {parts.map((part, index) => (
                  <option key={index} value={part.part_id}>
                    {part.part_name}
                  </option>
                ))}
              </Form.Control>
              Quantity:
              <Form.Control
                className="mb-1"
                type="number"
                placeholder="Quantity:"
                name="quantity"
                value={bom.quantity}
                onChange={(e) => handleBomChange(index, e)}
                required
              />
            </Col>
            <Col md={12}>
              <Button
                className="mb-3"
                size="sm"
                variant="danger"
                onClick={() => handleRemoveBom(index)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Col md={6}>
          <Button className="mb-3" variant="primary" onClick={handleAddBom}>
            Add Part
          </Button>
        </Col>
        Submit:
        <Col md={6}>
          <Button type="submit">Confirm Changes!</Button>
        </Col>
      </Form>
    </Row>
  );
};

export default EditRobotForm;
