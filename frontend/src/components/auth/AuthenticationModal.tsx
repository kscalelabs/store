import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LogInModal = () => {
  const navigate = useNavigate();

  const navigateToPreviousPage = () => {
    navigate(-1);
  };

  return (
    <Modal show={true} onHide={navigateToPreviousPage} centered>
      <Modal.Body>
        <p>Sign in to see this page</p>
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
