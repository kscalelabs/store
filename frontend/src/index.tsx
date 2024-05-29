import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Organizations from "pages/Organizations";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
    <Organizations/>
  </React.StrictMode>,
);
