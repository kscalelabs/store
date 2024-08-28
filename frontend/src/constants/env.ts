export const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export const BACKEND_WS_URL = BACKEND_URL.replace("http://", "ws://").replace(
  "https://",
  "wss://",
);
