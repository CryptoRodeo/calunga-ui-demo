import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
// import "./global.css"; // Removed: using PatternFly defaults instead

const container = document.getElementById("root");

// biome-ignore lint/style/noNonNullAssertion: container must exist
const root = createRoot(container!);

const renderApp = () => {
  return root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

renderApp();
