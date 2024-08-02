import { Button } from "components/ui/Button/Button";
import { useDarkMode } from "hooks/useDarkMode";
import { useMemo } from "react";
import { isMobile } from "react-device-detect";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LandingDark from "../images/LandingDark.png";
import LandingLight from "../images/LandingLight.png";

const Home = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  // change landing page image based on DarkMode state
  const renderImage = useMemo(() => {
    return (
      <img
        alt="Image of robot standing in futuristic background"
        src={darkMode ? LandingDark : LandingLight}
        className="absolute -z-10 h-full w-full object-cover object-right md:object-center"
      />
    );
  }, [darkMode]);

  // mobile specifc layout
  if (isMobile) {
    return <div></div>;
  }

  return (
    <div className="relative isolate overflow-hidden pb-20">
      {renderImage}
      <div className="backdrop-blur-sm bg-white/40 dark:bg-black/40 px-20 p-12 rounded-br-xl lg:w-2/5 shadow-sm">
        <div className="mx-auto px-6 lg:px-4">
          <div className="relative mx-auto max-w-2xl mt-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-none font-extrabold tracking-tight text-white">
              Robolist
            </h2>
            <p className="mt-4 text-base lg:text-lg text-white">
              Buy and sell robots and robot parts,
              <br></br> share hardware and software,
              <br></br> and connect with other robot enthusiasts,
              <br></br> all in one place.
            </p>
            <div className="flex gap-4 mx-auto mt-12 max-w-2xl lg:mx-0 lg:max-w-none">
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
    </div>
  );
};

export default Home;
