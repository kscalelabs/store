import "App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import TopNavbar from "components/nav/NavBar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { DarkModeProvider } from "components/useDarkMode";
import { ThemeProvider } from "hooks/theme";
import "index.css";
import ComponentDetails from "pages/ComponentDetails";
import Components from "pages/Components";
import Home from "pages/Home";
import NotFound from "pages/NotFound";
import RobotDetails from "pages/RobotDetails";
import Robots from "pages/Robots";
import { Container } from "react-bootstrap";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    <ThemeProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <Container>
            <TopNavbar />

            <Container className="mt-3">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/robots/" element={<Robots />} />
                <Route path="/robot/:id" element={<RobotDetails />} />
                <Route path="/components/" element={<Components />} />
                <Route path="/component/:id" element={<ComponentDetails />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFoundRedirect />} />
              </Routes>
            </Container>
          </Container>
        </BrowserRouter>
      </DarkModeProvider>
    </ThemeProvider>
  );
};

export default App;
