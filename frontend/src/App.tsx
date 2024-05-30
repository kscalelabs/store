import "bootstrap/dist/css/bootstrap.min.css";
import Authentication from "components/Authentication";
import Listings from "components/Listings";
import NotFoundRedirect from "components/NotFoundRedirect";
import Home from "pages/Home";
import NotFound from "pages/NotFound";
import RobotDetails from "pages/Robot";
import { Container, Nav, Navbar } from "react-bootstrap";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import "./index.css";
import { DarkModeProvider} from "components/useDarkMode";
import {ThemeProvider} from "hooks/theme";
import DarkModeToggle from "components/DarkModeToggle";

const App = () => {
  return (
    <ThemeProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <Container fluid>
            <Navbar className="bg-body-tertiary fixed-top" expand = "lg">
              <Container fluid>
                <Navbar.Brand as={Link} to="/">
                  robolist
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse className="justify-content-end">
                  <Nav>
                    <Nav.Link as={Link} to="/robots/">
                      Listings
                    </Nav.Link>
                  </Nav>
                  <div className="d-flex align-items-center">
                    <Navbar.Text className="me-3">
                      <DarkModeToggle />
                    </Navbar.Text>
                    <Navbar.Text>
                      <Authentication />
                    </Navbar.Text>
                  </div>
                </Navbar.Collapse>
              </Container>
            </Navbar>

            <Container className="mt-3">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/robots/" element={<Listings />} />
                <Route path="/robots/:id" element={<RobotDetails />} />
 .              <Route path="/404" element={<NotFound />} />
 .              <Route path="*" element={<NotFoundRedirect />} />
              </Routes>
            </Container>
          </Container>
        </BrowserRouter>
      </DarkModeProvider>
    </ThemeProvider>
  );
};

export default App;
