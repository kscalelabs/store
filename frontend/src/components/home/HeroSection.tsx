import React from "react";
import { FaCirclePlay } from "react-icons/fa6";

import Meteors from "../ui/Meteors";
import { Button } from "../ui/button";

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
    <div className="relative flex flex-col w-full overflow-hidden items-center justify-center text-gray-1 bg-gray-12 py-16 sm:py-28 px-4 rounded-lg">
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
      <Button variant="primary" className="mt-6 sm:mt-10 py-6 px-3">
        <div className="flex items-center">
          <FaCirclePlay className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="font-medium tracking-widest">Watch Demo</span>
            <span className="text-gray-3 font-thin">1 minute</span>
          </div>
        </div>
      </Button>

      <Meteors />
    </div>
  );
};

export default HeroSection;
