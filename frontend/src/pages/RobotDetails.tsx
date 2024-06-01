import { useState } from "react";
import {
  Breadcrumb,
  Button,
  ButtonGroup,
  Carousel,
  Col,
  Modal,
  Row,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";

interface RobotDetailsResponse {
  name: string;
  owner: string;
  description: string;
  images: { url: string; caption: string }[];
  bom: { name: string; id: string; quantity: number; price: number }[];
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
    description: `Stompy is an open-source humanoid robot that anyone can 3D print.

## Purpose

Stompy is designed to be a versatile platform for research and development in legged robotics.

## Links

- [Wiki Entry](https://humanoids.wiki/w/Stompy)

### Full Body Sim Artifacts

- [URDF (with STLs)](https://media.kscale.dev/stompy/latest_stl_urdf.tar.gz)
- [URDF (with OBJs)](https://media.kscale.dev/stompy/latest_obj_urdf.tar.gz)
- [MJCF](https://media.kscale.dev/stompy/latest_mjcf.tar.gz)

### Single Arm Sim Artifacts

- [URDF (with STLs)](https://media.kscale.dev/stompy/arm_latest_stl_urdf.tar.gz)
- [URDF (with OBJs)](https://media.kscale.dev/stompy/arm_latest_obj_urdf.tar.gz)
- [MJCF](https://media.kscale.dev/stompy/arm_latest_mjcf.tar.gz)
`,
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
        id: "1234",
        quantity: 10,
        price: 100,
      },
      {
        name: "Sensor",
        id: "5678",
        quantity: 5,
        price: 50,
      },
    ],
  };

  const { name, owner, description, images } = response;

  const navigate = useNavigate();

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/robots/")}>
          Robots
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
              <i>{owner}</i>
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

          <Row className="mt-3">
            <h4>Bill of Materials</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {response.bom.map((part, key) => (
                  <tr key={key}>
                    <td>
                      <Link to={`/part/${part.id}`}>{part.name}</Link>
                    </td>
                    <td>{part.quantity}</td>
                    <td>${part.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </>
  );
};

export default RobotDetails;
