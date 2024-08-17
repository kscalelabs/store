import { useMemo } from "react";
import { isMobile } from "react-device-detect";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useDarkMode } from "hooks/useDarkMode";
import LandingDark from "images/LandingDark.png";
import LandingLight from "images/LandingLight.png";

import Features from "components/home/Features";
import { Button } from "components/ui/Button/Button";

const Home = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  // Change landing page image based on DarkMode state
  const renderImage = useMemo(() => {
    return (
      <img
        alt="Image of robot standing in futuristic background"
        src={darkMode ? LandingDark : LandingLight}
        className="absolute -z-10 h-full w-full object-cover object-right"
      />
    );
  }, [darkMode]);

  const renderDesktopHero = () => (
    <div className="relative isolate overflow-hidden h-[660px]">
      {renderImage}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/40 dark:bg-black/40 px-20 py-12 lg:w-1/2 shadow-sm">
        <div className="relative mx-auto max-w-2xl mt-10 px-6 lg:px-16">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl xl:text-6xl text-white">
            Buy, Sell,
            <br /> Build, and
            <br /> Share
            <br /> Droids
          </h1>
          <div className="flex gap-4 mx-auto mt-8 max-w-2xl lg:mx-0 lg:max-w-none">
            <Button
              onClick={() => navigate(`/browse`)}
              variant="primary"
              size="lg"
            >
              Browse
              <FaArrowRight className="ml-2" />
            </Button>
            <Button
              onClick={() => navigate(`/create`)}
              variant="secondary"
              size="lg"
            >
              Create
            </Button>
          </div>
          <p className="mt-8 text-white text-sm italic">
            Built with ❤️ by{" "}
            <a
              href="https://kscalelabs.com"
              target="_blank"
              className="underline"
              rel="noreferrer"
            >
              K-Scale Labs
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  const renderMobileHero = () => (
    <div className="relative isolate overflow-hidden h-[70vh]">
      {renderImage}
      <div className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-sm bg-white/40 dark:bg-black/40 px-6 py-8 shadow-sm">
        <div className="relative mx-auto max-w-sm px-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            K-Scale Store
          </h1>
          <p className="mt-2 text-sm text-white">
            Buy and sell robots and robot parts,
            <br /> share hardware and software,
            <br /> and connect with other robot enthusiasts,
            <br /> all in one place.
          </p>
          <div className="flex flex-row gap-2 mt-6 max-w-xs">
            <Button
              onClick={() => navigate(`/browse`)}
              variant="primary"
              size="lg"
            >
              Browse
              <FaArrowRight className="ml-2" />
            </Button>
            <Button
              onClick={() => navigate(`/create`)}
              variant="secondary"
              size="lg"
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {isMobile ? renderMobileHero() : renderDesktopHero()}
      <Features />
    </div>
  );
};

export default Home;
