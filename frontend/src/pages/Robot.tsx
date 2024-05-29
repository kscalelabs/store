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
  bom: { name: string; part_number: string; quantity: number; price: number }[];
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
    bom: [
      {
        name: "Actuator",
        part_number: "1234",
        quantity: 10,
        price: 100,
      },
      {
        name: "Sensor",
        part_number: "5678",
        quantity: 5,
        price: 50,
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

      <Row className="mt-5">
        <Col xl={9} lg={8} md={6} sm={12}>
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
          <Col xl={3} lg={4} md={6} sm={12}>
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

      <Row className="mt-5">
        <Col>
          <h4>Bill of Materials</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Part Number</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {response.bom.map((part, key) => (
                <tr key={key}>
                  <td>{part.name}</td>
                  <td>{part.part_number}</td>
                  <td>{part.quantity}</td>
                  <td>${part.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Col>
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
    </Container>
  );
};

export default RobotDetails;
