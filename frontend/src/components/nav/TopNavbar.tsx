import Sidebar from "components/nav/Sidebar";
import { useTheme } from "hooks/theme";
import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { GearFill, MoonFill, SunFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "./TopNavbar.css"; // Ensure to import the CSS file

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
            <Nav.Link
              className="theme-icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <MoonFill className="dark-mode-icon" /> : <SunFill className="light-mode-icon" />}
            </Nav.Link>
            <Nav.Link className="theme-icon" onClick={() => setShowSidebar(true)}>
              <GearFill />
            </Nav.Link>
          </div>
        </Container>
      </Navbar>
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </>
  );
};

export default TopNavbar;
