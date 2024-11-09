import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "@/App.css";

import Container from "@/components/Container";
import NotFoundRedirect from "@/components/NotFoundRedirect";
import PendoInitializer from "@/components/PendoInitializer";
import { ScrollToTop } from "@/components/ScrollToTop";
import SprigInitializer from "@/components/SprigInitializer";
import Footer from "@/components/footer/Footer";
import GDPRBanner from "@/components/gdpr/gdprbanner";
import { FeaturedListingsProvider } from "@/components/listing/FeaturedListings";
import Navbar from "@/components/nav/Navbar";
import APIKeys from "@/components/pages/APIKeys";
import About from "@/components/pages/About";
import Account from "@/components/pages/Account";
import Browse from "@/components/pages/Browse";
import Create from "@/components/pages/Create";
import DeleteConnect from "@/components/pages/DeleteConnect";
import DownloadsPage from "@/components/pages/Download";
import EmailSignup from "@/components/pages/EmailSignup";
import FileBrowser from "@/components/pages/FileBrowser";
import Home from "@/components/pages/Home";
import Listing from "@/components/pages/Listing";
import Login from "@/components/pages/Login";
import Logout from "@/components/pages/Logout";
import NotFound from "@/components/pages/NotFound";
import OrderSuccess from "@/components/pages/OrderSuccess";
import OrdersPage from "@/components/pages/Orders";
import Playground from "@/components/pages/Playground";
import PrivacyPolicy from "@/components/pages/PrivacyPolicy";
import Profile from "@/components/pages/Profile";
import ResearchPage from "@/components/pages/ResearchPage";
import SellerDashboard from "@/components/pages/SellerDashboard";
import Signup from "@/components/pages/Signup";
import Terminal from "@/components/pages/Terminal";
import TermsOfService from "@/components/pages/TermsOfService";
import { AlertQueue, AlertQueueProvider } from "@/hooks/useAlertQueue";
import { AuthenticationProvider } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

import SellerOnboarding from "./components/pages/SellerOnboarding";

const App = () => {
  return (
    <Router>
      <AuthenticationProvider>
        <FeaturedListingsProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <ScrollToTop>
                <div className="flex flex-col bg-gray-1 text-gray-12 min-h-screen">
                  <Navbar />
                  <GDPRBanner />
                  <PendoInitializer />
                  <SprigInitializer />
                  <div className="flex-grow">
                    <Container>
                      <Routes>
                        <Route path={ROUTES.HOME.path} element={<Home />} />

                        {/* Playground */}
                        <Route
                          path={ROUTES.PLAYGROUND.path}
                          element={<Playground />}
                        />

                        {/* General pages */}
                        <Route path={ROUTES.ABOUT.path} element={<About />} />
                        <Route
                          path={ROUTES.DOWNLOADS.path}
                          element={<DownloadsPage />}
                        />
                        <Route
                          path={ROUTES.RESEARCH.path}
                          element={<ResearchPage />}
                        />
                        <Route
                          path={ROUTES.TOS.path}
                          element={<TermsOfService />}
                        />
                        <Route
                          path={ROUTES.PRIVACY.path}
                          element={<PrivacyPolicy />}
                        />

                        {/* Account */}
                        <Route
                          path={ROUTES.ACCOUNT.path}
                          element={<Account />}
                        />
                        <Route path={ROUTES.LOGIN.path} element={<Login />} />
                        <Route path={ROUTES.LOGOUT.path} element={<Logout />} />
                        <Route path={ROUTES.SIGNUP.path} element={<Signup />} />
                        <Route
                          path={ROUTES.SIGNUP.EMAIL.path}
                          element={<EmailSignup />}
                        />
                        <Route path={ROUTES.KEYS.path} element={<APIKeys />} />

                        {/* Listings */}
                        <Route path={ROUTES.CREATE.path} element={<Create />} />
                        <Route path={ROUTES.BROWSE.path} element={<Browse />} />
                        <Route
                          path={ROUTES.LISTING.path}
                          element={<Listing />}
                        />
                        <Route
                          path={ROUTES.PROFILE.path}
                          element={<Profile />}
                        />
                        <Route
                          path={ROUTES.FILE.path}
                          element={<FileBrowser />}
                        />

                        {/* Seller */}
                        <Route path={ROUTES.SELL.path}>
                          <Route
                            path={ROUTES.SELL.ONBOARDING.path}
                            element={<SellerOnboarding />}
                          />
                          <Route
                            path={ROUTES.SELL.DASHBOARD.path}
                            element={<SellerDashboard />}
                          />
                          <Route
                            path={ROUTES.SELL.DELETE.path}
                            element={<DeleteConnect />}
                          />
                        </Route>

                        {/* Orders */}
                        <Route
                          path={ROUTES.ORDER.SUCCESS.path}
                          element={<OrderSuccess />}
                        />
                        <Route
                          path={ROUTES.ORDERS.path}
                          element={<OrdersPage />}
                        />

                        {/* Terminal */}
                        <Route
                          path={ROUTES.TERMINAL.path}
                          element={<Terminal />}
                        />
                        <Route
                          path={ROUTES.TERMINAL.WITH_ID.path}
                          element={<Terminal />}
                        />

                        {/* Not found */}
                        <Route
                          path={ROUTES.NOT_FOUND.path}
                          element={<NotFound />}
                        />
                        <Route path="*" element={<NotFoundRedirect />} />
                      </Routes>
                    </Container>
                  </div>
                  <Footer />
                </div>
              </ScrollToTop>
            </AlertQueue>
          </AlertQueueProvider>
        </FeaturedListingsProvider>
      </AuthenticationProvider>
    </Router>
  );
};

export default App;
