import { Breadcrumb, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface ComponentsResponse {
  robots: {
    name: string;
    owner: string;
    description: string;
    id: string;
    photo?: string;
  }[];
}

const Components = () => {
  const response: ComponentsResponse = {
    robots: [
      {
        name: "RMD X8",
        owner: "MyActuator",
        description: "6:1 reduction ratio motor",
        id: "1",
        photo: "https://media.robolist.xyz/rmd_x8.png",
      },
    ],
  };

  const navigate = useNavigate();

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Components</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {response.robots.map(({ name, owner, description, id, photo }, key) => (
          <Col key={key} md={3} xs={6}>
            <Card onClick={() => navigate(`/component/${id}`)}>
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

export default Components;
