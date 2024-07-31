import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthBlockInner } from "./AuthBlock";

const LogInModal = () => {
  const navigate = useNavigate();

  const navigateToPreviousPage = () => {
    navigate(-1);
  };

  return (
    <Modal show={true} onHide={navigateToPreviousPage} centered>
      <Modal.Header closeButton>
        <Modal.Title>Sign in to see this page</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AuthBlockInner />
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
