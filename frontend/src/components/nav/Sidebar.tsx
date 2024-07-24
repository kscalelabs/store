import { Col, Offcanvas, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

interface Props {
  show: boolean;
  onHide: () => void;
}

const Sidebar = ({ show, onHide }: Props) => {
  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Settings</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Col
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Row style={{ marginTop: "auto" }} />
          <Row>
            <Link to="/about">About</Link>
          </Row>
          <Row>
            <a href="#">Privacy Policy</a>
          </Row>
          <Row>
            <a href="#">Terms of Service</a>
          </Row>
        </Col>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;
