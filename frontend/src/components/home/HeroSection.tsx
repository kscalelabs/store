import React from "react";

import Meteors from "../ui/Meteors";

const HeroSection: React.FC = () => {
  const kScaleLabsLogo = [
    "                                                                                          ",
    " ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗   ██╗      █████╗ ██████╗ ███████╗ ",
    " ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝   ██║     ██╔══██╗██╔══██╗██╔════╝ ",
    " █████╔╝ █████╗███████╗██║     ███████║██║     █████╗     ██║     ███████║██████╔╝███████╗ ",
    " ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝     ██║     ██╔══██║██╔══██╗╚════██║ ",
    " ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗   ███████╗██║  ██║██████╔╝███████║ ",
    " ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ",
    "                                                                                          ",
  ];

  const kScaleLabsLogoMobile = [
    "                                                        ",
    " ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗ ",
    " ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝ ",
    " █████╔╝ █████╗███████╗██║     ███████║██║     █████╗   ",
    " ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝   ",
    " ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗ ",
    " ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝ ",
    "                                                        ",
    "            ██╗      █████╗ ██████╗ ███████╗            ",
    "            ██║     ██╔══██╗██╔══██╗██╔════╝            ",
    "            ██║     ███████║██████╔╝███████╗            ",
    "            ██║     ██╔══██║██╔══██╗╚════██║            ",
    "            ███████╗██║  ██║██████╔╝███████║            ",
    "            ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝            ",
    "                                                        ",
  ];

  return (
    <div className="relative flex flex-col w-full overflow-hidden items-center justify-center text-white py-16 sm:py-28 px-4 rounded-lg">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-6 via-primary-9 to-gray-12 opacity-60"></div>
        <div className="absolute inset-0 bg-gray-10 mix-blend-overlay"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-gray-11 opacity-30 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1/4 h-1/4 rounded-full bg-primary-7 opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-1/5 h-1/5 rounded-full bg-primary-6 opacity-30 blur-3xl"></div>
        </div>
      </div>
      {/* Content */}
      <div className="relative z-10 backdrop-blur-sm">
        <div className="hidden md:block select-none">
          <pre className="text-[0.8rem] leading-[0.8rem]">
            {kScaleLabsLogo.join("\n")}
          </pre>
        </div>
        <div className="md:hidden select-none text-center">
          <pre className="text-[0.5rem] leading-[0.5rem]">
            {kScaleLabsLogoMobile.join("\n")}
          </pre>
        </div>
        <p className="text-lg sm:text-xl md:text-2xl text-center md:max-w-2xl mt-4 sm:mt-6">
          Program robots with K-Lang, our language purpose-built for humanoid
          robots.
        </p>
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button className="border border-white px-4 sm:px-6 py-2 rounded-md font-semibold hover:bg-gray-12 hover:border-gray-12 hover:text-gray-2 text-sm sm:text-base">
            Watch Demo 1 Minute
          </button>
        </div>
      </div>
      <Meteors />
    </div>
  );
};

export default HeroSection;
