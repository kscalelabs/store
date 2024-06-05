import api from "hooks/api";
import { useEffect, useState } from "react";
import { Breadcrumb, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {Bom, Image, Robot} from "hooks/api";

const Robots = () => {
  const [robotsData, setRobot] = useState<Robot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetch_robots = async () => {
      try {
        const robotsQuery = await api.getRobots();
        setRobot(robotsQuery);
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
      console.log(error)
      navigate("/404"); // Redirect to a 404 page
    }
  }, [error, navigate]);

  if (!robotsData) {
    return <p>Loading</p>;
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Robots</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {robotsData.map((robot) => (
          <Col key={robot.robot_id} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/robot/${robot.robot_id}`)}>
              {robot.images[0] && (
                <Card.Img
                  style={{ aspectRatio: "1/1" }}
                  variant="top"
                  src={robot.images[0].url}
                />
              )}
              <Card.Body>
                <Card.Title>{robot.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {robot.owner}
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
