import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useWindowSize } from "hooks/useWindowSize";
import KScale_Garage from "images/KScale_Garage.jpeg";
import StompyTeamPic from "images/StompyTeamPic.jpeg";

import LandingCard from "components/landing/LandingCard";

const Home = () => {
  const navigate = useNavigate();

  const asciiRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState(0);

  const { width: windowWidth, height: windowHeight } = useWindowSize();

  useEffect(() => {
    if (!asciiRef.current) return;

    // Adjust these values to fine-tune the sizing
    const charWidth = 7; // Approximate width of a character in pixels
    const charHeight = 14; // Approximate height of a character in pixels
    const padding = 7; // Padding around the ASCII art

    const width = Math.floor((windowWidth - padding) / charWidth);
    const height = Math.floor((windowHeight - padding) / charHeight);

    const textStrings = [
      "Meet Stompy",
      "Program robots easily with K-Lang",
      "Affordable and functional humanoid robots",
      "Meet Stompy Mini",
      "How to write a walking policy",
      "How to build a robot",
      "Run robot simulations in your browser",
      "K-Scale has the best robot developer ecosystem",
      "Download kernel images, robot models, and more",
      "Download URDFs",
      "Download Mujoco models",
      "View OnShape models",
      "AI-POWERED ROBOTS",
      "Future of Automation",
      "Developing with K-Lang is the easiest way to program robots",
      "K-Scale is the best place to learn about robots",
      "K-Scale's robot development platform is the best in the world",
      "How to train your own robot models",
      "How to train your own robot policies",
      "How to build your own robot",
      "Buy a fully functional humanoid robot",
      "Stompy can walk and talk",
      "You can control and train Stompy with K-Lang",
      "Stompy is a humanoid robot",
      "Stompy is the first functional and affordable humanoid robot availble to the public",
    ];

    const kScaleLabsLogo = [
      "██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗  ██╗      █████╗ ██████╗ ███████╗",
      "██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝  ██║     ██╔══██╗██╔══██╗██╔════╝",
      "█████╔╝ █████╗███████╗██║     ███████║██║     █████╗    ██║     ███████║██████╔╝███████╗",
      "██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝    ██║     ██╔══██║██╔══██╗╚════██║",
      "██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗  ███████╗██║  ██║██████╔╝███████║",
      "╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝  ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝",
    ];

    const logoHeight = kScaleLabsLogo.length;
    const logoWidth = kScaleLabsLogo[0].length;
    const logoY = Math.floor((height - logoHeight) / 2);
    const logoX = Math.floor((width - logoWidth) / 2);

    const animate = (timestamp: number) => {
      if (!startTime) setStartTime(timestamp);
      const elapsed = timestamp - startTime;

      const a = 0.0007 * elapsed;
      const logoStabilizationTime = 5000;

      let result = "";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (
            y >= logoY &&
            y < logoY + logoHeight &&
            x >= logoX &&
            x < logoX + logoWidth
          ) {
            const logoChar = kScaleLabsLogo[y - logoY][x - logoX];
            if (elapsed < logoStabilizationTime) {
              const t = Math.min(1, elapsed / logoStabilizationTime);
              const randomChar = String.fromCharCode(
                33 + Math.floor(Math.random() * 94),
              );
              result += Math.random() < t ? logoChar : randomChar;
            } else {
              result += logoChar;
            }
          } else {
            const s = 1 - (2 * y) / height;
            const o = (2 * x) / width - 1;
            const d = Math.sqrt(o * o + s * s);
            const l = (0.15 * a) / Math.max(0.1, d);
            const f = Math.sin(l);
            const b = Math.cos(l);
            const u = o * f - s * b;
            const m = Math.round(((o * b + s * f + 1) / 2) * width);
            const h =
              Math.round(((u + 1) / 2) * textStrings.length) %
              textStrings.length;
            const char =
              m < 0 || m >= width || h < 0 || h >= textStrings.length
                ? " "
                : textStrings[h][m] || " ";
            result += char;
          }
        }
        result += "\n";
      }

      // Update the result with responsive sizing
      if (asciiRef.current) {
        const fontSize = Math.max(
          8,
          Math.min(12, Math.floor(windowWidth / 100)),
        );
        asciiRef.current.style.fontSize = `${fontSize}px`;
        asciiRef.current.style.lineHeight = "1";
        asciiRef.current.textContent = result;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [windowWidth, windowHeight]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
      <div
        ref={asciiRef}
        className="font-mono text-xs whitespace-pre overflow-hidden p-4 max-w-full max-h-[80vh]"
      />
      <div className="mt-8 flex space-x-8">
        <LandingCard
          imageSrc={StompyTeamPic}
          title="Buy Stompy"
          description="The first functional and affordable humanoid robot for the public."
          onClick={() => navigate("/buy-stompy")}
        />
        <LandingCard
          imageSrc={KScale_Garage}
          title="Developer Portal"
          description="Access open-source tools, resources, and learning materials."
          onClick={() => navigate("/browse")}
        />
      </div>
    </div>
  );
};

export default Home;
