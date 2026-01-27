import { useRoutes, Navigate } from "react-router-dom";

import { PythonWheels } from "./pages/python-wheels/python-wheels";
import { Search } from "./pages/search/search";
import { PackageDetail } from "./pages/search/package-detail";
import { Suspense } from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";

export const Paths = {
  pythonWheels: "/python-wheels",
  search: "/search",
  packageDetail: "/search/:packageId",
} as const;

export const AppRoutes = () => {
  const allRoutes = useRoutes([
    { path: "/", element: <Navigate to={Paths.pythonWheels} /> },
    { path: Paths.pythonWheels, element: <PythonWheels /> },
    { path: Paths.search, element: <Search /> },
    { path: Paths.packageDetail, element: <PackageDetail /> },
  ]);

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      {allRoutes}
    </Suspense>
  );
};
