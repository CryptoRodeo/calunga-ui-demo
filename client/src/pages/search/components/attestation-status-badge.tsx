import type React from "react";
import { Label, Tooltip } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  QuestionCircleIcon,
} from "@patternfly/react-icons";
import type { Attestation } from "../search-context";

interface IAttestationStatusBadgeProps {
  attestation: Attestation;
  showVerifier?: boolean;
  isCompact?: boolean;
}

const STATUS_CONFIG = {
  verified: {
    color: "green" as const,
    icon: CheckCircleIcon,
    label: "Verified",
  },
  failed: {
    color: "red" as const,
    icon: ExclamationCircleIcon,
    label: "Failed",
  },
  unverified: {
    color: "grey" as const,
    icon: QuestionCircleIcon,
    label: "Unverified",
  },
};

export const AttestationStatusBadge: React.FC<IAttestationStatusBadgeProps> = ({
  attestation,
  showVerifier = true,
  isCompact = false,
}) => {
  const config = STATUS_CONFIG[attestation.status];
  const Icon = config.icon;

  const label = showVerifier
    ? `${attestation.verifier} - ${config.label}`
    : config.label;

  const tooltipContent = (
    <div>
      <div>
        <strong>{attestation.type}</strong> attestation
      </div>
      <div>Verifier: {attestation.verifier}</div>
      <div>Status: {config.label}</div>
      <div>Timestamp: {new Date(attestation.timestamp).toLocaleString()}</div>
      {attestation.validUntil && (
        <div>
          Valid until: {new Date(attestation.validUntil).toLocaleString()}
        </div>
      )}
    </div>
  );

  const badge = (
    <Label color={config.color} isCompact={isCompact} icon={<Icon />}>
      {label}
    </Label>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      {badge}
    </Tooltip>
  );
};
