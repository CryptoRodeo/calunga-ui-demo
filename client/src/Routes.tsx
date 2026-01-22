import { useRoutes, Navigate } from "react-router-dom";

import { PythonWheels } from "./pages/python-wheels/python-wheels";
import { Suspense } from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";

export const Paths = {
  pythonWheels: "python-wheels",
} as const;

export const AppRoutes = () => {
  const allRoutes = useRoutes([
    { path: "/", element: <Navigate to={Paths.pythonWheels} /> },
    { path: Paths.pythonWheels, element: <PythonWheels /> },
  ]);

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }>
      {allRoutes}
    </Suspense>
  );
};
