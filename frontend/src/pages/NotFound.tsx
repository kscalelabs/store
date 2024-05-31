import { Col, Row } from "react-bootstrap";

const NotFound = () => {
  return (
    <div className="pt-5 rounded-lg">
      <Row>
        <Col>
          <h1 className="display-4">404 Not Found</h1>
          <p className="lead">The page you are looking for does not exist</p>
        </Col>
      </Row>
    </div>
  );
};
export default NotFound;
