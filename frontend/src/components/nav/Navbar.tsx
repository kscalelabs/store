import { useState } from "react";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useDarkMode } from "hooks/useDarkMode";

import Sidebar from "components/nav/Sidebar";

const ICON_SIZE = 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between p-4">
          <a
            className="flex items-center active cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-lg text-gray-800 dark:text-gray-200 font-bold font-sans">
              K-Scale Store
            </span>
          </a>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
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
