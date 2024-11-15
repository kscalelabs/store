import { useEffect, useRef, useState } from "react";
import { FaMicrophone } from "react-icons/fa";

import { useAlertQueue } from "@/hooks/useAlertQueue";

// Add these interfaces at the top with the other interfaces
interface ConsumerSession {
  mungeStereoHack: boolean;
  remoteController: RemoteController | null;
  streams: MediaStream[];
  connect: () => void;
  close: () => void;
  addEventListener: (event: string, callback: () => void) => void;
}

interface RemoteController {
  sendControlRequest: (request: string) => string;
  addEventListener: (event: string, callback: (event: unknown) => void) => void;
}

// Update the GstWebRTCAPI interface
interface GstWebRTCAPI {
  getAvailableProducers: () => Array<{ id: string }>;
  createConsumerSession: (producerId: string) => ConsumerSession;
}

const AVStreamer = () => {
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiRef = useRef<GstWebRTCAPI | null>(null);
  const sessionRef = useRef<ConsumerSession | null>(null);
  const [streamAspectRatio, setStreamAspectRatio] = useState<number | null>(
    null,
  );
  const [remoteController, setRemoteController] =
    useState<RemoteController | null>(null);
  const [requestText, setRequestText] = useState("");

  useEffect(() => {
    // Initialize WebRTC API
    const api = new (window as any).GstWebRTCAPI({
      meta: { name: `WebClient-${Date.now()}` },
      signalingServerUrl: "wss://xr.kscale.ai:8585",
    });
    apiRef.current = api;

    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setIsLoading(true);

      // Get available producers
      const producers = apiRef.current?.getAvailableProducers();
      if (!producers || producers.length === 0) {
        throw new Error(`No available producers on ${serverUrl}`);
      }

      // Create consumer session for first producer
      const session = apiRef.current?.createConsumerSession(producers[0].id);
      if (!session) {
        throw new Error(
          `Failed to create consumer session for ${producers[0].id}`,
        );
      }
      session.mungeStereoHack = true;
      sessionRef.current = session;

      // Add remote controller event listener
      session.addEventListener("remoteControllerChanged", () => {
        const controller = session.remoteController;
        if (controller) {
          setRemoteController(controller);
          controller.addEventListener("info", (_: any) => {
            addAlert("Received response from producer", "info");
          });
        } else {
          setRemoteController(null);
        }
      });

      session.addEventListener("streamsChanged", () => {
        const streams = session.streams;
        if (streams.length > 0 && videoRef.current) {
          videoRef.current.srcObject = streams[0];
          videoRef.current.play().catch(() => {});

          // Get video track settings when stream starts
          const videoTrack = streams[0].getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            if (settings.width && settings.height) {
              setStreamAspectRatio(settings.width / settings.height);
            }
          }
        }
      });

      session.addEventListener("closed", () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        }
        setIsConnected(false);
      });

      session.connect();
      setIsConnected(true);
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setStreamAspectRatio(null);
  };

  const handleSendRequest = () => {
    try {
      if (remoteController && requestText) {
        const id = remoteController.sendControlRequest(requestText);
        console.log("Sent control request with ID:", id);
      }
    } catch (error) {
      addErrorAlert(error);
    }
  };

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
              onChange={(e) => setRequestText(e.target.value)}
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
