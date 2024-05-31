import Sidebar from "components/nav/Sidebar";
import { useTheme } from "hooks/theme";
import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { GearFill, MoonFill, SunFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const TopNavbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Navbar className="bg-body-tertiary" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            robolist
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <MoonFill /> : <SunFill />}
              </Nav.Link>
              <Nav.Link onClick={() => setShowSidebar(true)}>
                <GearFill />
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </>
  );
};

export default TopNavbar;
