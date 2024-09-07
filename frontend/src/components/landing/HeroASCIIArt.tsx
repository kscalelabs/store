import { useEffect, useRef, useState } from "react";

import { useWindowSize } from "hooks/useWindowSize";

import { Meteors } from "components/ui/Meteors";

const HeroASCIIArt = () => {
  const asciiRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  useEffect(() => {
    if (!asciiRef.current) return;

    // Adjust these values to fine-tune the sizing
    const charWidth = 7; // Approximate width of a character in pixels
    const charHeight = 14; // Approximate height of a character in pixels
    const initialPadding = -14; // Start with negative padding to make it larger
    const finalPadding = 7; // End with the original padding

    const getSize = (progress: number) => {
      const currentPadding =
        initialPadding + (finalPadding - initialPadding) * progress;
      return {
        width: Math.floor((windowWidth - currentPadding) / charWidth),
        height: Math.floor((windowHeight - currentPadding) / charHeight),
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
      "Download URDFs  Download URDFs  Download URDFs",
      "Download Mujoco models  Download Mujoco models  Download Mujoco models",
      "View OnShape models  View OnShape models  View OnShape models",
      "AI-POWERED ROBOTS  AI-POWERED ROBOTS  AI-POWERED ROBOTS",
      "Future of Automation  Future of Automation",
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
    ];

    const kScaleLabsLogo = [
      "                                                                                          ",
      " ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗  ██╗      █████╗ ██████╗ ███████╗ ",
      " ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝  ██║     ██╔══██╗██╔══██╗██╔════╝ ",
      " █████╔╝ █████╗███████╗██║     ███████║██║     █████╗    ██║     ███████║██████╔╝███████╗ ",
      " ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝    ██║     ██╔══██║██╔══██╗╚════██║ ",
      " ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗  ███████╗██║  ██║██████╔╝███████║ ",
      " ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝  ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ",
      "                                                                                          ",
    ];

    const { width, height } = getSize(1);
    const logoHeight = kScaleLabsLogo.length;
    const logoWidth = kScaleLabsLogo[0].length;
    const logoY = Math.floor((height - logoHeight) / 2);
    const logoX = Math.floor((width - logoWidth) / 2);

    const animate = (timestamp: number) => {
      if (!startTime) setStartTime(timestamp);
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / 1500); // 1.5-second animation
      setAnimationProgress(progress);

      const { width, height } = getSize(progress);

      const a = 0.0005 * elapsed * progress;
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
    <div className="relative rounded-lg w-full overflow-hidden">
      <div
        ref={asciiRef}
        className="font-mono text-xs whitespace-pre overflow-hidden mx-2 sm:mx-6 max-w-full max-h-[80vh] bg-gray-900/50 rounded-3xl"
        style={{
          transform: `scale(${1 + 0.05 * (1 - animationProgress)})`, // Start larger, end at normal size
          transition: "transform 0.3s ease-out",
        }}
      />
      <Meteors />
    </div>
  );
};

export default HeroASCIIArt;
