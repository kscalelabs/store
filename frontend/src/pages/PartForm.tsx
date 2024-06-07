import { api, Bom, Image, Part } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

const PartForm: React.FC = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [message, setMessage] = useState<string | null>(null);
  const [part_name, setName] = useState<string>("");
  const [part_description, setDescription] = useState<string>("");
  const [part_images, setImages] = useState<Image[]>([]);

  const handleImageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newImages = [...part_images];
    newImages[index][name as keyof Image] = value;
    setImages(newImages);
  };

  const handleAddImage = () => {
    setImages([...part_images, { url: "", caption: "" }]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = part_images.filter((_, i) => i !== index);
    setImages(newImages);
  };

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
    } catch (error) {
      setMessage("Error adding Part ");
    }
  };

  return (
    <Row>
      <h2>Add a New Part</h2>
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
          value={part_name}
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
          value={part_description}
          required
        />
        Images:
        {part_images.map((image, index) => (
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
          <Button type="submit">Add Part!</Button>
        </Col>
      </Form>
    </Row>
  );
};

export default PartForm;
