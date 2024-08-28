import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { cx } from "class-variance-authority";
import { BACKEND_WS_URL } from "constants/env";
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

  const WS_URL = `${BACKEND_WS_URL}/onshape/pull/${listingId}`;

  const { lastMessage, readyState, sendMessage } = useWebSocket(WS_URL, {
    share: false,
    shouldReconnect: () => false,
  });

  useEffect(() => {
    switch (readyState) {
      case ReadyState.CLOSED:
        addMessage("Connection closed", "info");
        break;
      case ReadyState.CLOSING:
        addMessage("Connection closing", "info");
        break;
      case ReadyState.CONNECTING:
        addMessage("Connection connecting", "info");
        break;
      case ReadyState.OPEN:
        addMessage("Connection open", "success");
        // Send the API key to authenticate the connection.
        sendMessage(apiKeyId || "");
        break;
    }
  }, [readyState]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.data.startsWith("error: ")) {
        addMessage(lastMessage.data.slice(7), "error");
      } else if (lastMessage.data.startsWith("info: ")) {
        addMessage(lastMessage.data.slice(6), "info");
      } else if (lastMessage.data.startsWith("success: ")) {
        addMessage(lastMessage.data.slice(9), "success");
      } else {
        addMessage(lastMessage.data, "info");
      }
    }
  }, [lastMessage]);

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
                level === "info" && "text-grey-200 font-thin",
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
