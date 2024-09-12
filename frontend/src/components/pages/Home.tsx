import BuySection from "@/components/home/BuySection";
import CommunitySection from "@/components/home/CommunitySection";
import HeroASCIIArt from "@/components/home/HeroASCIIArt";
import KLangDemo from "@/components/home/KLangDemo";
import NavSection from "@/components/home/NavSection";

const Home = () => {
  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen bg-gray-1`}
    >
      <HeroASCIIArt />
      <KLangDemo />
      <BuySection />
      <NavSection />
      <CommunitySection />
    </main>
  );
};

export default Home;
