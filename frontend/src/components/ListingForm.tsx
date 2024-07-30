import TCButton from "components/files/TCButton";
import { Artifact, Listing } from "hooks/api";
import { Theme } from "hooks/theme";
import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { Col, Form, Row } from "react-bootstrap";
import ImageUploadComponent from "./files/UploadImage";
import URDFUploadComponent from "./files/UploadURDF";

interface ListingFormProps {
  theme: Theme;
  listings: Listing[];
  title: string;
  message: string;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  artifacts: Artifact[];
  setArtifacts: Dispatch<SetStateAction<Artifact[]>>;
  child_ids: string[];
  setChildIds: Dispatch<SetStateAction<string[]>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setURDFId: Dispatch<SetStateAction<string | null>>;
}

const ListingForm: React.FC<ListingFormProps> = ({
  theme,
  listings,
  title,
  message,
  name,
  setName,
  description,
  setDescription,
  artifacts,
  setArtifacts,
  child_ids,
  setChildIds,
  setURDFId,
  handleSubmit,
}) => {
  const handleImageChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newImages = [...artifacts];
    newImages[index][name as keyof Artifact] = value;
    setArtifacts(newImages);
  };

  const handleAddImage = () => {
    setArtifacts([...artifacts, { id: "", caption: "" }]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = artifacts.filter((_, i) => i !== index);
    setArtifacts(newImages);
  };

  const handleImageUploadSuccess = (image_id: string, index: number) => {
    const newImages = [...artifacts];
    newImages[index].id = image_id;
    setArtifacts(newImages);
  };

  const handleURDFUploadSuccess = (id: string) => {
    setURDFId(id);
  };

  const handleChildrenChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = e.target;
    const newChildren = [...child_ids];
    newChildren[index] = value;
    setChildIds(newChildren);
  };

  const handleAddChild = () => {
    setChildIds([...child_ids, ""]);
  };

  const handleRemoveChild = (index: number) => {
    const newChildren = child_ids.filter((_, i) => i !== index);
    setChildIds(newChildren);
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
          value={name}
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
          value={description}
          required
        />
        <h2>Images</h2>
        {artifacts.map((image, index) => (
          <Row key={index} className="mb-3">
            <Col md={12}>
              <ImageUploadComponent
                onUploadSuccess={(image_id) =>
                  handleImageUploadSuccess(image_id, index)
                }
                imageId={image.id}
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
        <h2>URDF (Optional)</h2>
        <URDFUploadComponent
          onUploadSuccess={(id) => handleURDFUploadSuccess(id)}
        />

        <h2>Children</h2>
        {child_ids.map((id, index) => (
          <Row key={index} className="mb-3">
            <Col>
              <label htmlFor={"child-" + index}>Listing</label>
              <Form.Control
                id={"child-" + index}
                className="mb-1"
                as="select"
                name="child_id"
                value={id}
                onChange={(e) => handleChildrenChange(index, e)}
                required
              >
                <option value="" disabled>
                  Select a Child
                </option>
                {listings.map((listing, index) => (
                  <option key={index} value={listing.id}>
                    {listing.name} ({listing.id})
                  </option>
                ))}
              </Form.Control>
            </Col>
            <Col md={12}>
              <TCButton
                className="mb-2 mt-2"
                variant="danger"
                onClick={() => handleRemoveChild(index)}
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
            onClick={handleAddChild}
          >
            Add Child
          </TCButton>
        </Col>
        <Col md={12}>
          <TCButton type="submit">Submit</TCButton>
        </Col>
      </Form>
    </>
  );
};

export default ListingForm;
