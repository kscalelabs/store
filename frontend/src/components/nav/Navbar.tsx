import { useAuthentication } from "hooks/auth";
import { useDarkMode } from "hooks/dark_mode";
import { useState } from "react";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const SIZE = 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const { darkMode, setDarkMode } = useDarkMode();
  const { isAuthenticated } = useAuthentication();
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed w-full z-20 top-0 start-0">
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
              {darkMode ? <FaMoon size={SIZE} /> : <FaSun size={SIZE} />}
            </button>
            <button
              onClick={
                isAuthenticated
                  ? () => setShowSidebar(true)
                  : () => navigate("/login")
              }
              className="pl-4"
            >
              <FaUserCircle size={SIZE} />
            </button>
          </div>
        </div>
      </nav>
      {isAuthenticated && (
        <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
      )}
    </>
  );
};

export default Navbar;
