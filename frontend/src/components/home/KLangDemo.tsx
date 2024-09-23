import { useState } from "react";

import { VideoDemo } from "@/components/VideoDemo";
import { Button } from "@/components/ui/button";

export default function KLangDemo() {
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
          <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border bg-gray-11">
            <VideoDemo
              src="https://www.youtube.com/embed/Y-mD7Cp9KSs"
              type="youtube"
              title="Minimal PPO Implementation"
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
          <div className="flex flex-row gap-2 sm:gap-4 sm:flex-col sm:col-span-1">
            <Button
              variant={activeAction === "manipulate" ? "selected" : "secondary"}
              onClick={() => setActiveAction("manipulate")}
              className="w-full font-medium tracking-wide"
            >
              Manipulation
            </Button>
            <Button
              variant={activeAction === "turn" ? "selected" : "secondary"}
              onClick={() => setActiveAction("turn")}
              className="w-full font-medium tracking-wide"
            >
              Turning
            </Button>
            <Button
              variant={activeAction === "talk" ? "selected" : "secondary"}
              onClick={() => setActiveAction("talk")}
              className="w-full font-medium tracking-wide"
            >
              Talking
            </Button>
          </div>
          <div className="rounded-lg border shadow-sm sm:col-span-3 overflow-hidden">
            <pre className="text-xs sm:text-sm text-gray-12 bg-gray-3 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
              <code>{codeSnippets[activeAction]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
