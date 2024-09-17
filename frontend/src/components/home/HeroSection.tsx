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
    <div className="relative flex flex-col w-full overflow-hidden items-center justify-center bg-gray-12 text-white py-28 px-4 rounded-lg backdrop-blur-md">
      <div className="hidden md:block select-none">
        <pre className="text-[0.8rem] leading-[0.8rem]">
          {kScaleLabsLogo.join("\n")}
        </pre>
      </div>
      <div className="md:hidden select-none">
        <pre className="text-[0.5rem] leading-[0.5rem]">
          {kScaleLabsLogoMobile.join("\n")}
        </pre>
      </div>
      <p className="text-xl md:text-2xl text-center md:max-w-2xl md:my-6">
        Program robots with K-Lang, our language purpose-built for humanoid
        robots.
      </p>
      <div className="mt-8 flex space-x-4">
        <button className="border border-white px-6 py-2 rounded-md font-semibold hover:bg-gray-1 hover:text-gray-12">
          Watch Demo 1 Minute
        </button>
      </div>

      <Meteors />
    </div>
  );
};

export default HeroSection;
