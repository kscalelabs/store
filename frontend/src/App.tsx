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

const App = () => {
  return (
    <BrowserRouter>
      <Container>
        <Navbar className="bg-body-tertiary">
          <Container>
            <Navbar.Brand as={Link} to="/">
              robolist
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav>
                <Nav.Link as={Link} to="/robots/">
                  Listings
                </Nav.Link>
              </Nav>
              <Navbar.Text>
                <Authentication />
              </Navbar.Text>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-3">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/robots/" element={<Listings />} />
            <Route path="/robots/:id" element={<RobotDetails />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </Container>
      </Container>
    </BrowserRouter>
  );
};

export default App;
