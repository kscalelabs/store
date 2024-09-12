import { useState } from "react";
import { isMobile } from "react-device-detect";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Sidebar from "@/components/nav/Sidebar";

const ICON_SIZE = isMobile ? 16 : 20;

const Navbar = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-gray-1/90 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between py-4 mx-4 sm:mx-8">
          <a
            className="flex items-center active cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-lg text-gray-12 font-bold font-sans">
              K-Scale Labs
            </span>
          </a>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-4">
              <a
                className="text-gray-12 hover:text-gray-11 cursor-pointer"
                onClick={() => navigate("/k-lang")}
              >
                K-Lang
              </a>
              <a
                className="text-gray-12 hover:text-gray-11 cursor-pointer"
                onClick={() => navigate("/downloads")}
              >
                Downloads
              </a>
              <a
                className="text-gray-12 hover:text-gray-11 cursor-pointer"
                onClick={() => navigate("/browse")}
              >
                Browse Builds
              </a>
            </div>
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
