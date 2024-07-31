import TCButton from "components/files/TCButton";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

type ListingDumpResponse =
  paths["/listings/dump"]["get"]["responses"][200]["content"]["application/json"];

const NewListing = () => {
  const auth = useAuthentication();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [listings, setListings] = useState<ListingDumpResponse | null>(null);
  const [children, setChildren] = useState<string[]>([]); // Store the ids of each child

  const { addAlert, addErrorAlert } = useAlertQueue();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleChildrenChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = e.target;
    const newChildren = [...children];
    newChildren[index] = value;
    setChildren(newChildren);
  };

  const handleAddChild = () => {
    setChildren([...children, ""]);
  };

  const handleRemoveChild = (index: number) => {
    const newChildren = children.filter((_, i) => i !== index);
    setChildren(newChildren);
  };

  // Fetch all listings to use for children.
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data, error } = await auth.client.GET("/listings/dump");
        if (error) {
          addErrorAlert(error);
        } else {
          setListings(data);
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchListings();
  }, []);

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
      addErrorAlert(error);
    } else {
      addAlert("Listing added successfully", "success");
      navigate(`/listing/${data.listing_id}`);
    }
  };

  return (
    <>
      <h1 className="display-6">Create Listing</h1>
      <Form onSubmit={handleSubmit} className="mb-3">
        {/* Name */}
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

        {/* Description */}
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

        <p>Children</p>
        {children.map((id, index) => (
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
                  Select a Listing
                </option>
                {listings &&
                  listings.listings.map((listing, index) => (
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

        <TCButton
          className="mb-3"
          variant={theme === "dark" ? "outline-light" : "outline-dark"}
          onClick={handleAddChild}
        >
          Add Child
        </TCButton>

        {/* Submit */}
        <Col md={12} className="mb-4">
          <TCButton type="submit">Submit</TCButton>
        </Col>
      </Form>
    </>
  );
};

export default NewListing;
