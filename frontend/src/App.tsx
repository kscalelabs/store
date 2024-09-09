import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "App.css";

import { AlertQueue, AlertQueueProvider } from "hooks/useAlertQueue";
import { AuthenticationProvider } from "hooks/useAuth";
import { DarkModeProvider } from "hooks/useDarkMode";

import Container from "components/Container";
import NotFoundRedirect from "components/NotFoundRedirect";
import Footer from "components/footer/Footer";
import Navbar from "components/nav/Navbar";
import APIKeys from "components/pages/APIKeys";
import About from "components/pages/About";
import Browse from "components/pages/Browse";
import BuyStompy from "components/pages/BuyStompy";
import Create from "components/pages/Create";
import Images from "components/pages/Images";
import EmailSignup from "components/pages/EmailSignup";
import FileBrowser from "components/pages/FileBrowser";
import Home from "components/pages/Home";
import ListingDetails from "components/pages/ListingDetails";
import Login from "components/pages/Login";
import Logout from "components/pages/Logout";
import NotFound from "components/pages/NotFound";
import Profile from "components/pages/Profile";
import Signup from "components/pages/Signup";

const App = () => {
  return (
    <Router>
      <DarkModeProvider>
        <AuthenticationProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <div className="dark:bg-black dark:text-white min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <Container>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/buy-stompy" element={<BuyStompy />} />
                      <Route path="/keys" element={<APIKeys />} />
                      <Route path="/profile/:id?" element={<Profile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="/signup/" element={<Signup />} />
                      <Route path="/signup/:id" element={<EmailSignup />} />
                      <Route path="/create" element={<Create />} />
                      <Route path="/images" element={<Images />} />
                      <Route path="/browse/:page?" element={<Browse />} />
                      <Route path="/item/:id" element={<ListingDetails />} />
                      <Route path="/404" element={<NotFound />} />
                      <Route path="*" element={<NotFoundRedirect />} />
                      <Route
                        path="/file/:artifactId"
                        element={<FileBrowser />}
                      />
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
