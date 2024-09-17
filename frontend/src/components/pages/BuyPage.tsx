import React, { useRef } from "react";

import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

const BuyPage: React.FC = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="bg-gray-1 text-gray-12">
      <HeroSection />
      <FeaturesSection />
      <PerformanceSection />
      <DesignSection />
      <CTASection />
    </div>
  );
};

const HeroSection: React.FC = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <motion.section
      ref={ref}
      className="h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-3 rounded-lg"
      style={{ opacity, scale }}
    >
      <h1 className="text-6xl font-bold mb-4 font-orbitron">Stompy Pro</h1>
      <p className="text-xl text-gray-11 mb-8">
        The future of robotics, now at your fingertips.
      </p>
      <Button variant="primary" size="lg">
        Buy Now - $16,000
      </Button>
    </motion.section>
  );
};

const FeaturesSection: React.FC = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <motion.section
      ref={ref}
      className="min-h-screen flex items-center justify-center relative overflow-hidden rounded-lg"
      style={{ y }}
    >
      <div className="text-center max-w-2xl">
        <h2 className="text-4xl font-bold mb-4">Unparalleled Performance</h2>
        <p className="text-xl text-gray-11">
          Stompy Pro brings cutting-edge technology to your home or business.
        </p>
      </div>
      <div className="absolute inset-0 -z-10 bg-gray-3" />{" "}
      {/* Placeholder for background image */}
    </motion.section>
  );
};

const PerformanceSection: React.FC = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <motion.section
      ref={ref}
      className="min-h-screen flex items-center justify-center bg-gray-2 rounded-lg"
      style={{ opacity, scale }}
    >
      <div className="text-center max-w-2xl">
        <h2 className="text-4xl font-bold mb-4">Advanced AI</h2>
        <p className="text-xl text-gray-11">
          Powered by state-of-the-art artificial intelligence, Stompy Pro learns
          and adapts to your needs.
        </p>
      </div>
    </motion.section>
  );
};

const DesignSection: React.FC = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);

  return (
    <motion.section
      ref={ref}
      className="min-h-screen flex items-center justify-center relative overflow-hidden rounded-lg"
      style={{ x }}
    >
      <div className="text-center max-w-2xl">
        <h2 className="text-4xl font-bold mb-4">Robust Design</h2>
        <p className="text-xl text-gray-11">
          Built to last, with premium materials and meticulous attention to
          detail.
        </p>
      </div>
      <div className="absolute inset-0 -z-10 bg-gray-3" />{" "}
      {/* Placeholder for background image */}
    </motion.section>
  );
};

const CTASection: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-2 rounded-lg">
      <h2 className="text-4xl font-bold mb-4">
        Ready to transform your world?
      </h2>
      <p className="text-xl text-gray-11 mb-8">
        Bring Stompy Pro home today and step into the future.
      </p>
      <Button variant="default" size="lg">
        Order Now
      </Button>
    </section>
  );
};

export default BuyPage;
