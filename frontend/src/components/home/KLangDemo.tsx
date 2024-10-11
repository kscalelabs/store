import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { VideoDemo } from "@/components/VideoDemo";
import TextRevealByWord from "@/components/ui/TextReveal";
import { Button } from "@/components/ui/button";

export default function KLangDemo() {
  const navigate = useNavigate();
  const [activeAction, setActiveAction] =
    useState<keyof typeof codeSnippets>("manipulate");

  const codeSnippets = {
    manipulate: `function manipulateObject() {
  console.log("Manipulating object");
  // Add manipulation logic here
}

manipulateObject();`,
    turn: `function turnRobot(degrees) {
  console.log(\`Turning robot \${degrees} degrees\`);
  // Add turning logic here
}

turnRobot(90);`,
    talk: `function speakPhrase(phrase) {
  console.log(\`Robot says: \${phrase}\`);
  // Add text-to-speech logic here
}

speakPhrase("Hello, I am a robot.");`,
  };

  return (
    <section
      className="w-full py-8 bg-gray-12 rounded-lg px-4"
      id="first-section"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl ">
            <VideoDemo
              src="https://kscale-public.s3.amazonaws.com/varia/stompypro.mp4"
              type="s3"
              title="Stompy Pro"
              autoplay={true}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 px-4">
        <div className="flex flex-col gap-2 mb-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-gray-1">
            Watch <span className="font-black text-primary-9">K-Lang</span> In
            Action
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          <div className="flex flex-row gap-2 sm:gap-4 sm:flex-col sm:col-span-1 w-full font-medium tracking-wide">
            <Button
              variant={activeAction === "manipulate" ? "selected" : "secondary"}
              onClick={() => setActiveAction("manipulate")}
              className="w-full font-semibold tracking-wide"
            >
              Manipulation
            </Button>
            <Button
              variant={activeAction === "talk" ? "selected" : "secondary"}
              onClick={() => setActiveAction("talk")}
              className="w-full font-semibold tracking-wide"
            >
              Talking
            </Button>
            <Button
              variant={activeAction === "turn" ? "selected" : "secondary"}
              onClick={() => setActiveAction("turn")}
              className="w-full font-semibold tracking-wide"
            >
              Turning
            </Button>
          </div>
          <div className="rounded-lg border shadow-sm sm:col-span-3 overflow-hidden">
            <pre className="text-xs sm:text-sm text-gray-12 bg-gray-3 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
              <code>{codeSnippets[activeAction]}</code>
            </pre>
          </div>
        </div>
        <div className="flex flex-col justify-center text-center mt-16 max-w-2xl mx-auto">
          <TextRevealByWord
            text="K-Lang allows you to program robots with positive and negative
            reinforcement learning models."
          />
          <span className="text-xl font-semibold tracking-tight sm:text-2xl text-gray-2">
            Programming robots used to be difficult, but with K-Lang anyone can
            program robots to do complex tasks. And your robot will continue to
            learn and improve over time.
          </span>
          <div>
            <Button
              variant="primary"
              onClick={() => navigate("/k-lang")}
              className="px-12 py-6 mt-6 font-medium tracking-wide text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
