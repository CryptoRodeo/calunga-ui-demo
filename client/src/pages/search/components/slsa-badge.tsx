import type React from "react";
import { Badge } from "@patternfly/react-core";

interface SLSABadgeProps {
  level: number;
}

export const SLSABadge: React.FC<SLSABadgeProps> = ({ level }) => {
  return (
    <Badge
      variant="filled"
      style={{ backgroundColor: "#e1d4ed", color: "#5a2d81" }}
    >
      SLSA L{level}
    </Badge>
  );
};
