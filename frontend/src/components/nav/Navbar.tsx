import { useDarkMode } from "hooks/useDarkMode";
import { useState } from "react";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const ICON_SIZE = 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-white dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <span className="self-center text-2xl font-semibold whitespace-nowrap">
              Robolist
            </span>
          </button>
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
