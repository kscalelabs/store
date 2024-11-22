import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import TerminalRobotModel from "@/components/terminal/TerminalRobotModel";
import AVStreamer from "@/components/terminal/stream/AVStreamer";
import { SingleRobotResponse } from "@/components/terminal/types";
import { Button } from "@/components/ui/button";
import type { components } from "@/gen/api";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";

interface Props {
  robot: SingleRobotResponse;
  onUpdateRobot: (
    robotId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
}

type KRec = components["schemas"]["KRec"];

const TerminalSingleRobot = ({ robot, onUpdateRobot }: Props) => {
  const navigate = useNavigate();
  const auth = useAuthentication();
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
  const [krecs, setKrecs] = useState<KRec[]>([]);
  const [deleteKrecId, setDeleteKrecId] = useState<string | null>(null);
  const [selectedKrec, setSelectedKrec] = useState<KRec | null>(null);

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

  const handleDeleteKrec = async (krecId: string) => {
    try {
      await auth.client.DELETE("/krecs/{krec_id}", {
        params: {
          path: { krec_id: krecId },
        },
      });

      setKrecs((prev) => prev.filter((clip) => clip.id !== krecId));
      addTerminalMessage(`Successfully deleted clip ${krecId}`);
    } catch (error) {
      addTerminalMessage(`Error deleting clip: ${error}`);
    }
  };

  const fetchKrecInfo = async (krecId: string) => {
    try {
      const { data } = await auth.client.GET("/krecs/info/{krec_id}", {
        params: {
          path: { krec_id: krecId },
        },
      });
      return data;
    } catch (error) {
      addTerminalMessage(`Error fetching KRec info: ${error}`);
      return null;
    }
  };

  useEffect(() => {
    const fetchKrecs = async () => {
      try {
        const { data, error } = await auth.client.GET<
          "/krecs/{robot_id}",
          { params: { path: { robot_id: string } } }
        >("/krecs/{robot_id}", {
          params: {
            path: { robot_id: robot.robot_id },
          },
        });

        if (error) {
          addTerminalMessage(`Error fetching clips: ${error}`);
        } else {
          setKrecs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        addTerminalMessage(`Error: ${error}`);
        console.error("Error fetching krecs:", error);
      }
    };

    fetchKrecs();
  }, [robot.robot_id]);

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

      {/* Main grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[calc(100vh-8rem)]">
        {/* Video and Audio feed panel */}
        <AVStreamer />

        {/* 3D Mesh Visualization panel */}
        <div className="border border-gray-700 bg-black rounded-lg h-full w-full overflow-hidden">
          <TerminalRobotModel listingId={robot.listing_id} />
        </div>

        {/* Klang Input panel */}
        <div className="border border-gray-700 bg-black rounded-lg overflow-hidden min-h-[300px]">
          <div className="p-4 h-full flex flex-col gap-4">
            {FEATURE_FLAGS.KLANG_EXECUTION ? (
              <>
                <textarea
                  className="w-full h-full bg-black text-white border border-gray-700 p-2 font-mono resize-none focus:outline-none focus:ring-1 focus:border-white"
                  placeholder="Enter code here..."
                />
                <Button variant="default" className="w-full">
                  Execute
                </Button>
              </>
            ) : (
              <>
                <div className="relative flex-1">
                  <textarea
                    className="w-full h-full bg-black text-gray-500 border border-gray-700 p-2 font-mono resize-none focus:outline-none cursor-not-allowed"
                    placeholder="Klang code execution coming soon..."
                    disabled
                  />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-sm">
                      Demo - In Development
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  Execute
                </Button>
              </>
            )}
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

        {krecs.length > 0 && (
          <div className="border border-gray-700 bg-black rounded-lg overflow-hidden">
            <div className="p-4 flex flex-col gap-4 max-h-[600px]">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Uploaded Files</h3>
              </div>
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#1f2937 transparent",
                }}
              >
                <div className="space-y-2">
                  {[...krecs]
                    .sort((a, b) => b.created_at - a.created_at)
                    .map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-gray-900 rounded cursor-pointer"
                        onClick={() => setSelectedKrec(file)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                file.created_at * 1000,
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedKrec && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-gray-700 rounded-lg w-full max-w-4xl">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedKrec.name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => {
                      setDeleteKrecId(selectedKrec.id);
                      setSelectedKrec(null);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedKrec(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <div className="p-4 flex flex-col items-center justify-center h-[400px]">
                <span className="text-gray-500 mb-4">
                  Video Playback Coming Soon
                </span>
                <Button
                  variant="default"
                  onClick={async () => {
                    const krecInfo = await fetchKrecInfo(selectedKrec.id);
                    if (krecInfo?.urls?.url) {
                      const link = document.createElement("a");
                      link.href = krecInfo.urls.url;
                      link.download = krecInfo.urls.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      addTerminalMessage(
                        `Downloading ${krecInfo.urls.filename}...`,
                      );
                    }
                  }}
                >
                  Download Recording
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteKrecId !== null}
        onClose={() => setDeleteKrecId(null)}
        onDelete={() => {
          if (deleteKrecId) {
            handleDeleteKrec(deleteKrecId);
          }
        }}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        buttonText="Delete File"
      />
    </div>
  );
};

export default TerminalSingleRobot;
