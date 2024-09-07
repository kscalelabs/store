import { useState } from "react";
import { isMobile } from "react-device-detect";
import {
  // FaMoon,
  // FaSun,
  FaSignInAlt,
  FaUserCircle,
  FaUserPlus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAuthentication } from "hooks/useAuth";

// import { useDarkMode } from "hooks/useDarkMode";
import Sidebar from "components/nav/Sidebar";

const ICON_SIZE = isMobile ? 16 : 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  // const { darkMode, setDarkMode } = useDarkMode();
  const { isAuthenticated } = useAuthentication();
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between py-4 mx-4 sm:mx-8">
          <a
            className="flex items-center active cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-lg text-gray-800 dark:text-gray-200 font-bold font-sans">
              K-Scale Labs
            </span>
          </a>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            {/* <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? (
                <FaMoon size={ICON_SIZE} />
              ) : (
                <FaSun size={ICON_SIZE} />
              )}
            </button> */}
            {isAuthenticated ? (
              <button onClick={() => setShowSidebar(true)} className="pl-4">
                <FaUserCircle size={ICON_SIZE} />
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="
                    flex
                    items-center
                    gap-2
                    justify-center
                    py-1
                    sm:py-2
                    px-2
                    sm:px-4
                    rounded-full
                    text-sm
                    sm:text-base
                    bg-[#2C514C]/30 hover:bg-[#2C514C]/50 transition-colors tracking-wider
                  "
                >
                  <FaUserPlus size={ICON_SIZE} className="text-[#487a73]" />{" "}
                  Sign Up
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="
                    flex
                    items-center
                    gap-2
                    justify-center
                    py-1
                    sm:py-2
                    px-2
                    sm:px-4
                    text-sm
                    sm:text-base
                    rounded-full bg-[#894B6D]/30 hover:bg-[#894B6D]/50 transition-colors tracking-wider"
                >
                  <FaSignInAlt size={ICON_SIZE} className="text-[#894B6D]" />{" "}
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
