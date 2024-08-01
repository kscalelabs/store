import Boop from "components/nav/Boop";
import Sidebar from "components/nav/Sidebar";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import { useState, useEffect } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { GearFill, MoonFill, SunFill } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import { SearchInput } from "components/ui/Search/SearchInput";
import { useAlertQueue } from "hooks/alerts";
import { useSearch } from "hooks/Search";
import { api, Listing } from "hooks/api";

const TopNavbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [visibleSearchBarInput, setVisibleSearchBarInput] = useState<string>("");
  const { theme, setTheme } = useTheme();
  const auth = useAuthentication();
  const { setSearchQuery } = useSearch();

  return (
    <>
      <Navbar className="bg-body-tertiary justify-content-between" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            robolist
          </Navbar.Brand>
          <SearchInput
            userInput={visibleSearchBarInput}
            onChange={(e) => setVisibleSearchBarInput(e.target.value)}
            onSearch={() => {
              console.log("hello");
              setSearchQuery(visibleSearchBarInput)
            }}
          />
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
