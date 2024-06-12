import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Bom, Image, Part, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const EditPartForm: React.FC = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  // Parse the ID from the URL.
  const { id } = useParams();

  // States.
  const [message, setMessage] = useState<string | null>(null);
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

  const handleImageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newImages = [...Part_images];
    newImages[index][name as keyof Image] = value;
    setImages(newImages);
  };
  const navigate = useNavigate();
  const handleAddImage = () => {
    setImages([...Part_images, { url: "", caption: "" }]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = Part_images.filter((_, i) => i !== index);
    setImages(newImages);
  };

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
    <Row>
      <h2>Edit Part</h2>
      {message && <p>{message}</p>}
      <Form onSubmit={handleSubmit} className="mb-3">
        Name:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="Part Name:"
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={Part_name}
          required
        />
        Description:
        <Form.Control
          className="mb-3"
          type="text"
          placeholder="Part Description:"
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          value={Part_description}
          required
        />
        Images:
        {Part_images.map((image, index) => (
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
        Submit:
        <Col md={6}>
          <Button type="submit">Confirm Changes!</Button>
        </Col>
      </Form>
    </Row>
  );
};

export default EditPartForm;
