import ImageComponent from "components/files/ViewImage";
import { useAlertQueue } from "hooks/alerts";
import { api, Robot } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";

const MyRobots = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [robotsData, setRobot] = useState<Robot[] | null>([]);
  const [moreRobots, setMoreRobots] = useState<boolean>(false);

  const { addAlert } = useAlertQueue();
  const { page } = useParams();

  const pageNumber = parseInt(page || "", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    return (
      <>
        <h1>Robots</h1>
        <p>Invalid page number in URL.</p>
      </>
    );
  }

  useEffect(() => {
    const fetchMyRobots = async () => {
      try {
        const robotsQuery = await auth_api.getMyRobots(pageNumber);
        setRobot(robotsQuery[0]);
        setMoreRobots(robotsQuery[1]);
      } catch (err) {
        if (err instanceof Error) {
          addAlert(err.message, "error");
        } else {
          addAlert("An unexpected error occurred", "error");
        }
      }
    };
    fetchMyRobots();
  }, [pageNumber]);
  const navigate = useNavigate();

  if (!robotsData) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center mt-5"
      >
        <Row className="w-100">
          <Col className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>My Robots</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {robotsData.map((robot) => (
          <Col key={robot.id} lg={2} md={4} sm={6} xs={12}>
            <Card onClick={() => navigate(`/robot/${robot.id}`)}>
              {robot.images[0] && (
                <div
                  style={{
                    aspectRatio: "1/1",
                    width: "100%",
                    overflow: "hidden",
                    borderTopLeftRadius: ".25rem",
                    borderTopRightRadius: ".25rem",
                  }}
                >
                  <ImageComponent
                    imageId={"mini" + robot.images[0].url + ".png"}
                    size={"large"}
                    caption={robot.images[0].caption}
                  />
                </div>
              )}
              <Card.Body>
                <Card.Title>{robot.name}</Card.Title>
                <Card.Text>
                  <Markdown
                    components={{
                      p: ({ ...props }) => <p {...props} />,
                      li: ({ ...props }) => <li {...props} />,
                      h1: ({ ...props }) => <h3 {...props} className="h6" />,
                      h2: ({ ...props }) => <h4 {...props} className="h6" />,
                      h3: ({ ...props }) => <h5 {...props} className="h6" />,
                      h4: ({ ...props }) => <h6 {...props} className="h6" />,
                      h5: ({ ...props }) => <h6 {...props} className="h6" />,
                      h6: ({ ...props }) => <h6 {...props} className="h6" />,
                    }}
                  >
                    {robot.description}
                  </Markdown>
                </Card.Text>{" "}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {(pageNumber > 1 || moreRobots) && (
        <Row className="mt-3">
          {pageNumber > 1 && (
            <Col>
              <Link to={"/robots/me/" + (pageNumber - 1)}>Previous Page</Link>
            </Col>
          )}
          {moreRobots && (
            <Col className="text-end">
              <Link to={"/robots/me/" + (pageNumber + 1)}>Next Page</Link>
            </Col>
          )}
        </Row>
      )}
    </>
  );
};

export default MyRobots;
