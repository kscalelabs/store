import BuySection from "@/components/home/BuySection";
import CommunitySection from "@/components/home/CommunitySection";
import HeroSection from "@/components/home/HeroSection";
import KLangDemo from "@/components/home/KLangDemo";
import NavSection from "@/components/home/NavSection";

const Home = () => {
  return (
    <main
      className={`flex flex-col gap-8 items-center justify-center min-h-screen bg-gray-1 mb-12`}
    >
      <HeroSection />
      <KLangDemo />
      <BuySection />
      <NavSection />
      <CommunitySection />
    </main>
  );
};

export default Home;
