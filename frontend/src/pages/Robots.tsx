import { Breadcrumb, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface RobotsResponse {
  robots: {
    name: string;
    owner: string;
    description: string;
    id: string;
    photo?: string;
  }[];
}

const Robots = () => {
  const response: RobotsResponse = {
    robots: [
      {
        name: "Stompy",
        owner: "K-Scale Labs",
        description: "An open-source humanoid robot costing less than $10k",
        id: "1",
        photo: "https://media.robolist.xyz/stompy.png",
      },
    ],
  };

  const navigate = useNavigate();

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Robots</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {response.robots.map(({ name, owner, description, id, photo }, key) => (
          <Col key={key} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/robot/${id}`)}>
              {photo && (
                <Card.Img
                  style={{ aspectRatio: "1/1" }}
                  variant="top"
                  src={photo}
                />
              )}
              <Card.Body>
                <Card.Title>{name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {owner}
                </Card.Subtitle>
                <Card.Text>{description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Robots;
