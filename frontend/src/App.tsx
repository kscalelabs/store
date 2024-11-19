import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "@/App.css";

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
import AdminDashboard from "@/components/pages/AdminDashboard";
import Browse from "@/components/pages/Browse";
import CreateSell from "@/components/pages/CreateSell";
import CreateShare from "@/components/pages/CreateShare";
import DeleteConnect from "@/components/pages/DeleteConnect";
import EmailSignup from "@/components/pages/EmailSignup";
import Eula from "@/components/pages/Eula";
import FileBrowser from "@/components/pages/FileBrowser";
import Home from "@/components/pages/Home";
import KBotPreorderTerms from "@/components/pages/KBotPreorderTerms";
import LinkRobot from "@/components/pages/LinkRobot";
import Listing from "@/components/pages/Listing";
import Login from "@/components/pages/Login";
import Logout from "@/components/pages/Logout";
import NotFound from "@/components/pages/NotFound";
import OrderSuccess from "@/components/pages/OrderSuccess";
import OrdersPage from "@/components/pages/Orders";
import PrivacyPolicy from "@/components/pages/PrivacyPolicy";
import Profile from "@/components/pages/Profile";
import ResearchPage from "@/components/pages/ResearchPage";
import SellerDashboard from "@/components/pages/SellerDashboard";
import SellerOnboarding from "@/components/pages/SellerOnboarding";
import Signup from "@/components/pages/Signup";
import Terminal from "@/components/pages/Terminal";
import TermsOfService from "@/components/pages/TermsOfService";
import { AlertQueue, AlertQueueProvider } from "@/hooks/useAlertQueue";
import { AuthenticationProvider } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

const App = () => {
  return (
    <Router>
      <AuthenticationProvider>
        <FeaturedListingsProvider>
          <AlertQueueProvider>
            <AlertQueue>
              <ScrollToTop>
                <div className="min-h-screen bg-gray-12 text-gray-100 font-mono">
                  <Navbar />
                  <GDPRBanner />
                  <PendoInitializer />
                  <SprigInitializer />
                  <div className="flex-grow">
                    <div className="mt-24 mb-6 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 max-full">
                      <Routes>
                        <Route path={ROUTES.HOME.path} element={<Home />} />

                        {/* General pages */}
                        <Route path={ROUTES.ABOUT.path} element={<About />} />
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
                        <Route
                          path={ROUTES.PREORDER_TERMS.path}
                          element={<KBotPreorderTerms />}
                        />
                        <Route path={ROUTES.EULA.path} element={<Eula />} />

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
                        <Route
                          path={ROUTES.PROFILE.path}
                          element={<Profile />}
                        />

                        {/* Listings */}
                        <Route path={"/create"} element={<CreateSell />} />
                        <Route path={ROUTES.BOTS.path}>
                          <Route
                            path={ROUTES.BOTS.$.BROWSE.relativePath}
                            element={<Browse />}
                          />
                          <Route
                            path={ROUTES.BOTS.$.CREATE.relativePath}
                            element={<CreateShare />}
                          />
                          <Route
                            path={ROUTES.BOTS.$.SELL.relativePath}
                            element={<CreateSell />}
                          />
                        </Route>
                        <Route path={ROUTES.BOT.path} element={<Listing />} />
                        <Route
                          path={ROUTES.FILE.path}
                          element={<FileBrowser />}
                        />

                        {/* Seller */}
                        <Route path={ROUTES.SELL.path}>
                          <Route
                            path={ROUTES.SELL.$.ONBOARDING.relativePath}
                            element={<SellerOnboarding />}
                          />
                          <Route
                            path={ROUTES.SELL.$.DASHBOARD.relativePath}
                            element={<SellerDashboard />}
                          />
                          <Route
                            path={ROUTES.SELL.$.DELETE.relativePath}
                            element={<DeleteConnect />}
                          />
                        </Route>

                        {/* Orders */}
                        <Route path={ROUTES.ORDER.path}>
                          <Route
                            path={ROUTES.ORDER.$.SUCCESS.relativePath}
                            element={<OrderSuccess />}
                          />
                        </Route>
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

                        {/* Link robot */}
                        <Route
                          path={ROUTES.LINK.path}
                          element={<LinkRobot />}
                        />

                        <Route
                          path={ROUTES.ADMIN.path}
                          element={<AdminDashboard />}
                        />

                        {/* Not found */}
                        <Route
                          path={ROUTES.NOT_FOUND.path}
                          element={<NotFound />}
                        />
                        <Route path="*" element={<NotFoundRedirect />} />
                      </Routes>
                    </div>
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
