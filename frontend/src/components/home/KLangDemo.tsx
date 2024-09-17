import { useState } from "react";

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
      className="w-full py-8 bg-gray-12 rounded-lg mx-12 px-4"
      id="first-section"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border bg-gray-7">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/placeholder.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex flex-col gap-2 mb-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl text-gray-1">
            Watch <span className="font-black text-orange-400">K-Lang</span> In
            Action
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="flex flex-row gap-4 col-span-2 md:col-span-1 md:flex-col">
            <Button
              variant={activeAction === "manipulate" ? "selected" : "secondary"}
              onClick={() => setActiveAction("manipulate")}
              className="w-full font-semibold tracking-wide"
              size="lg"
            >
              Manipulation
            </Button>
            <Button
              variant={activeAction === "turn" ? "selected" : "secondary"}
              onClick={() => setActiveAction("turn")}
              className="w-full font-semibold tracking-wide"
              size="lg"
            >
              Turning
            </Button>
            <Button
              variant={activeAction === "talk" ? "selected" : "secondary"}
              onClick={() => setActiveAction("talk")}
              className="w-full font-semibold tracking-wide"
              size="lg"
            >
              Talking
            </Button>
          </div>
          <div className="rounded-lg border shadow-sm col-span-2 md:col-span-3 overflow-hidden">
            <pre className="text-xs sm:text-sm text-gray-12 bg-gray-3 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
              <code>{codeSnippets[activeAction]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
