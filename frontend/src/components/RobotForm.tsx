import TCButton from "components/files/TCButton";
import { Image } from "hooks/api";
import { Theme } from "hooks/theme";
import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { Col, Form, Row } from "react-bootstrap";
import ImageUploadComponent from "./files/UploadImage";

interface RobotFormProps {
  theme: Theme;
  title: string;
  message: string;
  robot_name: string;
  setName: Dispatch<SetStateAction<string>>;
  robot_height: string;
  setHeight: Dispatch<SetStateAction<string>>;
  robot_weight: string;
  setWeight: Dispatch<SetStateAction<string>>;
  robot_degrees_of_freedom: string;
  setDof: Dispatch<SetStateAction<string>>;
  robot_description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  robot_images: Image[];
  setImages: Dispatch<SetStateAction<Image[]>>;
  robotURDF: string;
  setURDF: Dispatch<SetStateAction<string>>;
}

const RobotForm: React.FC<RobotFormProps> = ({
  theme,
  title,
  message,
  robot_name,
  setName,
  robot_height,
  setHeight,
  robot_weight,
  setWeight,
  robot_degrees_of_freedom,
  setDof,
  robot_description,
  setDescription,
  handleSubmit,
  robot_images,
  setImages,
  robotURDF,
  setURDF,
}) => {
  const handleImageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newImages = [...robot_images];
    newImages[index][name as keyof Image] = value;
    setImages(newImages);
  };

  const handleAddImage = () => {
    setImages([...robot_images, { id: "", caption: "" }]);
  };

  const handleImageUploadSuccess = (image_id: string, index: number) => {
    const newImages = [...robot_images];
    newImages[index].id = image_id;
    setImages(newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = robot_images.filter((_, i) => i !== index);
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
          value={robot_name}
          required
        />
        <label htmlFor="height">Height (Optional)</label>
        <Form.Control
          id="height"
          className="mb-3"
          type="text"
          placeholder="Optional"
          onChange={(e) => {
            setHeight(e.target.value);
          }}
          value={robot_height}
        />
        <label htmlFor="weight">Weight (Optional)</label>
        <Form.Control
          id="weight"
          className="mb-3"
          type="text"
          placeholder="Optional"
          onChange={(e) => {
            setWeight(e.target.value);
          }}
          value={robot_weight}
        />
        <label htmlFor="dof">Total Degrees of Freedom (Optional)</label>
        <Form.Control
          id="dof"
          className="mb-3"
          type="text"
          placeholder="Optional"
          onChange={(e) => {
            setDof(e.target.value);
          }}
          value={robot_degrees_of_freedom}
        />
        <label htmlFor="desc">Description</label>
        <Form.Control
          id="desc"
          className="mb-3"
          as="textarea"
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          value={robot_description}
          required
        />
        <h2>URDF (Optional)</h2>
        <label htmlFor="urdf">URDF Link (Optional)</label>
        <Form.Control
          id="urdf"
          className="mb-3"
          type="text"
          placeholder="ex. https://raw.githubusercontent.com/path/to/urdf.urdf"
          onChange={(e) => {
            setURDF(e.target.value);
          }}
          value={robotURDF}
        />
        <label htmlFor="packages">URDF Packages (Optional)</label>

        <h2>Images</h2>

        {robot_images.map((image, index) => (
          <Row key={index} className="mb-3">
            <Col md={12}>
              <ImageUploadComponent
                onUploadSuccess={(image_id) =>
                  handleImageUploadSuccess(image_id, index)
                }
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
              <TCButton
                className="mb-2 mt-2"
                variant="danger"
                onClick={() => handleRemoveImage(index)}
              >
                Remove
              </TCButton>
            </Col>
          </Row>
        ))}

        <Col>
          <TCButton
            className="mb-3"
            variant={theme === "dark" ? "outline-light" : "outline-dark"}
            onClick={handleAddImage}
          >
            Add Image
          </TCButton>
        </Col>
        <Col>
          <TCButton type="submit">Submit</TCButton>
        </Col>
      </Form>
    </>
  );
};

export default RobotForm;
