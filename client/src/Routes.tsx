import { createBrowserRouter } from "react-router-dom";

import App from "./App";
import { PythonWheels } from "./pages/python-wheels/python-wheels";

export const Paths = {
  pythonWheels: "/python-wheels",
} as const;

export const AppRoutes = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          path: Paths.pythonWheels,
          element: <PythonWheels />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.PUBLIC_PATH || "/",
  },
);
