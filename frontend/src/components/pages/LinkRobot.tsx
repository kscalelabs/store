import React, { useRef, useState } from "react";

import Container from "@/components/ui/container";
import { useAlertQueue } from "@/hooks/useAlertQueue";

const LinkRobot = () => {
  const [code, setCode] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { addAlert } = useAlertQueue();

  const isSubmitDisabled = code.some((digit) => digit === "") || isLoading;

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if value is entered
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (value !== "" && index === 5) {
      // Auto-submit when the last digit is entered
      handleSubmit();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && !isSubmitDisabled) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (code.some((digit) => digit === "")) return;

    setIsLoading(true);
    addAlert("Linking is not yet implemented", "error");
    setIsLoading(false);
  };

  return (
    <Container>
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Link Your Robot
          </h1>
          <p className="text-gray-600">
            Enter the 6-digit code displayed on your robot
          </p>
        </div>

        <div className="flex flex-col gap-6 items-center">
          <div className="grid grid-cols-6 gap-3 w-full">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full h-16 text-center text-2xl font-semibold border-2 border-gray-200 rounded-xl
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    transition-all duration-200
                    disabled:bg-gray-50 disabled:cursor-not-allowed
                    placeholder-gray-300"
                  placeholder="0"
                  disabled={isLoading}
                />
              ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full py-4 px-6 mt-4 bg-blue-600 hover:bg-blue-700
              text-white font-semibold rounded-xl transition-colors duration-200
              disabled:bg-gray-300 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Linking..." : "Link Robot"}
          </button>
        </div>
      </div>
    </Container>
  );
};

export default LinkRobot;
