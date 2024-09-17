import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  ChevronRightIcon,
  CodeIcon,
  DownloadIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

// Custom hook for intersection observer
function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isIntersecting }; // Return an object instead of an array
}

export default function NavSection() {
  const navigate = useNavigate();
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section className="w-full py-12 border-t border-b">
      <div className="flex flex-col justify-center mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-2 text-gray-12">
          The K-Scale Ecosystem
        </h2>
        <p className="text-lg text-gray-11">
          We&apos;re open source and always iterating. Join us in building the
          future of robotics.
        </p>
      </div>
      <div
        ref={ref}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-1000 ${
          isIntersecting ? "opacity-100" : "opacity-0"
        }`}
      >
        {[
          {
            title: "K-Lang",
            description: "Write, run, find, and upload Klang programs",
            icon: CodeIcon,
            path: "/k-lang",
            buttonText: "Explore K-Lang",
          },
          {
            title: "Downloads",
            description: "Kernel images, URDFs, ML models, and more",
            icon: DownloadIcon,
            path: "/downloads",
            buttonText: "Browse Downloads",
          },
          {
            title: "Browse Builds",
            description:
              "Browse robot builds with linked CAD files, part lists, and various related downloads",
            icon: MagnifyingGlassIcon,
            path: "/browse",
            buttonText: "View Builds",
          },
          {
            title: "K-Sim",
            description: "Run simulations",
            icon: LayersIcon,
            path: "/k-sim",
            buttonText: "Start Simulation",
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="cursor-pointer flex flex-col h-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-gradient-to-br from-gray-12 to-black"
            onClick={() => navigate(item.path)}
          >
            <CardHeader>
              <CardTitle className="text-gray-1">{item.title}</CardTitle>
              <CardDescription className="text-gray-7">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <item.icon className="w-12 h-12 mb-4 text-gray-7" />
              <div className="inline-flex items-center text-sm font-medium text-gray-1">
                {item.buttonText}
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
