import { Col, Row } from "react-bootstrap";
import EmailAuthComponent from "./EmailAuthComponent";
import GoogleAuthComponent from "./GoogleAuthComponent";

const AuthComponent = () => {
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
