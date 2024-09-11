import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "@/components/nav/Sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";

const ICON_SIZE = isMobile ? 16 : 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showNavbar, setShowNavbar] = useState<boolean>(true);
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === "/") {
        setShowNavbar(window.scrollY > 100);
      }
    };

    if (location.pathname === "/") {
      setShowNavbar(false);
      window.addEventListener("scroll", handleScroll);
    } else {
      setShowNavbar(true);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  if (!showNavbar) return null;

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-white/80 dark:bg-[#111111] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between py-4 mx-4 sm:mx-8">
          <a
            className="flex items-center active cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-lg text-gray-800 dark:text-gray-200 font-bold font-sans">
              K-Scale Labs
            </span>
          </a>
          <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? (
                <FaMoon size={ICON_SIZE} />
              ) : (
                <FaSun size={ICON_SIZE} />
              )}
            </button>

            <button onClick={() => setShowSidebar(true)} className="pl-4">
              <FaUserCircle size={ICON_SIZE} />
            </button>
          </div>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
