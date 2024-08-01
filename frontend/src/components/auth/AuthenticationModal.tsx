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
      <Modal.Header className="border-0">
        <Modal.Title
          className="text-center w-100"
          style={{ fontSize: "1.5rem" }}
        >
          Log In
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AuthBlockInner />
      </Modal.Body>
    </Modal>
  );
};

export default LogInModal;
