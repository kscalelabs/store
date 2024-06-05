import AuthComponent from "components/auth/AuthComponent";
import { Col, Offcanvas, Row } from "react-bootstrap";
import { Link,  useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

interface Props {
  show: boolean;
  onHide: () => void;
}
interface Bom {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Image {
  caption: string;
  url: string;
}

interface Robot {
  robot_id: string;
  name: string;
  description: string;
  owner: string;
  bom: Bom[];
  images: Image[];
}
const Sidebar = ({ show, onHide }: Props) => {
  const navigate = useNavigate();
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
          <AuthComponent />
          <Button
              variant="success"
              size = "lg"
              className = "mt-3"
              style={{ backgroundColor: 'light-green', borderColor: 'black', padding: '10px'}}
              onClick={() => {
                onHide()
                navigate("/add_robot")
              }}
              
            >
              Make a Robot
            </Button>
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
