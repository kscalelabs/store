import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import AudioIcon from "@/components/icons/AudioIcon";
import TerminalRobotModel from "@/components/terminal/TerminalRobotModel";
import { SingleRobotResponse } from "@/components/terminal/types";
import { Button } from "@/components/ui/button";
import ROUTES from "@/lib/types/routes";

interface Props {
  robot: SingleRobotResponse;
  onUpdateRobot: (
    robotId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
}

enum ConnectionStatus {
  Disconnected = "Disconnected",
  Connecting = "Connecting...",
  Connected = "Connected",
}

const TerminalSingleRobot = ({ robot, onUpdateRobot }: Props) => {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [name, setName] = useState(robot.name);
  const [description, setDescription] = useState(robot.description || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([
    "Welcome to the terminal!",
    `Robot ID: ${robot.robot_id}`,
    `Listing ID: ${robot.listing_id}`,
  ]);

  const addTerminalMessage = (message: string) => {
    setTerminalMessages((prev) => [...prev, message]);
  };

  const handleNameSave = async () => {
    try {
      setIsUpdatingName(true);
      await onUpdateRobot(robot.robot_id, { name });
    } catch (error) {
      addTerminalMessage(`Error: ${error}`);
    } finally {
      addTerminalMessage(
        `Name updated to "${name.length > 20 ? name.slice(0, 20) + "..." : name}"`,
      );
      setIsUpdatingName(false);
      setIsEditingName(false);
    }
  };

  const handleDescriptionSave = async () => {
    try {
      setIsUpdatingDescription(true);
      await onUpdateRobot(robot.robot_id, { description });
    } catch (error) {
      addTerminalMessage(`Error: ${error}`);
    } finally {
      addTerminalMessage(
        `Description updated to "${description.length > 20 ? description.slice(0, 20) + "..." : description}"`,
      );
      setIsUpdatingDescription(false);
      setIsEditingDescription(false);
    }
  };

  const handleConnectionChange = (status: ConnectionStatus) => {
    addTerminalMessage(`Connection status: ${status}`);
  };

  const handleConnect = () => {
    handleConnectionChange(ConnectionStatus.Connecting);
  };

  const handleDisconnect = () => {
    handleConnectionChange(ConnectionStatus.Disconnected);
  };

  return (
    <div className="min-h-screen bg-black p-4 font-mono text-white">
      {/* Navigation buttons */}
      <div className="flex gap-4 mb-4">
        <Button
          onClick={() => navigate(ROUTES.TERMINAL.path)}
          variant="default"
          className="gap-4"
        >
          <FaArrowLeft /> All Robots
        </Button>
        <Button
          onClick={() =>
            navigate(
              ROUTES.BOT.buildPath({
                username: robot.username,
                slug: robot.slug,
              }),
            )
          }
          variant="default"
        >
          Listing
        </Button>
      </div>

      {/* Robot Details */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-black border border-gray-700 px-2 py-1 text-white focus:outline-none focus:ring-1 focus:border-white"
                autoFocus
              />
              <Button
                onClick={handleNameSave}
                disabled={isUpdatingName}
                variant="default"
                size="sm"
              >
                {isUpdatingName ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => setIsEditingName(false)}
                variant="default"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold">{name || "Unnamed Robot"}</h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm border border-gray-700 px-2 py-1 hover:bg-gray-700 transition-colors"
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
                className="flex-1 bg-black border border-gray-700 px-2 py-1 text-white focus:outline-none focus:ring-1 focus:border-white min-h-[80px] font-mono"
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDescriptionSave}
                  disabled={isUpdatingDescription}
                  variant="default"
                  size="sm"
                >
                  {isUpdatingDescription ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => setIsEditingDescription(false)}
                  variant="default"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-start gap-2">
              <p className="flex-1">
                {description || "No description provided"}
              </p>
              <button
                onClick={() => setIsEditingDescription(true)}
                className="text-sm border border-gray-700 px-2 py-1 hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection controls */}
      <div className="mb-4 flex flex-wrap gap-4">
        <Button onClick={handleConnect} variant="default" className="flex-1">
          Connect
        </Button>
        <Button onClick={handleDisconnect} variant="default" className="flex-1">
          Disconnect
        </Button>
      </div>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[calc(100vh-8rem)]">
        {/* Video and Audio feed panel */}
        <div className="border border-gray-700 bg-black rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
            {/* Video container */}
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center border-2 border-dashed border-gray-700 p-4">
                Waiting for video connection...
              </div>
            </div>

            {/* Audio indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <AudioIcon />
              </div>
              <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Mesh Visualization panel */}
        <div className="border border-gray-700 bg-black rounded-lg h-full w-full overflow-hidden">
          <TerminalRobotModel listingId={robot.listing_id} />
        </div>

        {/* Klang Input panel */}
        <div className="border border-gray-700 bg-black rounded-lg overflow-hidden min-h-[300px]">
          <div className="p-4 h-full flex flex-col gap-4">
            <textarea
              className="w-full h-full bg-black text-white border border-gray-700 p-2 font-mono resize-none focus:outline-none focus:ring-1 focus:border-white"
              placeholder="Enter code here..."
            />
            <Button variant="default" className="w-full">
              Execute
            </Button>
          </div>
        </div>

        {/* Console output panel */}
        <div className="border border-gray-700 bg-black rounded-lg overflow-hidden min-h-[300px]">
          <div className="p-4 h-full overflow-auto whitespace-pre-wrap">
            {[...terminalMessages].reverse().map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalSingleRobot;
