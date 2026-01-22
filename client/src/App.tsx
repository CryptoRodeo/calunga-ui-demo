import type React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { DefaultLayout } from "./layout";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";
import { AppRoutes } from "./Routes";

const rawBase = import.meta.env.BASE_URL ?? "/";
// Vite: usually "/repo-name/"
// React Router basename: prefer "/repo-name" (no trailing slash), and MUST be absolute
const basename = (() => {
  const withLeading = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
  const noTrailing = withLeading.endsWith("/") && withLeading !== "/" ? withLeading.slice(0, -1) : withLeading;
  return noTrailing;
})();

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
