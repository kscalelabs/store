import { useEffect, useRef, useState } from "react";
import { isDesktop } from "react-device-detect";

import { useWindowSize } from "hooks/useWindowSize";

const HeroASCIIArt = () => {
  const asciiRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  useEffect(() => {
    if (!asciiRef.current) return;

    // Adjust these values based on device type
    const charWidth = isDesktop ? 7 : 4;
    const charHeight = isDesktop ? 14 : 10;
    const initialPadding = isDesktop ? -14 : 0;
    const finalPadding = isDesktop ? 7 : 4;

    const getSize = (progress: number) => {
      const currentPadding =
        initialPadding + (finalPadding - initialPadding) * progress;
      return {
        width: Math.floor((windowWidth - currentPadding * 2) / charWidth),
        height: Math.floor((windowHeight - currentPadding * 2) / charHeight),
      };
    };

    const textStrings = [
      "Meet Stompy  Meet Stompy  Meet Stompy",
      "Program robots easily with K-Lang  Program robots easily with K-Lang  Program robots easily with K-Lang",
      "Affordable and functional humanoid robots  Affordable and functional humanoid robots  Affordable and functional humanoid robots",
      "Meet Stompy Mini  Meet Stompy Mini  Meet Stompy Mini",
      "How to write a walking policy  How to write a walking policy",
      "How to build a robot  How to build a robot",
      "Run robot simulations in your browser  Run robot simulations in your browser",
      "K-Scale has the best robot developer ecosystem  K-Scale has the best robot developer ecosystem",
      "Download kernel images, robot models, and more  Download kernel images, robot models, and more",
      "Download URDFs  Download Mujoco models",
      "View Onshape models  View Onshape models  View Onshape models",
      "AI-POWERED ROBOTS  AI-POWERED ROBOTS  AI-POWERED ROBOTS",
      "Developing with K-Lang is the easiest way to program robots",
      "K-Scale is the best place to learn about robots",
      "K-Scale's robot development platform is the best in the world",
      "How to train your own robot models  How to train your own robot models",
      "How to train your own robot policies  How to train your own robot policies",
      "How to build your own robot  How to build your own robot",
      "Buy a fully functional humanoid robot  Buy a fully functional humanoid robot",
      "Stompy can walk and talk Stompy can walk and talk",
      "You can control and train Stompy with K-Lang",
      "Stompy is the first functional and affordable humanoid robot availble to the public",
      "Open Source Robotics Open Source Robotics",
      "K-Lang is a neural net programming language for robots",
    ];

    const kScaleLabsLogo = [
      "                                                                                          ",
      " ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗   ██╗      █████╗ ██████╗ ███████╗ ",
      " ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝   ██║     ██╔══██╗██╔══██╗██╔════╝ ",
      " █████╔╝ █████╗███████╗██║     ███████║██║     █████╗     ██║     ███████║██████╔╝███████╗ ",
      " ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝     ██║     ██╔══██║██╔══██╗╚════██║ ",
      " ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗   ███████╗██║  ██║██████╔╝███████║ ",
      " ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ",
      "                                                                                          ",
    ];

    const kScaleLabsLogoMobile = [
      "                                                        ",
      " ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗ ",
      " ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝ ",
      " █████╔╝ █████╗███████╗██║     ███████║██║     █████╗   ",
      " ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝   ",
      " ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗ ",
      " ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝ ",
      "                                                        ",
      "            ██╗      █████╗ ██████╗ ███████╗            ",
      "            ██║     ██╔══██╗██╔══██╗██╔════╝            ",
      "            ██║     ███████║██████╔╝███████╗            ",
      "            ██║     ██╔══██║██╔══██╗╚════██║            ",
      "            ███████╗██║  ██║██████╔╝███████║            ",
      "            ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝            ",
      "                                                        ",
    ];

    // Get the size of the Logo ASCII art
    const { width, height } = getSize(1);
    const logo = isDesktop ? kScaleLabsLogo : kScaleLabsLogoMobile;
    const logoHeight = logo.length;
    const logoWidth = logo[0].length;

    // Logo position
    const logoY = Math.max(0, Math.floor((height - logoHeight) / 2) - 2);
    const logoX = Math.max(0, Math.floor((width - logoWidth) / 2) - 5);

    // Add a vertical offset to move the entire ASCII art up
    const verticalOffset = isDesktop ? 0 : -5; // Adjust this value as needed

    const animate = (timestamp: number) => {
      if (!startTime) setStartTime(timestamp);
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / 1500); // 1.5-second animation
      setAnimationProgress(progress);

      const { width, height } = getSize(progress);

      const a = 0.0007 * elapsed * progress;
      const logoStabilizationTime = 5000;

      let result = "";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const adjustedY = y + verticalOffset;
          if (
            adjustedY >= logoY &&
            adjustedY < logoY + logoHeight &&
            x >= logoX &&
            x < logoX + logoWidth
          ) {
            const logoChar = logo[adjustedY - logoY][x - logoX] || " ";
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

      if (asciiRef.current) {
        // Adjust font size based on device type for better fit
        const fontSize = isDesktop ? "12px" : "7px"; // Slightly reduced for mobile
        asciiRef.current.style.fontSize = fontSize;
        asciiRef.current.style.lineHeight = "1";
        asciiRef.current.textContent = result;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [windowWidth, windowHeight]);

  return (
    <div className="relative rounded-lg w-full overflow-hidden">
      <div
        ref={asciiRef}
        className="font-mono text-xs whitespace-pre overflow-hidden m-2 sm:mx-4 md:mx-8 max-w-full max-h-[80vh] rounded-3xl"
        style={{
          transform: `scale(${1 + 0.05 * (1 - animationProgress)})`, // Start larger, end at normal size
          transition: "transform 0.3s ease-out",
        }}
      />
    </div>
  );
};

export default HeroASCIIArt;
