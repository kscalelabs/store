import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import KScale_Garage from "@/images/KScale_Garage.jpeg";
import { motion } from "framer-motion";

export default function BuySection() {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      className="w-full py-12 md:py-24 lg:py-32 bg-gray-12 rounded-lg p-4 shadow-sm"
    >
      <div>
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="inline-block rounded-lg bg-gray-7 px-3 py-1 text-sm w-fit">
              New Release
            </div>
            <h2 className="text-gray-1 font-orbitron text-3xl font-bold tracking-tight sm:text-5xl">
              Stompy Pro
            </h2>
            <p className="max-w-[700px] text-gray-1 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-3">
              Exceptional build quality and all the capabilities of other
              humanoid robot platforms, with full customizability at a fraction
              of the price.
            </p>
          </div>
        </motion.div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <motion.img
            variants={itemVariants}
            alt="Robot"
            className="mx-auto w-full max-w-md aspect-video overflow-hidden rounded-xl object-cover object-center lg:order-last"
            height="310"
            src={KScale_Garage}
            width="550"
          />
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-center space-y-4"
          >
            <ul className="grid gap-6 text-gray-1">
              <li>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Advanced AI</h3>
                  <p className="text-gray-8">
                    Powered by the latest artificial intelligence algorithms.
                  </p>
                </div>
              </li>
              <li>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Precision Control</h3>
                  <p className="text-gray-8">
                    Unparalleled accuracy in movement and manipulation.
                  </p>
                </div>
              </li>
              <li>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">24/7 Operation</h3>
                  <p className="text-gray-8">
                    Designed for continuous operation without downtime.
                  </p>
                </div>
              </li>
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row mt-2">
              <Button
                className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-md text-sm font-medium shadow-md"
                onClick={() => navigate("/buy")}
                variant="secondary"
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate("/buy")}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
