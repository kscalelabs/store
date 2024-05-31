import { Col, Modal, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AuthComponent from "./AuthComponent";

const LogInModal = () => {
  const navigate = useNavigate();

  const navigateToPreviousPage = () => {
    navigate(-1);
  };

  return (
    <Modal show={true} onHide={navigateToPreviousPage} centered>
      <Modal.Body>
        <Row>
          <Col>
            <Row className="mb-3 text-center">
              <Col>
                <h5>Sign in to see this page</h5>
              </Col>
            </Row>

            <AuthComponent />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <small>
          <i>Issues logging in? Send an email to </i>
          <code>support@robolist.xyz</code>
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default LogInModal;
