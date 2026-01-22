import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AppRoutes } from "./Routes";
// import "./global.css"; // Removed: using PatternFly defaults instead

const container = document.getElementById("root");

// biome-ignore lint/style/noNonNullAssertion: container must exist
const root = createRoot(container!);

const renderApp = () => {
  return root.render(
    <React.StrictMode>
      <RouterProvider router={AppRoutes} />
    </React.StrictMode>,
  );
};

renderApp();
