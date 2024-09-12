import BuySection from "@/components/home/BuySection";
import HeroASCIIArt from "@/components/home/HeroASCIIArt";
import KLangDemo from "@/components/home/KLangDemo";
import NavSection from "@/components/home/NavSection";

const Home = () => {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-[#111111]`}
    >
      <HeroASCIIArt />
      <KLangDemo />
      <BuySection />
      <NavSection />
    </div>
  );
};

export default Home;
