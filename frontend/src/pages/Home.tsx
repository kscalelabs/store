import { Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const RobotDetails = () => {
  const navigate = useNavigate();

  return (
    <Col className="pt-5">
      <Row className="mb-5">
        <h1 className="display-4">robolist</h1>
        <p className="lead">Buy and sell robots and robot parts</p>
      </Row>
      <Row>
        <Col md={6} sm={12} className="mt-2">
          <Card onClick={() => navigate(`/robots`)}>
            <Card.Body>
              <Card.Title>Robots</Card.Title>
              <Card.Text>Buy and sell robot</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} sm={12} className="mt-2">
          <Card onClick={() => navigate(`/parts`)}>
            <Card.Body>
              <Card.Title>Parts</Card.Title>
              <Card.Text>Buy and sell robot parts</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

export default RobotDetails;
