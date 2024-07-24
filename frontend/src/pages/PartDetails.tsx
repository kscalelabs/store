import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { api, Image } from "hooks/api";
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
import { useNavigate, useParams } from "react-router-dom";

interface PartDetailsResponse {
  name: string;
  owner: string;
  description: string;
  images: Image[];
}

import ImageComponent from "components/files/ViewImage";

const PartDetails = () => {
  const { addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [userId, setUserId] = useState<string | null>(null);
  const { id } = useParams();
  const [show, setShow] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
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
        const ownerEmail = await auth_api.getUserById(partData.owner);
        setOwnerEmail(ownerEmail);
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
          const id = await auth_api.currentUser();
          setUserId(id);
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
    name: part.name,
    owner: part.owner,
    description: part.description,
    images: part.images,
  };
  const { name, description, images } = response;

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/parts/1")}>
          Parts
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{name}</Breadcrumb.Item>
      </Breadcrumb>

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
          {part.owner === userId && (
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
                      navigate(`/edit-part/${id}/`);
                    }}
                  >
                    Edit Part
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
                    Delete Part
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
                      await auth_api.deletePart(id);
                      navigate(`/parts/your/1`);
                    }}
                  >
                    Delete Part
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

        {images && (
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
                      imageId={images[key].url + ".png"}
                      caption={images[key].caption}
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
            <ImageComponent
              imageId={images[imageIndex].url + ".png"}
              caption={images[imageIndex].caption}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          {images.length > 1 && (
            <ButtonGroup>
              <TCButton
                variant="primary"
                onClick={() => {
                  setImageIndex(
                    (imageIndex - 1 + images.length) % images.length,
                  );
                }}
              >
                Previous
              </TCButton>
              <TCButton
                variant="primary"
                onClick={() => {
                  setImageIndex((imageIndex + 1) % images.length);
                }}
              >
                Next
              </TCButton>
            </ButtonGroup>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PartDetails;
