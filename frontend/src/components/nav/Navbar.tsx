import { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
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
                    variant="outline"
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
                    variant="outline"
                    className="px-2 xl:px-3 py-2 text-sm tracking-wide xl:tracking-widest text-gray-1"
                  >
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      {item.name}
                      <FaExternalLinkAlt className="h-3 w-3 text-gray-1" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    key={item.name}
                    asChild
                    variant={
                      location.pathname === item.path ? "default" : "outline"
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
            <div className="flex items-center space-x-4 text-gray-1 p-2 ml-4 text-sm tracking-widest">
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.ACCOUNT.path}>Account</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.LOGOUT.path}>Logout</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="px-3 py-2 text-gray-1"
                  >
                    <Link to={ROUTES.LOGIN.path}>Log In</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
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
