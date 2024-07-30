import TCButton from "components/files/TCButton";
import ImageComponent from "components/files/ViewImage";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api, Artifact } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  ButtonGroup,
  Carousel,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";

interface ListingDetailsResponse {
  name: string;
  user_id: string;
  description?: string;
  artifact_ids: string[];
  child_ids: string[];
}

interface Child {
  id: string;
  name: string;
}

const RenderListing = ({
  listing,
  id,
}: {
  listing: ListingDetailsResponse;
  id: string;
}) => {
  const { addAlert } = useAlertQueue();
  const navigate = useNavigate();

  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const [userId, setUserId] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [imageIndex, setArtifactIndex] = useState<number>(0);
  const [showDelete, setShowDelete] = useState(false);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [images, setImages] = useState<Artifact[]>([]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleShowDelete = () => setShowDelete(true);
  const handleCloseDelete = () => setShowDelete(false);

  const { name, user_id, description, artifact_ids } = listing;

  useEffect(() => {
    if (auth.isAuthenticated) {
      try {
        const fetchUserId = async () => {
          const id = await auth_api.currentUser();
          setUserId(id);
        };
        fetchUserId();
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const ownerEmail = await auth_api.getUserById(user_id);
        setOwnerEmail(ownerEmail);
        const images = await auth_api.getImages(artifact_ids);
        setImages(images);
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchListing();
  }, [user_id]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const children = await auth_api.getListingsBatch(listing.child_ids);
        setChildren(
          children.map((child) => ({ id: child.id, name: child.name })),
        );
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    if (listing.child_ids.length > 0) {
      fetchChildren();
    }
  }, []);

  return (
    <>
      <Row className="mt-3">
        <Col lg={6} md={12} className="mb-5">
          <Row>
            <Col>
              <h1>{name}</h1>
              <small className="text-muted">ID: {id}</small>
              <br />
              <em>
                This listing is maintained by{" "}
                <a href={"mailto:" + ownerEmail}>{ownerEmail}</a>.
              </em>
            </Col>
          </Row>
          {children && (
            <Row>
              <Col>
                <p>This listing depends on the following listings:</p>
                <ul>
                  {children.map((child, id) => (
                    <li key={"child-" + id}>
                      <Link to={"/listing/" + child.id}>{child.name}</Link>
                    </li>
                  ))}
                </ul>
              </Col>
            </Row>
          )}
          <hr />
          <Row>
            <Col>
              <Markdown
                components={{
                  p: ({ ...props }) => <p {...props} className="mb-3" />,
                  li: ({ ...props }) => <li {...props} className="mb-1" />,
                  h1: ({ ...props }) => <h3 {...props} className="mt-1" />,
                  h2: ({ ...props }) => <h4 {...props} className="mt-1" />,
                  h3: ({ ...props }) => <h5 {...props} className="mt-1" />,
                  h4: ({ ...props }) => <h6 {...props} className="mt-1" />,
                  h5: ({ ...props }) => <h6 {...props} className="mt-1" />,
                  h6: ({ ...props }) => <h6 {...props} />,
                }}
              >
                {description}
              </Markdown>
            </Col>
          </Row>
          {user_id === userId && (
            <>
              <Row className="mt-2 row-two">
                <Col md={6} sm={12}>
                  <TCButton
                    variant="primary"
                    size="lg"
                    style={{
                      backgroundColor: "light-green",
                      borderColor: "",
                      padding: "10px",
                      width: "100%",
                    }}
                    onClick={() => {
                      navigate(`/listing/edit/${id}/`);
                    }}
                  >
                    Edit Listing
                  </TCButton>
                </Col>
                <Col md={6} sm={12}>
                  <TCButton
                    variant="danger"
                    size="lg"
                    style={{
                      backgroundColor: "light-green",
                      borderColor: "",
                      padding: "10px",
                      width: "100%",
                    }}
                    onClick={() => {
                      handleShowDelete();
                    }}
                  >
                    Delete Listing
                  </TCButton>
                </Col>
              </Row>
              <Modal
                show={showDelete}
                onHide={handleCloseDelete}
                fullscreen="md-down"
                centered
                size="lg"
                scrollable
              >
                <Modal.Header closeButton>
                  <Modal.Title>
                    Are you sure you want to delete this part?
                  </Modal.Title>
                </Modal.Header>
                <Modal.Footer className="d-flex justify-content-start">
                  <TCButton
                    variant="danger"
                    onClick={async () => {
                      await auth_api.deleteListing(id);
                      navigate(`/listings/me/1`);
                    }}
                  >
                    Delete Listing
                  </TCButton>
                  <TCButton
                    variant="outline-secondary"
                    onClick={() => {
                      handleCloseDelete();
                    }}
                  >
                    Cancel
                  </TCButton>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </Col>
        <Col lg={1} md={0} />
        <Col lg={5} md={12}>
          <Carousel
            indicators
            data-bs-theme="dark"
            style={{ border: "1px solid #ccc" }}
            interval={null}
            controls={images.length > 1}
          >
            {images.map((image, key) => (
              <Carousel.Item key={key}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                  onClick={() => {
                    handleShow();
                  }}
                >
                  <ImageComponent
                    imageId={image.id}
                    size={"large"}
                    caption={image.caption}
                  />
                </div>
                {image.caption && (
                  <Carousel.Caption
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "black",
                      padding: "0.1rem",
                      // Put the caption at the top
                      top: 10,
                      bottom: "unset",
                    }}
                  >
                    {image.caption}
                  </Carousel.Caption>
                )}
              </Carousel.Item>
            ))}
          </Carousel>
        </Col>
      </Row>

      {images.length > 0 && (
        <Modal
          show={show}
          onHide={handleClose}
          fullscreen="md-down"
          centered
          size="lg"
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {images[imageIndex].caption} ({imageIndex + 1} of {images.length})
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ImageComponent
                imageId={images[imageIndex].id}
                size={"large"}
                {...(images[imageIndex].caption && {
                  caption: images[imageIndex].caption,
                })}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            {images.length > 1 && (
              <ButtonGroup>
                <TCButton
                  variant="primary"
                  onClick={() => {
                    setArtifactIndex(
                      (imageIndex - 1 + images.length) % images.length,
                    );
                  }}
                >
                  Previous
                </TCButton>
                <TCButton
                  variant="primary"
                  onClick={() => {
                    setArtifactIndex((imageIndex + 1) % images.length);
                  }}
                >
                  Next
                </TCButton>
              </ButtonGroup>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

const ListingDetails = () => {
  const { addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { id } = useParams();
  const [listing, setListing] = useState<ListingDetailsResponse | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const partData = await auth_api.getListingById(id);
        setListing(partData);
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchListing();
  }, [id]);

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/listings/1")}>
          Listings
        </Breadcrumb.Item>
        {listing && <Breadcrumb.Item active>{listing.name}</Breadcrumb.Item>}
      </Breadcrumb>

      {listing && id ? (
        <RenderListing listing={listing} id={id} />
      ) : (
        <Container
          fluid
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <Row className="w-100">
            <Col className="d-flex justify-content-center align-items-center">
              <Spinner animation="border" />
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

export default ListingDetails;
