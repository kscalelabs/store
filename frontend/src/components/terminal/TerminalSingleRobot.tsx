import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "@/components/terminal/Terminal.css";

import { SingleRobotResponse } from "@/components/terminal/types";
import { useAlertQueue } from "@/hooks/useAlertQueue";

interface Props {
  robot: SingleRobotResponse;
  onUpdateRobot: (
    robotId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
}

const TerminalSingleRobot = ({ robot, onUpdateRobot }: Props) => {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [name, setName] = useState(robot.name);
  const [description, setDescription] = useState(robot.description || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  const { addErrorAlert } = useAlertQueue();

  const handleNameSave = async () => {
    try {
      setIsUpdatingName(true);
      await onUpdateRobot(robot.robot_id, { name });
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setIsUpdatingName(false);
      setIsEditingName(false);
    }
  };

  const handleDescriptionSave = async () => {
    try {
      setIsUpdatingDescription(true);
      await onUpdateRobot(robot.robot_id, { description });
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setIsUpdatingDescription(false);
      setIsEditingDescription(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 font-mono text-green-500 rounded-xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/terminal")}
        className="mb-4 border border-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors"
      >
        ← Back to Terminal
      </button>

      {/* Robot Details */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-black border border-green-500 px-2 py-1 text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                disabled={isUpdatingName}
                className="border border-green-500 px-4 py-1 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingName ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="border border-green-500 px-4 py-1 hover:bg-green-500 hover:text-black transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold">{name || "Unnamed Robot"}</h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm border border-green-500 px-2 py-1 hover:bg-green-500 hover:text-black transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          {isEditingDescription ? (
            <div className="flex-1 flex gap-2">
              <textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-black border border-green-500 px-2 py-1 text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[80px]"
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDescriptionSave}
                  disabled={isUpdatingDescription}
                  className="border border-green-500 px-4 py-1 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingDescription ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingDescription(false)}
                  className="border border-green-500 px-4 py-1 hover:bg-green-500 hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-start gap-2">
              <p className="flex-1">
                {description || "No description provided"}
              </p>
              <button
                onClick={() => setIsEditingDescription(true)}
                className="text-sm border border-green-500 px-2 py-1 hover:bg-green-500 hover:text-black transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection controls */}
      <div className="mb-4 flex flex-wrap gap-4">
        <button className="flex-1 border border-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors">
          Connect
        </button>
        <button className="flex-1 border border-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors">
          Disconnect
        </button>
        <button className="flex-1 border border-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors">
          Reset Connection
        </button>
      </div>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[calc(100vh-8rem)]">
        {/* Video feed panel */}
        <div className="border border-green-500 bg-black rounded-lg overflow-hidden">
          <div className="bg-green-500 text-black px-4 py-2 font-bold">
            Robot Video Feed
          </div>
          <div className="p-4">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              {" "}
              {/* 56.25% = 9/16 */}
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center border-2 border-dashed border-green-500">
                Waiting for video connection...
              </div>
            </div>
          </div>
        </div>

        {/* Status and metrics panel */}
        <div className="border border-green-500 bg-black rounded-lg overflow-hidden min-h-[200px]">
          <div className="bg-green-500 text-black px-4 py-2 font-bold">
            Robot Status
          </div>
          <div className="p-4 space-y-2">
            <div>Robot ID: {robot.robot_id}</div>
            <div>Connection: Disconnected</div>
            <div>Battery: ---%</div>
            <div>CPU: ---%</div>
            {/* Proprioception data will go here */}
          </div>
        </div>

        {/* Code input panel */}
        <div className="border border-green-500 bg-black rounded-lg overflow-hidden min-h-[300px]">
          <div className="bg-green-500 text-black px-4 py-2 font-bold">
            Code Input
          </div>
          <div className="p-4 h-[calc(100%-3rem)] flex flex-col gap-4">
            <textarea
              className="w-full h-full bg-black text-green-500 border border-green-500 p-2 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter code here..."
            />
            <button className="w-full border border-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors">
              Execute Code
            </button>
          </div>
        </div>

        {/* Console output panel */}
        <div className="border border-green-500 bg-black rounded-lg overflow-hidden min-h-[200px]">
          <div className="bg-green-500 text-black px-4 py-2 font-bold">
            Console Output
          </div>
          <div className="p-4 h-[calc(100%-3rem)] overflow-auto whitespace-pre-wrap">
            <p>{`>`} Robot terminal initialized</p>
            <p>{`>`} Waiting for connection...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalSingleRobot;
