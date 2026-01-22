import type React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { DefaultLayout } from "./layout";
import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";
import { AppRoutes } from "./Routes";

const rawBase = import.meta.env.BASE_URL ?? "/";

// React Router expects an absolute pathname; remove trailing slash except for "/"
const basename =
  rawBase === "/"
    ? "/"
    : (rawBase.startsWith("/") ? rawBase : `/${rawBase}`).replace(/\/$/, "");

const App: React.FC = () => {
  return (
    <Router basename={basename}>
      <DefaultLayout>
        <AppRoutes />
      </DefaultLayout>
    </Router>
  );
};

export default App;
