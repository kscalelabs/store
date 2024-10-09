import React, { useEffect, useRef, useState } from "react";

import { EditorState } from "@codemirror/state";
import { lineNumbers } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

interface WasmParser {
  parse_code: (code: string) => string;
}

const formatParsedOutput = (parsed: string): string => {
  const lines = parsed.split("\n").map((line) => line.trim());
  const stack: { rule: string; depth: number; content: string | null }[] = [];
  let result = "";

  const addToResult = (rule: string, content: string | null, depth: number) => {
    const indent = "  ".repeat(depth);
    if (content !== null) {
      result += `${indent}- ${rule}: "${content}"\n`;
    } else {
      result += `${indent}- ${rule}\n`;
    }
  };

  const isChainableRule = (rule: string) => {
    const chainableRules = [
      "expression",
      "conditional",
      "logical_or",
      "logical_and",
      "equality",
      "comparison",
      "additive",
      "multiplicative",
      "unary",
      "primary",
    ];
    return chainableRules.includes(rule);
  };

  let currentDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("Pair {")) {
      const ruleLine = lines[++i];
      const rule = ruleLine.replace("rule:", "").trim().replace(/,$/, "");
      // eslint-disable-next-line
      const spanLine = lines[++i];
      const strLine = lines[++i];
      const content = strLine.includes("str:")
        ? strLine
            .replace("str:", "")
            .trim()
            .replace(/^"|"$/g, "")
            .replace(/,$/, "")
        : null;

      while (
        stack.length > 0 &&
        stack[stack.length - 1].depth >= currentDepth
      ) {
        const popped = stack.pop();
        if (popped) addToResult(popped.rule, popped.content, popped.depth);
      }

      if (
        isChainableRule(rule) &&
        stack.length > 0 &&
        isChainableRule(stack[stack.length - 1].rule)
      ) {
        stack[stack.length - 1].rule += ` > ${rule}`;
        if (content !== null) {
          stack[stack.length - 1].content = content;
        }
      } else {
        stack.push({ rule, depth: currentDepth, content });
      }

      if (lines[i + 1]?.trim() === "inner:") {
        currentDepth++;
      }
    } else if (line === "]") {
      currentDepth--;
    }
  }

  while (stack.length > 0) {
    const popped = stack.pop();
    if (popped) addToResult(popped.rule, popped.content, popped.depth);
  }

  return result;
};

const MUJOCO = ({ url }: { url: string }) => {
  const appBodyRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [code, setCode] =
    useState(`fn pick_up_apple_manual() : "Pick up an apple manually" {
    x = 30deg;
    y = 30deg;
    *move(limb="left_arm", joint=2, pos=x + y);
  }`);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [wasmParser, setWasmParser] = useState<WasmParser | null>(null);

  const [selectedProgram, setSelectedProgram] = useState("program_1.k");
  const [selectedRobot, setSelectedRobot] = useState("robot_1.xml");
  const [selectedEmbodiment, setSelectedEmbodiment] =
    useState("environment_1.xml");

  const [showNotification] = useState(false);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasm = await import("../../../klang_parser/pkg/klang_parser.js");
        await wasm.default();
        console.log("Wasm module loaded:", wasm);
        setWasmParser(wasm);
      } catch (err) {
        console.error("Error loading Wasm:", err);
      }
    };

    loadWasm();
  }, []);

  useEffect(() => {
    const setupComponent = async () => {
      if (appBodyRef.current) {
        const htmlContent = `
          <div id="appbody" style="
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            "
            data-urdf-url="${url}"
          >
            <div id="mujoco-ui-container" style="
              position: absolute;
              display: flex;
              justify-content: center;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 10;
              width: 100%;
            ">
            <!-- Add any controls or elements you want centered here -->
            </div>
          </div>
        `;
        appBodyRef.current.innerHTML = htmlContent;
        scriptRef.current = document.createElement("script");
        scriptRef.current.type = "module";
        scriptRef.current.src = "/examples/main.js";
        appBodyRef.current
          ?.querySelector("#appbody")
          ?.appendChild(scriptRef.current);
      }
    };

    setupComponent();

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      if (appBodyRef.current) {
        appBodyRef.current.innerHTML = "";
      }
    };
  }, [url]);

  const handleRun = () => {
    if (wasmParser && wasmParser.parse_code) {
      try {
        const parsed = wasmParser.parse_code(code);
        const formattedOutput = formatParsedOutput(parsed);
        setConsoleOutput(`Parsed output:\n${formattedOutput}`);
      } catch (err) {
        setConsoleOutput(`Error parsing code: ${err.message}`);
      }
    } else {
      setConsoleOutput("Wasm module not loaded or parse_code not found.");
    }
  };

  const handleStop = () => {
    setConsoleOutput("Program stopped.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showNotification && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-primary-9 px-5 py-2 rounded-md z-50 font-bold">
          For the best user experience, visit with a desktop.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] border border-gray-300 mr-2 min-w-[400px]">
          <div
            ref={appBodyRef}
            className="w-full h-full max-h-full max-w-full"
          />
        </div>

        <div className="flex-[1.5] border border-gray-300 p-2 flex flex-col max-w-[500px]">
          <CodeMirror
            value={code}
            height="100%"
            extensions={[lineNumbers(), EditorState.tabSize.of(2)]}
            onChange={(value) => setCode(value)}
            onKeyDown={handleKeyDown}
            className="text-sm font-mono flex-grow"
          />
          <div className="flex justify-between mt-2">
            <button
              className="px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-5 bg-primary-9 text-white"
              onClick={handleRun}
            >
              Run
            </button>
            <button
              className="px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-5 bg-gray-12 text-white"
              onClick={handleStop}
            >
              Stop
            </button>
          </div>

          <div className="mt-2 border border-gray-7 rounded-md p-2 bg-gray- min-h-[100px] whitespace-pre-wrap overflow-y-auto max-h-[200px]">
            {consoleOutput || "Console output will be displayed here..."}
          </div>

          <div className="mt-5 p-2 border border-gray-7 rounded-md bg-gray-1">
            <div className="mb-4">
              <h4 className="mb-1">Programs</h4>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedProgram === "program_1.k" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedProgram("program_1.k")}
                >
                  program_1.k
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedProgram === "program_2.k" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedProgram("program_2.k")}
                >
                  program_2.k
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedProgram === "program_3.k" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedProgram("program_3.k")}
                >
                  program_3.k
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="mb-1">Robots</h4>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedRobot === "robot_1.xml" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedRobot("robot_1.xml")}
                >
                  robot_1.xml
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedRobot === "robot_2.xml" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedRobot("robot_2.xml")}
                >
                  robot_2.xml
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-1">Embodiments</h4>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedEmbodiment === "environment_1.xml" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedEmbodiment("environment_1.xml")}
                >
                  environment_1.xml
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-colors duration-300 hover:bg-gray-8 ${selectedEmbodiment === "environment_2.xml" ? "bg-primary-9 text-white" : "bg-gray-5"}`}
                  onClick={() => setSelectedEmbodiment("environment_2.xml")}
                >
                  environment_2.xml
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MUJOCO;
