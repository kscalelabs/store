import Boop from "components/nav/Boop";
import Sidebar from "components/nav/Sidebar";
import { api } from "hooks/api";
import { setLocalStorageAuth, useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { GearFill, MoonFill, SunFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const TopNavbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  useEffect(() => {
    (async () => {
      try {
        // Get the code from the query string to carry out OAuth login.
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const code = params.get("code");
        if (auth.isAuthenticated) {
          const { email } = await auth_api.me();
          auth.setEmail(email);
        } else if (code) {
          const res = await auth_api.loginGithub(code as string);
          setLocalStorageAuth(res.api_key_id);
          auth.setIsAuthenticated(true);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

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
            {auth.isAuthenticated ? (
              <>
                <Boop timing={100}>
                  <Nav.Link onClick={() => setShowSidebar(true)}>
                    <GearFill />
                  </Nav.Link>
                </Boop>
                <Nav.Link as={Link} to="/logout">
                  Log Out
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              </>
            )}
          </div>
        </Container>
      </Navbar>
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </>
  );
};

export default TopNavbar;
