import { useAuthentication } from "hooks/auth";
import { Button, Col, Row } from "react-bootstrap";
import EmailAuthComponent from "./EmailAuthComponent";
import GoogleAuthComponent from "./GoogleAuthComponent";


const AuthComponent = () => {
  const { isAuthenticated, api } = useAuthentication();

  if (isAuthenticated) {
    return (
      <Row>
        <Col xs="auto">
          <Button onClick={() => {
            api.delete<boolean>("/users/logout");
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              Sign Out
            </span>
          </Button>
        </Col>
      </Row>
    );
  }
  return (
    <>
      <Row>
        <Col>
          <EmailAuthComponent />
        </Col>
      </Row>
      <Row className="d-flex justify-content-center">
        <Col xs="auto">
          <GoogleAuthComponent />
        </Col>
      </Row>
    </>
  );
};

export default AuthComponent;
