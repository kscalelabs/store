import TCButton from "components/files/TCButton";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { Col, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface ListingFormProps {
  title: string;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const ListingForm = (props: ListingFormProps) => {
  const { title, name, setName, description, setDescription, handleSubmit } =
    props;

  return (
    <>
      <h1>{title}</h1>
      <Form onSubmit={handleSubmit} className="mb-3">
        {/* Name */}
        <Col md={12} className="mb-4">
          <label htmlFor="name">Name</label>
          <Form.Control
            id="name"
            className="mt-2"
            type="text"
            onChange={(e) => {
              setName(e.target.value);
            }}
            value={name}
            required
          />
        </Col>

        {/* Description */}
        <Col md={12} className="mb-4">
          <label htmlFor="desc">Description</label>
          <Form.Control
            id="desc"
            className="mt-2"
            as="textarea"
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            value={description}
          />
        </Col>

        {/* Submit */}
        <Col md={12} className="mb-4">
          <TCButton type="submit">Submit</TCButton>
        </Col>
      </Form>
    </>
  );
};

const NewListing = () => {
  const auth = useAuthentication();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const { addAlert } = useAlertQueue();
  const navigate = useNavigate();

  // On submit, add the listing to the database and navigate to the
  // newly-created listing.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { data, error } = await auth.client.POST("/listings/add", {
      body: {
        name,
        description,
        child_ids: [],
      },
    });

    if (error) {
      addAlert(humanReadableError(error), "error");
    } else {
      addAlert("Listing added successfully", "success");
      navigate(`/listing/${data.listing_id}`);
    }
  };

  return (
    <ListingForm
      title="Create Listing"
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      handleSubmit={handleSubmit}
    />
  );
};

export default NewListing;
