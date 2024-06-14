import { useAlertQueue } from "hooks/alerts";
import { api, Image } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  Button,
  ButtonGroup,
  Carousel,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";

interface PartDetailsResponse {
  part_name: string;
  owner: string;
  description: string;
  images: Image[];
}

const PartDetails = () => {
  const { addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [userId, setUserId] = useState<string | null>(null);
  const { id } = useParams();
  const [show, setShow] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [part, setPart] = useState<PartDetailsResponse | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleShowDelete = () => setShowDelete(true);
  const handleCloseDelete = () => setShowDelete(false);

  useEffect(() => {
    const fetchPart = async () => {
      try {
        const partData = await auth_api.getPartById(id);
        setPart(partData);
        const ownerUsername = await auth_api.getUserById(partData.owner);
        setOwnerUsername(ownerUsername);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };
    fetchPart();
  }, [id]);

  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      try {
        const fetchUserId = async () => {
          const user_id = await auth_api.currentUser();
          setUserId(user_id);
        };
        fetchUserId();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (error) {
      addAlert(error, "error");
    }
  }, [error]);

  if (!part) {
    return (
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
    );
  }

  const response: PartDetailsResponse = {
    part_name: part.part_name,
    owner: part.owner,
    description: part.description,
    images: part.images,
  };
  const { part_name, description, images } = response;

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/parts/")}>
          Parts
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{part_name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-3">
        <Col lg={6} md={12} className="mb-5">
          <Row>
            <Col>
              <h1>{part_name}</h1>
              <small className="text-muted">ID: {id}</small>
              <br />
              <em>{ownerUsername}</em>
            </Col>
          </Row>
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
        </Col>

        {images && (
          <Col lg={6} md={12}>
            <Carousel
              indicators
              data-bs-theme="dark"
              style={{ border: "1px solid #ccc" }}
              interval={null}
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
                  >
                    <img
                      className="d-block rounded-lg"
                      style={{ width: "100%", aspectRatio: "1/1" }}
                      src={image.url}
                      alt={image.caption}
                      onClick={() => {
                        setImageIndex(key);
                        handleShow();
                      }}
                    />
                  </div>
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
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        )}
      </Row>

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
            <img
              style={{ width: "95%", aspectRatio: "1/1" }}
              src={images[imageIndex].url}
              alt={images[imageIndex].caption}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <ButtonGroup>
            <Button
              variant="primary"
              onClick={() => {
                setImageIndex((imageIndex - 1 + images.length) % images.length);
              }}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setImageIndex((imageIndex + 1) % images.length);
              }}
            >
              Next
            </Button>
          </ButtonGroup>
        </Modal.Footer>
      </Modal>
      <>
        {part.owner === userId && (
          <>
            <Row className="justify-content-end mt-2">
              <Col md={3} sm={12}>
                <Button
                  variant="primary"
                  size="lg"
                  style={{
                    backgroundColor: "light-green",
                    borderColor: "",
                    padding: "10px",
                    width: "100%",
                  }}
                  onClick={() => {
                    navigate(`/edit-part/${id}/`);
                  }}
                >
                  Edit Part
                </Button>
              </Col>
              <Col md={3} sm={12}>
                <Button
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
                  Delete Part
                </Button>
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
                <Button
                  variant="danger"
                  onClick={async () => {
                    await auth_api.deletePart(id);
                    navigate(`/parts/your/`);
                  }}
                >
                  Delete Part
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    handleCloseDelete();
                  }}
                >
                  Cancel
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </>
    </>
  );
};

export default PartDetails;
