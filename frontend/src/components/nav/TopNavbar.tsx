import Sidebar from "components/nav/Sidebar";
import { useTheme } from "hooks/theme";
import { useState } from "react";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { GearFill, MoonFill, SunFill, } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import Boop from "components/nav/Boop";

const TopNavbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Navbar className="bg-body-tertiary justify-content-between" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            robolist
          </Navbar.Brand>
          <div className="d-flex gap-3">
            <Boop timing={100}>
            <Nav.Link
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <MoonFill /> : <SunFill />}
            </Nav.Link>
            </Boop>
            <Boop timing = {100}>
            <Nav.Link onClick={() => setShowSidebar(true)}>
              <GearFill />
            </Nav.Link>
            </Boop>
          </div>
        </Container>
      </Navbar>
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </>
  );
};

export default TopNavbar;
