import BuySection from "@/components/landing/BuySection";
import HeroASCIIArt from "@/components/landing/HeroASCIIArt";
import KLangDemo from "@/components/landing/KLangDemo";
import NavSection from "@/components/landing/NavSection";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-[#111111]">
      <HeroASCIIArt />
      <KLangDemo />
      <BuySection />
      <NavSection />
    </div>
  );
};

export default Home;
