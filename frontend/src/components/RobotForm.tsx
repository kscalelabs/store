import TCButton from "components/files/TCButton";
import { Bom, Image, Package, Part } from "hooks/api";
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
  robot_degrees_of_freedom: string | undefined;
  setDof: Dispatch<SetStateAction<string| undefined>>;
  robot_description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  robot_bom: Bom[];
  setBom: Dispatch<SetStateAction<Bom[]>>;
  parts: Part[];
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  robot_images: Image[];
  setImages: Dispatch<SetStateAction<Image[]>>;
  robotURDF: string;
  setURDF: Dispatch<SetStateAction<string>>;
  robot_packages: Package[];
  setPackages: Dispatch<SetStateAction<Package[]>>;
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
  robot_bom,
  setBom,
  parts,
  handleSubmit,
  robot_images,
  setImages,
  robotURDF,
  setURDF,
  robot_packages,
  setPackages,
}) => {
  const handlePackageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newPackages = [...robot_packages];
    newPackages[index][name as keyof Package] = value;
    setPackages(newPackages);
  };
  const handleAddPackage = () => {
    setPackages([...robot_packages, { name: "", url: "" }]);
  };
  const handleRemovePackage = (index: number) => {
    const newPackages = robot_packages.filter((_, i) => i !== index);
    setPackages(newPackages);
  };
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
    setImages([...robot_images, { url: "", caption: "" }]);
  };

  const handleImageUploadSuccess = (url: string, index: number) => {
    const newImages = [...robot_images];
    newImages[index].url = url;
    setImages(newImages);
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
        {robot_packages &&
          robot_packages.map((pkg, index) => (
            <Row key={index} className="mb-3">
              <Col md={12}>
                <label htmlFor={"name-" + index}>Caption</label>
                <Form.Control
                  id={"name-" + index}
                  className="mb-1"
                  type="text"
                  name="name"
                  value={pkg.name}
                  onChange={(e) => handlePackageChange(index, e)}
                  required
                />
                <Form.Control
                  id={"url-" + index}
                  className="mb-1"
                  type="text"
                  name="url"
                  value={pkg.url}
                  onChange={(e) => handlePackageChange(index, e)}
                  required
                />
              </Col>
              <Col md={12}>
                <TCButton
                  className="mb-2 mt-2"
                  variant="danger"
                  onClick={() => handleRemovePackage(index)}
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
            onClick={handleAddPackage}
          >
            Add Package
          </TCButton>
        </Col>

        <h2>Images</h2>
        {robot_images.map((image, index) => (
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
        <h2>Bill of Materials</h2>
        {robot_bom.map((bom, index) => (
          <Row key={index} className="mb-3">
            <Col>
              <label htmlFor={"part-" + index}>Part</label>
              <Form.Control
                id={"part-" + index}
                className="mb-1"
                as="select"
                name="part_id"
                value={bom.part_id}
                onChange={(e) => handleBomChange(index, e)}
                required
              >
                <option value="" disabled>
                  Select a Part
                </option>
                {parts.map((part, index) => (
                  <option key={index} value={part.id}>
                    {part.name}
                  </option>
                ))}
              </Form.Control>
              <label htmlFor={"quantity-" + index}>Quantity</label>
              <Form.Control
                id={"quantity-" + index}
                className="mb-1"
                type="number"
                name="quantity"
                value={bom.quantity}
                onChange={(e) => handleBomChange(index, e)}
                required
              />
            </Col>
            <Col md={12}>
              <TCButton
                className="mb-2 mt-2"
                variant="danger"
                onClick={() => handleRemoveBom(index)}
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
            onClick={handleAddBom}
          >
            Add Part
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
