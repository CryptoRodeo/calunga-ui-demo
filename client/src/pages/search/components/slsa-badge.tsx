import type React from "react";
import { Label, Tooltip } from "@patternfly/react-core";
import { StarIcon } from "@patternfly/react-icons";

interface ISLSABadgeProps {
  level: number;
  isCompact?: boolean;
}

const SLSA_DESCRIPTIONS: Record<number, string> = {
  1: "SLSA Level 1: Basic source provenance and build process documentation",
  2: "SLSA Level 2: Source control integration with provenance generation",
  3: "SLSA Level 3: Hardened build platform with non-falsifiable provenance",
  4: "SLSA Level 4: Highest security with two-party review and hermetic builds",
};

const SLSA_COLORS: Record<number, "grey" | "blue" | "green" | "gold"> = {
  1: "grey",
  2: "blue",
  3: "green",
  4: "gold",
};

export const SLSABadge: React.FC<ISLSABadgeProps> = ({
  level,
  isCompact = false,
}) => {
  if (level < 1 || level > 4) {
    return null;
  }

  const stars = Array.from({ length: 4 }, (_, i) => i < level);
  const color = SLSA_COLORS[level];
  const description = SLSA_DESCRIPTIONS[level];

  const badge = (
    <Label color={color} isCompact={isCompact}>
      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <span>SLSA L{level}</span>
        {!isCompact && (
          <span style={{ display: "inline-flex", gap: "0.125rem" }}>
            {stars.map((filled, idx) => (
              <StarIcon
                key={`star-${idx}-${filled ? "filled" : "empty"}`}
                style={{
                  fontSize: "0.75rem",
                  opacity: filled ? 1 : 0.3,
                }}
              />
            ))}
          </span>
        )}
      </span>
    </Label>
  );

  return (
    <Tooltip content={description} position="top">
      {badge}
    </Tooltip>
  );
};
