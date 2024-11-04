import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { humanReadableError } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { BACKEND_URL } from "@/lib/constants/env";
import { cx } from "class-variance-authority";

type Level = "success" | "info" | "error";

interface Message {
  message: string;
  level: Level;
}

interface ListingOnshapeUpdateProps {
  listingId: string;
  onClose: () => void;
  addArtifactId: (artifactId: string) => Promise<void>;
}

const ListingOnshapeUpdate = (props: ListingOnshapeUpdateProps) => {
  const { listingId, onClose, addArtifactId } = props;
  const { apiKeyId } = useAuthentication();
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const addMessage = (message: string, level: Level) => {
    setMessages((prevMessages) => [...prevMessages, { message, level }]);
  };

  useEffect(() => {
    const url = `${BACKEND_URL}/onshape/pull/${listingId}?token=${apiKeyId}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      addMessage("Connected to Onshape update stream", "info");
    };

    eventSource.onerror = (event) => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        addMessage("Disconnected from Onshape update stream", "info");
      } else {
        addMessage(humanReadableError(event), "error");
      }
      eventSource.close();
    };

    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      addMessage(data.message, data.level);
    });

    eventSource.addEventListener("image", (event) => {
      const data = JSON.parse(event.data);
      addMessage(`New image received: ${data.message}`, "success");
      addArtifactId(data.message);
    });

    eventSource.addEventListener("urdf", (event) => {
      const data = JSON.parse(event.data);
      addMessage(`New URDF: ${data.message}`, "success");
      addArtifactId(data.message);
    });

    eventSource.addEventListener("finish", () => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [listingId, apiKeyId]);

  return (
    <div className="pt-4 flex flex-col max-w-full">
      <div
        ref={messageContainerRef}
        className="p-4 max-h-96 overflow-auto bg-gray-12 w-full"
      >
        <div className="whitespace-pre">
          {messages
            .slice(0)
            .reverse()
            .map(({ message, level }, index) => (
              <pre
                key={index}
                className={cx(
                  "text-sm font-mono break-words",
                  level === "success" && "text-green-600 font-bold my-1",
                  level === "info" && "text-gray-11",
                  level === "error" && "text-red-600 font-bold my-1",
                )}
              >
                <code>{message}</code>
              </pre>
            ))}
        </div>
      </div>
      <div className="mt-4 flex flex-row">
        <Button onClick={onClose} variant="destructive">
          Close
          <FaTimes className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ListingOnshapeUpdate;
