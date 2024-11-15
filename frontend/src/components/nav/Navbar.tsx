import { useState } from "react";
import { FaBars } from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useFeaturedListings } from "@/components/listing/FeaturedListings";
import Sidebar from "@/components/nav/Sidebar";
import { getNavItems } from "@/components/nav/navigation";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

import { NavButton } from "./NavButton";

const Navbar = () => {
  const { isAuthenticated, currentUser } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { featuredListings } = useFeaturedListings();

  const isAdmin = currentUser?.permissions?.includes("is_admin") ?? false;
  const navItems = getNavItems(isAuthenticated, isAdmin);

  const handleFeaturedClick = (username: string, slug: string | null) => {
    const path = ROUTES.BOT.buildPath({
      username,
      slug: slug || "",
    });
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  };

  return (
    <>
      <nav className="fixed w-full z-50 top-0 start-0 bg-background border-b border-gray-1/10">
        <div className="relative flex items-center justify-between py-3 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 font-mono">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <Link
              to={ROUTES.HOME.path}
              className="flex items-center lg:flex-grow-0 bg-black border border-gray-1 p-2"
            >
              <span className="text-gray-1 text-lg">K-Scale Labs</span>
            </Link>
            <Button
              onClick={() => setShowSidebar(true)}
              variant="ghost"
              className="lg:hidden text-gray-1 p-2 text-sm flex items-center"
            >
              <FaBars size={20} />
            </Button>
          </div>
          <div className="hidden lg:flex items-center flex-grow justify-between ml-4">
            <div className="flex space-x-4 p-2 flex-grow items-center">
              <div className="flex-grow flex space-x-4 items-center">
                {featuredListings?.map((listing) => (
                  <Button
                    key={listing.id}
                    onClick={() =>
                      handleFeaturedClick(listing.username, listing.slug)
                    }
                    variant={
                      location.pathname ===
                      ROUTES.BOT.buildPath({
                        username: listing.username,
                        slug: listing.slug || "",
                      })
                        ? "ghost"
                        : "outline"
                    }
                    className={`px-2 xl:px-3 py-2 text-sm tracking-widest text-gray-1 ${
                      location.pathname ===
                      ROUTES.BOT.buildPath({
                        username: listing.username,
                        slug: listing.slug || "",
                      })
                        ? "underline underline-offset-4 decoration-2"
                        : ""
                    }`}
                  >
                    {listing.name}
                  </Button>
                ))}
              </div>
              {navItems.map((item) =>
                item.isExternal ? (
                  <NavButton
                    key={item.path}
                    to={item.path}
                    currentPath={location.pathname}
                    isExternal
                  >
                    {item.name}
                  </NavButton>
                ) : (
                  <NavButton
                    key={item.path}
                    to={item.path}
                    currentPath={location.pathname}
                  >
                    {item.name}
                  </NavButton>
                ),
              )}
            </div>
            <div className="flex items-center space-x-4 text-gray-1 p-2 ml-4 text-sm tracking-widest">
              {isAuthenticated ? (
                <>
                  <NavButton
                    to={ROUTES.ACCOUNT.path}
                    currentPath={location.pathname}
                  >
                    Account
                  </NavButton>
                  <NavButton
                    to={ROUTES.LOGOUT.path}
                    currentPath={location.pathname}
                  >
                    Logout
                  </NavButton>
                </>
              ) : (
                <>
                  <NavButton
                    to={ROUTES.LOGIN.path}
                    currentPath={location.pathname}
                  >
                    Log In
                  </NavButton>
                  <NavButton
                    to={ROUTES.SIGNUP.path}
                    currentPath={location.pathname}
                  >
                    Sign Up
                  </NavButton>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
