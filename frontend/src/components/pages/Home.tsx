import { useNavigate } from "react-router-dom";

import KScale_Garage from "images/KScale_Garage.jpeg";
import StompyTeamPic from "images/StompyTeamPic.jpeg";

import HeroASCIIArt from "components/landing/HeroASCIIArt";
import LandingCard from "components/landing/LandingCard";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <HeroASCIIArt />
      <div className="mt-10 mb-20 mx-2 flex flex-col sm:flex-row gap-6 sm:gap-10">
        <LandingCard
          imageSrc={StompyTeamPic}
          title="Buy Stompy"
          description="The first functional and affordable humanoid robot for the public."
          onClick={() => navigate("/buy-stompy")}
        />
        <LandingCard
          imageSrc={KScale_Garage}
          title="Developer Studio"
          description="Access open-source tools, resources, and learning materials."
          onClick={() => navigate("/studio")}
        />
      </div>
    </div>
  );
};

export default Home;
