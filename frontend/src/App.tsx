import "bootstrap/dist/css/bootstrap.min.css";
import Footer from "components/nav/Footer";
import TopNavbar from "components/nav/TopNavbar";
import NotFoundRedirect from "components/NotFoundRedirect";
import { AlertQueue, AlertQueueProvider } from "hooks/alerts";
import { AuthenticationProvider } from "hooks/auth";
import { ThemeProvider } from "hooks/theme";
import About from "pages/About";
import EditListingForm from "pages/EditListingForm";
import Home from "pages/Home";
import ListingDetails from "pages/ListingDetails";
import Listings from "pages/Listings";
import Login from "pages/Login";
import Logout from "pages/Logout";
import MyListings from "pages/MyListings";
import NewListing from "pages/NewListing";
import NotFound from "pages/NotFound";
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
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/listings/add" element={<NewListing />} />
                  <Route path="/listings/:page" element={<Listings />} />
                  <Route path="/listings/:id" element={<ListingDetails />} />
                  <Route path="/listings/edit/:id" element={<EditListingForm />} />
                  <Route path="/listings/me/:page" element={<MyListings />} />
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
