import {
  CodeIcon,
  DownloadIcon,
  MagnifyingGlassIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

import { BentoCard, BentoGrid } from "../ui/BentoGrid";

const Studio = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Everything for your project
      </h1>
      <BentoGrid className="grid-cols-2 md:grid-cols-4">
        <BentoCard
          name="Get Started"
          className="col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200" />
          }
          Icon={RocketIcon}
          description="Begin your K-Scale Dev journey"
          href="/get-started"
          cta="Start now"
        />
        <BentoCard
          name="Downloads"
          className="col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200" />
          }
          Icon={DownloadIcon}
          description="Access official and community resources"
          href="/downloads"
          cta="Get files"
        />
        <BentoCard
          name="Browse Builds"
          className="col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-200" />
          }
          Icon={MagnifyingGlassIcon}
          description="Explore published robot builds"
          href="/browse"
          cta="Discover"
        />
        <BentoCard
          name="K-Lang"
          className="col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200" />
          }
          Icon={CodeIcon}
          description="Write and run K-Lang programs (Coming Soon)"
          href="/k-lang"
          cta="Learn more"
        />
      </BentoGrid>
    </div>
  );
};

export default Studio;
