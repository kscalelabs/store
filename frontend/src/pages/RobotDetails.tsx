import { InputerURDFComponent } from "components/files/InputerURDFLoader";
import TCButton from "components/files/TCButton";
import ImageComponent from "components/files/ViewImage";
import { useAlertQueue } from "hooks/alerts";
import { api, Bom, Package } from "hooks/api";
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
import { isFulfilled } from "utils/isfullfiled";

interface RobotDetailsResponse {
  name: string;
  owner: string;
  description: string;
  images: { url: string; caption: string }[];
  urdf: string;
  packages: Package[];
  bom: Bom[];
  height: string;
  weight: string;
  degrees_of_freedom: string;
}

interface ExtendedBom {
  part_id: string;
  quantity: number;
  name: string;
}

const RobotDetails = () => {
  const { addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [userId, setUserId] = useState<string | null>(null);
  const { id } = useParams();
  const [show, setShow] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [robot, setRobot] = useState<RobotDetailsResponse | null>(null);
  const [parts, setParts] = useState<ExtendedBom[]>([]);
  const [package_urls, setPackages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isValidURDF, setIsValidURDF] = useState<boolean>(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleShowDelete = () => setShowDelete(true);
  const handleCloseDelete = () => setShowDelete(false);

  useEffect(() => {
    const fetchRobot = async () => {
      try {
        const robotData = await auth_api.getRobotById(id);
        setRobot(robotData);
        const ownerUsername = await auth_api.getUserById(robotData.owner);
        setOwnerUsername(ownerUsername);
        const curPackages = [];
        for (let i = 0; i < robotData.packages.length; i++) {
          const package_id = robotData.packages[i].name;
          const package_url = robotData.packages[i].url;
          curPackages.push(package_id);
          curPackages.push(package_url);
        }
        setPackages(curPackages);
        const parts = robotData.bom.map(async (part) => {
          return {
            name: (await auth_api.getPartById(part.part_id)).name,
            part_id: part.part_id,
            quantity: part.quantity,
          };
        });
        setParts(
          (await Promise.allSettled(parts))
            .filter(isFulfilled)
            .map((result) => result.value as ExtendedBom),
        );
        if (robotData.urdf) {
          try {
            const response = await fetch(robotData.urdf, {
              method: "HEAD",
              headers: {
                Accept: "application/vnd.github.v3.raw",
              },
            });
            if (response.ok) {
              setIsValidURDF(true);
            } else {
              throw new Error("Invalid URDF URL");
            }
          } catch (err) {
            setIsValidURDF(false);
            console.error("URDF validation error: ", err);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };
    fetchRobot();
  }, [id]);
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

  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      addAlert(error, "error");
    }
  }, [error]);

  if (!robot) {
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
  const response: RobotDetailsResponse = {
    name: robot?.name,
    owner: robot?.owner,
    description: robot?.description,
    images: robot?.images,
    bom: robot?.bom,
    height: robot?.height,
    weight: robot?.weight,
    urdf: robot?.urdf,
    packages: robot?.packages,
    degrees_of_freedom: robot?.degrees_of_freedom,
  };

  const { name, description, images } = response;

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/robots/1")}>
          Robots
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{name} </Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-3">
        <Col lg={6} md={12} className="mb-5">
          <Row>
            <Col>
              <h1>{name}</h1>
              <small className="text-muted">ID: {id}</small>
              <br />
              <em>{ownerUsername}</em>
            </Col>
          </Row>
          {((response.height && response.height !== "") ||
            (response.weight && response.weight !== "") ||
            (response.degrees_of_freedom &&
              response.degrees_of_freedom !== "")) && (
            <>
              <hr />
              {response.height !== "" && (
                <p className="text-muted">
                  <strong>Height:</strong> {response.height}
                </p>
              )}
              {response.weight !== "" && (
                <p className="text-muted">
                  <strong>Weight: </strong>
                  {response.weight}
                </p>
              )}
              {response.degrees_of_freedom !== "" && (
                <p className="text-muted">
                  <strong>Total Degrees of Freedom:</strong>{" "}
                  {response.degrees_of_freedom}
                </p>
              )}
            </>
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

          <Row className="mt-3">
            <h4>Bill of Materials</h4>
            <Col>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part, key) => (
                    <tr key={key}>
                      <td>
                        <Link to={`/part/${part.part_id}`}>{part.name}</Link>
                      </td>
                      <td>{part.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Col>
          </Row>
          {robot.owner === userId && (
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
                      navigate(`/edit-robot/${id}/`);
                    }}
                  >
                    Edit Robot
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
                    Delete Robot
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
                    Are you sure you want to delete this robot?
                  </Modal.Title>
                </Modal.Header>
                <Modal.Footer className="d-flex justify-content-start">
                  <TCButton
                    variant="danger"
                    onClick={async () => {
                      await auth_api.deleteRobot(id);
                      navigate(`/robots/your/1`);
                    }}
                  >
                    Delete Robot
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
          {isValidURDF && (
            <Row
              style={{ backgroundColor: "#272727", height: "50vh" }}
              className="mb-4"
            >
              {(() => {
                try {
                  return (
                    <InputerURDFComponent
                      url={response.urdf}
                      packages={package_urls}
                    />
                  );
                } catch (err) {
                  setError("Failed to load URDF component");
                  console.error("URDF component error: ", err);
                }
              })()}

              {/* <InputerURDFComponent urls={response.urdf} /> */}
            </Row>
          )}
          {images && (
            <Row>
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
                        width: "100%", // Adjust this to set the desired width
                        paddingTop: "0%", // This maintains the aspect ratio of the container as a square
                        position: "relative" as const,
                      }}
                      onClick={() => {
                        handleShow();
                      }}
                    >
                      <ImageComponent imageId={images[key].url} />
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
            </Row>
          )}
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              width: "100%", // Adjust this to set the desired width
              paddingTop: "0%", // This maintains the aspect ratio of the container as a square
              position: "relative",
            }}
          >
            <ImageComponent imageId={images[imageIndex].url} />
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

export default RobotDetails;
