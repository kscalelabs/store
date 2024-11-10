import { useState } from "react";
import { FaBars } from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useFeaturedListings } from "@/components/listing/FeaturedListings";
import Sidebar from "@/components/nav/Sidebar";
import { getNavItems } from "@/components/nav/navigation";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

const Navbar = () => {
  const { isAuthenticated } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { featuredListings } = useFeaturedListings();

  const navItems = getNavItems(isAuthenticated);

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
      <nav className="fixed w-full z-50 top-0 start-0 bg-background/50 backdrop-blur-sm">
        <div className="relative flex justify-between py-3 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28">
          <div className="flex justify-between w-full lg:w-auto gap-3">
            <Link
              to={ROUTES.HOME.path}
              className="flex items-center lg:flex-grow-0"
            >
              <span className="text-gray-1 text-lg font-semibold">K-Scale</span>
            </Link>
            <Button
              onClick={() => setShowSidebar(true)}
              variant="ghost"
              className="lg:hidden text-gray-1 p-4 text-sm"
            >
              <FaBars size={20} />
            </Button>
          </div>
          <div className="hidden lg:flex items-center flex-grow justify-between ml-4">
            <div className="flex space-x-1 p-2 flex-grow">
              <div className="flex-grow flex space-x-1">
                {featuredListings?.map((listing) => (
                  <Button
                    key={listing.id}
                    onClick={() =>
                      handleFeaturedClick(listing.username, listing.slug)
                    }
                    variant="ghost"
                    className="px-2 xl:px-3 py-2 text-sm tracking-widest text-gray-1"
                  >
                    {listing.name}
                  </Button>
                ))}
              </div>
              {navItems.map((item) =>
                item.isExternal ? (
                  <Button
                    key={item.name}
                    asChild
                    variant="ghost"
                    className="px-2 xl:px-3 py-2 text-sm tracking-wide xl:tracking-widest text-gray-1"
                  >
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </a>
                  </Button>
                ) : (
                  <Button
                    key={item.name}
                    asChild
                    variant={
                      location.pathname === item.path ? "default" : "ghost"
                    }
                    className="px-2 xl:px-3 py-2 text-sm tracking-widest"
                  >
                    <Link to={item.path}>
                      <div className="flex items-center gap-2">{item.name}</div>
                    </Link>
                  </Button>
                ),
              )}
            </div>
            <div className="flex items-center space-x-2 text-gray-1 p-2 ml-4 text-sm tracking-widest">
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.ACCOUNT.path}>Account</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.LOGOUT.path}>Logout</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.LOGIN.path}>Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.SIGNUP.path}>Sign Up</Link>
                  </Button>
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
