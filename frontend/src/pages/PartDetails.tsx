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

interface PartDetailsResponse {
  name: string;
  owner: string;
  description: string;
  images: { url: string; caption: string }[];
  purchase_links: { name: string; url: string; price: number }[];
  used_by: { name: string; id: string; stars: number }[];
}

const PartDetails = () => {
  const { id } = useParams();
  const [show, setShow] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // This is a placeholder before the backend is hooked up.
  const response: PartDetailsResponse = {
    name: "RMD X8",
    owner: "MyActuator",
    description: `The RMD X8 is a quasi-direct drive motor from MyActuator.`,
    images: [
      {
        url: "https://media.robolist.xyz/rmd_x8.png",
        caption: "Actuator 1",
      },
      {
        url: "https://media.robolist.xyz/rmd_x8.png",
        caption: "Actuator 2",
      },
      {
        url: "https://media.robolist.xyz/rmd_x8.png",
        caption: "Actuator 3",
      },
    ],
    purchase_links: [
      {
        name: "RobotShop",
        url: "https://www.robotshop.com/products/myactuator-rmd-x8-v3-can-bus-16-helical-mc-x-500-o-brushless-servo-driver",
        price: 389,
      },
    ],
    used_by: [
      {
        name: "Stompy",
        id: "1234",
        stars: 5,
      },
    ],
  };

  const { name, owner, description, images } = response;

  const navigate = useNavigate();

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/parts/")}>
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
            <h4>Purchase</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {response.purchase_links.map((part, key) => (
                  <tr key={key}>
                    <td>
                      <a href={part.url}>{part.name}</a>
                    </td>
                    <td>${part.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Row>

          <Row className="mt-3">
            <h4>Robots</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stars</th>
                </tr>
              </thead>
              <tbody>
                {response.used_by.map((part, key) => (
                  <tr key={key}>
                    <td>
                      <Link to={`/robot/${part.id}`}>{part.name}</Link>
                    </td>
                    <td>{part.stars}</td>
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

export default PartDetails;
