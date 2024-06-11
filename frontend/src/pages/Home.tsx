import { useAuthentication } from "hooks/auth";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTheme } from "hooks/theme";


const Home = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthentication();

  return (
    <div className="flex-column pt-5 gap-4" style={{ display: "flex" }}>
      <Row className="mb-4">
        <h1 className="display-4">robolist</h1>
        <p className="lead">Buy and sell robots and robot parts</p>
      </Row>
      <Row className="row-two">
        <Col md={6} sm={12}>
          <Card onClick={() => navigate(`/robots`)}>
            <Card.Body>
              <Card.Title>Robots</Card.Title>
              <Card.Text>Buy and sell robots</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} sm={12}>
          <Card onClick={() => navigate(`/parts`)}>
            <Card.Body>
              <Card.Title>Parts</Card.Title>
              <Card.Text>Buy and sell robot parts</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {isAuthenticated && (
        <Row className="row-two">
          <Col md={6} sm={12}>
            <Button
              variant="outline-dark"
              size="lg"
              style={{
                backgroundColor: "light-purple",
                borderColor: "secondary",
                padding: "10px",
                width: "100%",
              }}
              onClick={() => {
                navigate("/robots/your/");
              }}
            >
              View Your Robots
            </Button>
          </Col>
          <Col md={6} sm={12}>
            <Button
              variant="secondary"
              size="lg"
              style={{
                backgroundColor: "dark-purple",
                borderColor: "secondary",
                padding: "10px",
                width: "100%",
              }}
              onClick={() => {
                navigate("/parts/your/");
              }}
            >
              View Your Parts
            </Button>
          </Col>
        </Row>
      )}
      {isAuthenticated && (
        <Row className="row-two">
          <Col md={6} sm={12}>
            <Button
              variant="primary"
              size="lg"
              style={{
                backgroundColor: "light-green",
                borderColor: "secondary",
                padding: "10px",
                width: "100%",
              }}
              onClick={() => {
                navigate("/robots/add");
              }}
            >
              Make a Robot
            </Button>
          </Col>
          <Col md={6} sm={12}>
            <Button
              variant= {theme==="dark"?"outline-light":"outline-dark"}
              size="lg"
              style={{
                backgroundColor: "light-green",
                borderColor: "secondary",
                padding: "10px",
                width: "100%",
              }}
              onClick={() => {
                navigate("/parts/add");
              }}
            >
              Make a Part
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Home;
