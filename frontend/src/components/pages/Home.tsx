import { useEffect, useState } from "react";

import BuySection from "@/components/landing/BuySection";
import HeroASCIIArt from "@/components/landing/HeroASCIIArt";
import KLangDemo from "@/components/landing/KLangDemo";
import NavSection from "@/components/landing/NavSection";

const Home = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-[#111111] ${scrolled ? "pt-14" : ""}`}
    >
      <HeroASCIIArt />
      <KLangDemo />
      <BuySection />
      <NavSection />
    </div>
  );
};

export default Home;
