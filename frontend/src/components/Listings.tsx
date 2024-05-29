import { Breadcrumb, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface ListingsResponseItem {
  name: string;
  owner: string;
  description: string;
  id: string;
  photo?: string;
}

interface ListingsResponse {
  listings: ListingsResponseItem[];
}

const Listings = () => {
  const response: ListingsResponse = {
    listings: [
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
        <Breadcrumb.Item active>Listings</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {response.listings.map(
          ({ name, owner, description, id, photo }, key) => (
            <Col key={key} md={3} xs={6}>
              <Card onClick={() => navigate(`/robots/${id}`)}>
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
          ),
        )}
      </Row>
    </Container>
  );
};

export default Listings;
