import { FaDiscord } from "react-icons/fa";

import { Button } from "@/components/ui/button";

export default function CommunitySection() {
  return (
    <section className="w-full py-12 md:py-24 bg-gray-12 rounded-lg">
      <div className="md:w-[50%] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 text-gray-1">
          Join Our Community
        </h2>
        <p className="text-sm md:text-lg text-gray-7 mb-8">
          Connect with fellow robot enthusiasts, industry experts, and
          researchers. Share projects and ideas, and stay updated on the latest
          K-Scale developments.
        </p>
        <Button
          className="inline-flex items-center bg-[#5865F2] hover:bg-[#4752C4] text-gray-1"
          onClick={() =>
            window.open("https://discord.com/invite/kscale", "_blank")
          }
        >
          <FaDiscord className="mr-2 h-5 w-5" />
          Join the K-Scale Labs Discord
        </Button>
      </div>
    </section>
  );
}
