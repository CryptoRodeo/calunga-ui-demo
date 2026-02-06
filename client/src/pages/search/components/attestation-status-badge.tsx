import type React from "react";
import { Badge } from "@patternfly/react-core";

interface AttestationStatusBadgeProps {
  attestation?: any;
  showVerifier?: boolean;
  status?: string;
}

export const AttestationStatusBadge: React.FC<AttestationStatusBadgeProps> = ({
  attestation,
  showVerifier = false,
  status,
}) => {
  const badgeStatus =
    status ||
    attestation?.status ||
    attestation?.verificationStatus ||
    "verified";

  if (showVerifier) {
    return (
      <Badge
        variant="filled"
        style={{ backgroundColor: "#d1edcc", color: "#0f5132" }}
      >
        Red Hat - Verified
      </Badge>
    );
  }

  return (
    <Badge
      variant="filled"
      style={{
        backgroundColor: badgeStatus === "verified" ? "#d1edcc" : "#f8d7da",
        color: badgeStatus === "verified" ? "#0f5132" : "#842029",
      }}
    >
      {badgeStatus.charAt(0).toUpperCase() + badgeStatus.slice(1)}
    </Badge>
  );
};
