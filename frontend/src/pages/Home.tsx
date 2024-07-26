import TCButton from "components/files/TCButton";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { theme } = useTheme();
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
          <Card onClick={() => navigate(`/robots/1`)}>
            <Card.Body>
              <Card.Title>Browse Robots</Card.Title>
              <Card.Text>Buy and sell robots</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} sm={12}>
          <Card onClick={() => navigate(`/parts/1`)}>
            <Card.Body>
              <Card.Title>Browse Listings</Card.Title>
              <Card.Text>Buy and sell robot parts</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {isAuthenticated && (
        <>
          <Row className="row-two">
            <Col md={6} sm={12}>
              <TCButton
                variant={theme === "dark" ? "outline-light" : "outline-dark"}
                size="lg"
                style={{
                  width: "100%",
                }}
                onClick={() => {
                  navigate("/robots/me/1");
                }}
              >
                View My Listings
              </TCButton>
            </Col>

            <Col md={6} sm={12}>
              <TCButton
                variant="primary"
                size="lg"
                style={{
                  width: "100%",
                }}
                onClick={() => {
                  navigate("/parts/add");
                }}
              >
                Make a Listing
              </TCButton>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Home;
