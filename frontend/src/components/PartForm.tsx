import { Image } from "hooks/api";
import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import ImageUploadComponent from "./files/UploadImage";

interface PartFormProps {
  title: string;
  message: string;
  part_name: string;
  setName: Dispatch<SetStateAction<string>>;
  part_description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  part_images: Image[];
  setImages: Dispatch<SetStateAction<Image[]>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const PartForm: React.FC<PartFormProps> = ({
  title,
  message,
  part_name,
  setName,
  part_description,
  setDescription,
  part_images,
  setImages,
  handleSubmit,
}) => {
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

  const handleImageUploadSuccess = (url: string, index: number) => {
    const newImages = [...part_images];
    newImages[index].url = url;
    setImages(newImages);
  };

  return (
    <>
      <h1>{title}</h1>
      {message && <p>{message}</p>}
      <Form onSubmit={handleSubmit} className="mb-3">
        <label htmlFor="name">Name</label>
        <Form.Control
          id="name"
          className="mb-3"
          type="text"
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={part_name}
          required
        />
        <label htmlFor="desc">Description</label>
        <Form.Control
          id="desc"
          className="mb-3"
          as="textarea"
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          value={part_description}
          required
        />
        <h2>Images</h2>
        {part_images.map((image, index) => (
          <Row key={index} className="mb-3">
            <Col md={12}>
              <ImageUploadComponent
                onUploadSuccess={(url) => handleImageUploadSuccess(url, index)}
              />
              <label htmlFor={"caption-" + index}>Caption</label>
              <Form.Control
                id={"caption-" + index}
                className="mb-1"
                type="text"
                name="caption"
                value={image.caption}
                onChange={(e) => handleImageChange(index, e)}
                required
              />
            </Col>
            <Col md={12}>
              <Button
                className="mb-2 mt-2"
                variant="danger"
                onClick={() => handleRemoveImage(index)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Col>
          <Button className="mb-3" variant="secondary" onClick={handleAddImage}>
            Add Image
          </Button>
        </Col>
        <Col md={12}>
          <Button type="submit">Submit</Button>
        </Col>
      </Form>
    </>
  );
};

export default PartForm;
