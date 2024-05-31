import Sidebar from "components/nav/Sidebar";
import { useTheme } from "hooks/theme";
import { useRef, useState } from "react";
import { Container, Nav, Navbar, Overlay, Tooltip } from "react-bootstrap";
import { GearFill, MoonFill, SunFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const TopNavbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  const themeRef = useRef(null);
  const sidebarRef = useRef(null);

  const [showThemeTooltip, setShowThemeTooltip] = useState<boolean>(false);
  const [showSidebarTooltip, setShowSidebarTooltip] = useState<boolean>(false);

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
                ref={themeRef}
                onMouseEnter={() => setShowThemeTooltip(true)}
                onMouseLeave={() => setShowThemeTooltip(false)}
              >
                {theme === "dark" ? <MoonFill /> : <SunFill />}
              </Nav.Link>
              <Overlay
                placement="bottom-end"
                show={showThemeTooltip}
                target={themeRef.current}
              >
                {(props) => (
                  <Tooltip {...props}>
                    Toggle {theme === "dark" ? "light" : "dark"} mode
                  </Tooltip>
                )}
              </Overlay>
              <Nav.Link
                onClick={() => setShowSidebar(true)}
                ref={sidebarRef}
                onMouseEnter={() => setShowSidebarTooltip(true)}
                onMouseLeave={() => setShowSidebarTooltip(false)}
              >
                <GearFill />
              </Nav.Link>
              <Overlay
                placement="bottom-end"
                show={showSidebarTooltip}
                target={sidebarRef.current}
              >
                {(props) => <Tooltip {...props}>Settings</Tooltip>}
              </Overlay>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </>
  );
};

export default TopNavbar;
