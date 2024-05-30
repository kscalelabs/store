import Authentication from "components/Authentication";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";

const TopNavbar = () => {
  return (
    <Navbar className="bg-body-tertiary">
      <Container>
        <Navbar.Brand as={Link} to="/">
          robolist
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Nav.Link as={Link} to="/robots/">
              Robots
            </Nav.Link>
            <Nav.Link as={Link} to="/components/">
              Components
            </Nav.Link>
          </Nav>
          <Navbar.Text>
            <Authentication />
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
