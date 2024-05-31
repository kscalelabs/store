import "bootstrap/dist/css/bootstrap.min.css";
import TopNavbar from "components/nav/TopNavbar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { ThemeProvider } from "hooks/theme";
import Home from "pages/Home";
import NotFound from "pages/NotFound";
import PartDetails from "pages/PartDetails";
import Parts from "pages/Parts";
import RobotDetails from "pages/RobotDetails";
import Robots from "pages/Robots";
import { Container } from "react-bootstrap";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Container>
          <TopNavbar />

          <Container className="mt-3">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/robots/" element={<Robots />} />
              <Route path="/robot/:id" element={<RobotDetails />} />
              <Route path="/parts/" element={<Parts />} />
              <Route path="/part/:id" element={<PartDetails />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
          </Container>

          <footer className="fixed-bottom">
            {/* Solid background */}
            <div className="text-center bg-body-tertiary p-2">
              <a href="mailto:support@robolist.xyz">support@robolist.xyz</a>
            </div>
          </footer>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
