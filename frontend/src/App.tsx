import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "App.css";

import { AlertQueue, AlertQueueProvider } from "hooks/useAlertQueue";
import { AuthenticationProvider } from "hooks/useAuth";
import { DarkModeProvider } from "hooks/useDarkMode";
import APIKeys from "pages/APIKeys";
import About from "pages/About";
import Browse from "pages/Browse";
import Create from "pages/Create";
import Home from "pages/Home";
import ListingDetails from "pages/ListingDetails";
import Login from "pages/Login";
import Logout from "pages/Logout";
import NotFound from "pages/NotFound";
import Profile from "pages/Profile";
import Signup from "pages/Signup";

import Container from "components/Container";
import NotFoundRedirect from "components/NotFoundRedirect";
import Footer from "components/footer/Footer";
import Navbar from "components/nav/Navbar";

const App = () => {
  return (
    <Router>
      <DarkModeProvider>
        <AuthenticationProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <div className="dark:bg-gray-900 dark:text-white min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <Container>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/keys" element={<APIKeys />} />
                      <Route path="/profile/:id?" element={<Profile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="/signup/:id" element={<Signup />} />
                      <Route path="/create" element={<Create />} />
                      <Route path="/browse/:page?" element={<Browse />} />
                      <Route path="/item/:id" element={<ListingDetails />} />
                      <Route path="/404" element={<NotFound />} />
                      <Route path="*" element={<NotFoundRedirect />} />
                    </Routes>
                  </Container>
                </div>
                <Footer />
              </div>
            </AlertQueue>
          </AlertQueueProvider>
        </AuthenticationProvider>
      </DarkModeProvider>
    </Router>
  );
};

export default App;
