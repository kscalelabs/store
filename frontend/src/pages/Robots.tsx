import ImageComponent from "components/files/ViewImage";
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
import { useNavigate } from "react-router-dom";
import { isFulfilled } from "utils/isfullfiled";

const Robots = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [robotsData, setRobot] = useState<Robot[] | null>(null);
  const [idMap, setIdMap] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetch_robots = async () => {
      try {
        const robotsQuery = await auth_api.getRobots();
        setRobot(robotsQuery);
        const ids = new Set<string>();
        robotsQuery.forEach((robot) => {
          ids.add(robot.owner);
        });
        const idMap = await Promise.allSettled(
          Array.from(ids).map(async (id) => {
            return [id, await auth_api.getUserById(id)];
          }),
        );
        setIdMap(
          new Map(
            idMap
              .filter(isFulfilled)
              .map((result) => result.value as [string, string]),
          ),
        );
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };
    fetch_robots();
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      console.log(error);
      navigate("/404"); // Redirect to a 404 page
    }
  }, [error, navigate]);

  if (!robotsData) {
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

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Robots</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {robotsData.map((robot) => (
          <Col key={robot.robot_id} lg={2} md={4} sm={6} xs={12}>
            <Card onClick={() => navigate(`/robot/${robot.robot_id}`)}>
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
                  <ImageComponent imageId={"mini" + robot.images[0].url} />
                </div>
              )}
              {/* {robot.images[0] && (
                <Card.Img
                  style={{ aspectRatio: "1/1" }}
                  variant="top"
                  src={robot.images[0].url}
                />
              )} */}
              <Card.Body>
                <Card.Title>{robot.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {idMap.get(robot.owner)}
                </Card.Subtitle>
                <Card.Text>{robot.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Robots;
