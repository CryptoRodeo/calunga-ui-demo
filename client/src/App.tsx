import type React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { DefaultLayout } from "./layout";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";
import { AppRoutes } from "./Routes";

const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.PUBLIC_PATH || import.meta.env.BASE_URL}>
      <DefaultLayout>
        <AppRoutes />
      </DefaultLayout>
    </Router>
  );
};

export default App;
