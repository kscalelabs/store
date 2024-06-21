import "bootstrap/dist/css/bootstrap.min.css";
import Footer from "components/nav/Footer";
import TopNavbar from "components/nav/TopNavbar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { AlertQueue, AlertQueueProvider } from "hooks/alerts";
import { AuthenticationProvider } from "hooks/auth";
import { ThemeProvider } from "hooks/theme";
import About from "pages/About";
import ChangeEmail from "pages/ChangeEmail";
import EditPartForm from "pages/EditPartForm";
import EditRobotForm from "pages/EditRobotForm";
import Forgot from "pages/Forgot";
import Home from "pages/Home";
import Login from "pages/Login";
import Logout from "pages/Logout";
import NewPart from "pages/NewPart";
import NewRobot from "pages/NewRobot";
import NotFound from "pages/NotFound";
import PartDetails from "pages/PartDetails";
import Parts from "pages/Parts";
import Register from "pages/Register";
import RegistrationEmail from "pages/RegistrationEmail";
import ResetPassword from "pages/ResetPassword";
import RobotDetails from "pages/RobotDetails";
import Robots from "pages/Robots";
import TestImages from "pages/TestImages";
import YourParts from "pages/YourParts";
import YourRobots from "pages/YourRobots";
import { Container } from "react-bootstrap";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthenticationProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <TopNavbar />

              <Container className="content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<RegistrationEmail />} />
                  <Route path="/register/:token" element={<Register />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/forgot" element={<Forgot />} />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />
                  <Route
                    path="/change-email/:token"
                    element={<ChangeEmail />}
                  />
                  <Route path="/robots/:page" element={<Robots />} />
                  <Route path="/robots/add" element={<NewRobot />} />
                  <Route path="/parts/add" element={<NewPart />} />
                  <Route path="/robot/:id" element={<RobotDetails />} />
                  <Route path="/edit-robot/:id" element={<EditRobotForm />} />
                  <Route path="/test-images" element={<TestImages />} />
                  <Route path="/parts/" element={<Parts />} />
                  <Route path="/part/:id" element={<PartDetails />} />
                  <Route path="/edit-part/:id" element={<EditPartForm />} />
                  <Route path="robots/your/:page" element={<YourRobots />} />
                  <Route path="/parts/your" element={<YourParts />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFoundRedirect />} />
                </Routes>
              </Container>

              <Footer />
            </AlertQueue>
          </AlertQueueProvider>
        </AuthenticationProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
