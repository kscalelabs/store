import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import Sidebar from "@/components/nav/Sidebar";
import { useAuthentication } from "@/hooks/useAuth";

const Navbar = () => {
  const { isAuthenticated } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();

  const navItems = [
    { name: "K-Lang", path: "/k-lang", isExternal: false },
    { name: "Buy Robot", path: "/buy", isExternal: false },
    { name: "Browse Builds", path: "/browse", isExternal: false },
    { name: "Downloads", path: "/downloads", isExternal: false },
    { name: "Forum", path: "https://forum.kscale.dev/", isExternal: true },
    { name: "Docs", path: "https://docs.kscale.dev/", isExternal: true },
    { name: "Blog", path: "https://blog.kscale.dev/", isExternal: true },
  ];

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-gray-1/30 backdrop-blur-lg">
        <div className="flex items-center justify-between py-3 mx-4 sm:mx-6 md:mx-12 lg:mx-20">
          <Link
            to="/"
            className="flex items-center space-x-2 bg-gray-12 p-3 rounded-lg hover:bg-gray-12/80 transition-all duration-300"
          >
            <Logo />
          </Link>
          <div className="hidden lg:flex items-center flex-grow justify-between ml-4">
            <div className="flex space-x-1 bg-gray-12 rounded-lg p-2 flex-grow justify-center">
              {navItems.map((item) =>
                item.isExternal ? (
                  <a
                    key={item.name}
                    href={item.path}
                    className={`px-2 xl:px-3 py-2 rounded-md text-sm font-semibold tracking-wide xl:tracking-widest text-gray-300 hover:bg-gray-1 hover:text-gray-12`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-2 xl:px-3 py-2 rounded-md text-sm font-semibold tracking-widest ${
                      location.pathname === item.path
                        ? "bg-gray-11 text-gray-1"
                        : "text-gray-300 hover:bg-gray-1 hover:text-gray-12"
                    }`}
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>
            <div className="flex items-center space-x-2 text-gray-1 bg-gray-12 rounded-lg p-2 ml-4 text-sm font-semibold tracking-widest">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className={`px-3 py-2 rounded-md hover:bg-gray-1 hover:text-gray-12 ${
                      location.pathname === "/account"
                        ? "bg-gray-11 text-gray-1"
                        : ""
                    }`}
                  >
                    Account
                  </Link>
                  <Link
                    to="/logout"
                    className="px-3 py-2 rounded-md hover:bg-primary-9"
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-gray-12"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-gray-12"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden text-gray-300 hover:bg-gray-700 bg-gray-12 hover:text-white p-4 rounded-md text-sm font-medium"
          >
            <FaBars size={20} />
          </button>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
