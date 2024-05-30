import Authentication from "components/Authentication";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import DarkModeToggle from "components/DarkModeToggle";

const TopNavbar = () => {
  return (
    <Navbar className="bg-body-tertiary fixed-top" expand="lg">
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
          <Navbar.Text className="me-3">
                      <DarkModeToggle />
                    </Navbar.Text>
          <Navbar.Text>
            <Authentication />
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
