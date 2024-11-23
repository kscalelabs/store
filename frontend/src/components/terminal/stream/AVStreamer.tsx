import { useRef, useState } from "react";
import { FaMicrophone } from "react-icons/fa";

const AVStreamer = () => {
  const [serverUrl, setServerUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Just using placeholder values for now.
  const isConnected = false;
  const isLoading = false;
  const streamAspectRatio = null;
  const remoteController = null;
  const requestText = "";

  const handleConnect = () => {};
  const handleDisconnect = () => {};
  const handleSendRequest = () => {};

  return (
    <div className="border border-gray-700 bg-black rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
        {/* Server URL and controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="Enter WebRTC server URL (e.g., wss://server:8585)"
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md"
            disabled={isConnected}
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              onClick={handleConnect}
              disabled={isConnected || isLoading || !serverUrl}
            >
              Connect
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              onClick={handleDisconnect}
              disabled={!isConnected || isLoading}
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Video container */}
        <div
          className="relative w-full"
          style={{
            paddingTop: streamAspectRatio
              ? `${(1 / streamAspectRatio) * 100}%`
              : "56.25%",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-700 p-4">
                {isLoading
                  ? "Connecting..."
                  : "Waiting for video connection..."}
              </div>
            )}
          </div>
        </div>

        {/* Data Channel Controls */}
        {isConnected && remoteController && (
          <div className="flex flex-col gap-2">
            <textarea
              value={requestText}
              placeholder="Enter JSON request to send over data channel"
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-md"
              rows={4}
            />
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onClick={handleSendRequest}
              disabled={!requestText}
            >
              Send Request
            </button>
          </div>
        )}

        {/* Audio indicator */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <FaMicrophone />
          </div>
          <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AVStreamer;
