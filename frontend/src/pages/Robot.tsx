import { useState } from "react";
import {
  Breadcrumb,
  Button,
  ButtonGroup,
  Carousel,
  Col,
  Container,
  Modal,
  Row,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

interface RobotDetailsResponse {
  name: string;
  owner: string;
  links: { name: string; url: string }[];
  images: { url: string; caption: string }[];
}

const RobotDetails = () => {
  const { id } = useParams();
  const [show, setShow] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // This is a placeholder before the backend is hooked up.
  const response: RobotDetailsResponse = {
    name: "Stompy",
    owner: "K-Scale Labs",
    links: [
      {
        name: "URDF (with STLs)",
        url: "https://media.kscale.dev/stompy/latest_stl_urdf.tar.gz",
      },
      {
        name: "URDF (with OBJs)",
        url: "https://media.kscale.dev/stompy/latest_obj_urdf.tar.gz",
      },
      {
        name: "MJCF",
        url: "https://media.kscale.dev/stompy/latest_mjcf.tar.gz",
      },
    ],
    images: [
      {
        url: "https://media.robolist.xyz/stompy.png",
        caption: "Stompy the robot 1",
      },
      {
        url: "https://media.robolist.xyz/stompy.png",
        caption: "Stompy the robot 2",
      },
      {
        url: "https://media.robolist.xyz/stompy.png",
        caption: "Stompy the robot 3",
      },
    ],
  };

  const { name, owner, links, images } = response;

  const navigate = useNavigate();

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/robots/")}>
          Listings
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={3} xs={12}>
          <h3>{name}</h3>
          <p>
            {owner}
            <br />
            <small className="text-muted">ID: {id}</small>
          </p>
          {links && (
            <div>
              <h4>Links</h4>
              <ul>
                {links.map((link, key) => (
                  <li key={key}>
                    <a href={link.url}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Col>
        {images && (
          <Col md={9} xs={12}>
            <Carousel
              indicators
              data-bs-theme="dark"
              style={{ marginTop: 20, border: "1px solid #ccc" }}
            >
              {images.map((image, key) => (
                <Carousel.Item key={key}>
                  <div
                    style={{
                      maxHeight: 300,
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
                  <Carousel.Caption>
                    <h3>{image.caption}</h3>
                  </Carousel.Caption>
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        )}
      </Row>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {images[imageIndex].caption} ({imageIndex + 1} of {images.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img
            style={{ width: "100%" }}
            src={images[imageIndex].url}
            alt={images[imageIndex].caption}
          />
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
    </Container>
  );
};

export default RobotDetails;
