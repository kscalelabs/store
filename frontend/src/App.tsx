import Navbar from "components/nav/Navbar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { AlertQueue, AlertQueueProvider } from "hooks/alerts";
import { AuthenticationProvider } from "hooks/auth";
import { DarkModeProvider } from "hooks/dark_mode";
import About from "pages/About";
import Home from "pages/Home";
import ListingDetails from "pages/ListingDetails";
import Listings from "pages/Listings";
import Login from "pages/Login";
import Logout from "pages/Logout";
import NewListing from "pages/NewListing";
import NotFound from "pages/NotFound";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";

const App = () => {
  return (
    <Router>
      <DarkModeProvider>
        <AuthenticationProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <div className="dark:bg-gray-900 dark:text-white h-screen">
                <Navbar />

                <div className="container mx-auto pt-24 px-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/listings/add" element={<NewListing />} />
                    <Route path="/listings/:page?" element={<Listings />} />
                    <Route path="/listing/:id" element={<ListingDetails />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFoundRedirect />} />
                  </Routes>
                </div>
              </div>
            </AlertQueue>
          </AlertQueueProvider>
        </AuthenticationProvider>
      </DarkModeProvider>
    </Router>
  );
};

export default App;
