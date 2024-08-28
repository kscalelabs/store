import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

import { cx } from "class-variance-authority";
import { BACKEND_URL } from "constants/env";
import { humanReadableError } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";

type Level = "success" | "info" | "error";

interface Message {
  message: string;
  level: Level;
}

interface ListingOnshapeUpdateProps {
  listingId: string;
  onClose: () => void;
}

const ListingOnshapeUpdate = (props: ListingOnshapeUpdateProps) => {
  const { listingId, onClose } = props;
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

    eventSource.addEventListener("finish", () => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [listingId, apiKeyId]);

  return (
    <div className="pt-4 w-full flex flex-col">
      <div
        ref={messageContainerRef}
        className="p-4 rounded-lg border border-dashed max-h-96 overflow-y-auto bg-gray-100"
      >
        {messages
          .slice(0)
          .reverse()
          .map(({ message, level }, index) => (
            <p
              key={index}
              className={cx(
                "text-sm",
                level === "success" && "text-green-600 font-bold my-1",
                level === "info" &&
                  "text-grey-200 font-thin dark:text-gray-700",
                level === "error" && "text-red-600 font-bold my-1",
              )}
            >
              {message}
            </p>
          ))}
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
