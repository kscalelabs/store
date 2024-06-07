import "bootstrap/dist/css/bootstrap.min.css";
import Footer from "components/nav/Footer";
import TopNavbar from "components/nav/TopNavbar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { AlertQueue, AlertQueueProvider } from "hooks/alerts";
import { AuthenticationProvider, OneTimePasswordWrapper } from "hooks/auth";
import { ThemeProvider } from "hooks/theme";
import About from "pages/About";
import Home from "pages/Home";
import NotFound from "pages/NotFound";
import PartDetails from "pages/PartDetails";
import Parts from "pages/Parts";
import RobotDetails from "pages/RobotDetails";
import RobotForm from "pages/RobotForm";
import Robots from "pages/Robots";
import { Container } from "react-bootstrap";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import PartForm from "pages/PartForm";

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthenticationProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <OneTimePasswordWrapper>
                <TopNavbar />

                <Container className="content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/robots/" element={<Robots />} />
                    <Route path="/robots/add" element={<RobotForm />} />
                    <Route path="/parts/add" element = {<PartForm />} />
                    <Route path="/robot/:id" element={<RobotDetails />} />
                    <Route path="/parts/" element={<Parts />} />
                    <Route path="/part/:id" element={<PartDetails />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFoundRedirect />} />
                  </Routes>
                </Container>

                <Footer />
              </OneTimePasswordWrapper>
            </AlertQueue>
          </AlertQueueProvider>
        </AuthenticationProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
