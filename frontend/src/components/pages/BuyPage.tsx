import React, { useRef } from "react";

import CheckoutButton from "@/components/stripe/CheckoutButton";
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
      {/* Developer Mode Stompy Pro */}
      <CheckoutButton productId="prod_Qyzd8f0gFMis7c" />
      {/* Production Stompy Pro */}
      {/* <CheckoutButton productId="prod_R0n3nkCO4aQdlg" /> */}
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
        <h2 className="text-4xl font-bold mb-4">
          The best and most affordable humanoid robot on the market
        </h2>
        <p className="text-xl text-gray-11">
          Exceptional build quality and all the capabilities of other humanoid
          robot platforms, with full customizability at a fraction of the price.
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
        <h2 className="text-4xl font-bold mb-4">
          Program Your Robot to Do Anything
        </h2>
        <p className="text-xl text-gray-11">
          Powered by K-Lang, our neural network integrated programming language.
          You can tell your robot to do anything and it will learn and improve
          over time based on positive and negative reinforcement feedback loops.
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
        <h2 className="text-4xl font-bold mb-4">Build Quality</h2>
        <p className="text-xl text-gray-11">
          Built with an aircraft grade aluminum frame, and the best motors,
          actuators, and sensors available.
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
      {/* Developer Mode Stompy Pro */}
      <CheckoutButton productId="prod_Qyzd8f0gFMis7c" />
      {/* Production Stompy Pro */}
      {/* <CheckoutButton productId="prod_R0n3nkCO4aQdlg" /> */}
    </section>
  );
};

export default BuyPage;
