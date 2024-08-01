import { Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-column pt-5 gap-4" style={{ display: "flex" }}>
      <Row className="mb-4">
        <h1 className="display-4">robolist</h1>
        <p className="lead">Buy and sell robots and robot parts</p>
      </Row>
      <Row className="row-two">
        <Col sm={12} md={6}>
          <Card
            onClick={() => navigate(`/listings`)}
            className="text-center"
            bg="secondary"
          >
            <Card.Body>
              <Card.Title>Browse Listings</Card.Title>
              <Card.Text>Browse existing Robolist listings</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6}>
          <Card
            onClick={() => navigate(`/listings/add`)}
            className="text-center"
            bg="primary"
          >
            <Card.Body>
              <Card.Title>Create Listing</Card.Title>
              <Card.Text>List your robot on Robolist</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
