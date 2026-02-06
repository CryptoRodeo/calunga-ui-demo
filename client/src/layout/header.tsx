import type React from "react";
import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Split,
  SplitItem,
  Title,
} from "@patternfly/react-core";

import BarsIcon from "@patternfly/react-icons/dist/js/icons/bars-icon";

import useBranding from "@app/hooks/useBranding";
import "./header.css";

export const HeaderApp: React.FC = () => {
  const {
    masthead: { leftBrand, leftTitle },
  } = useBranding();

  return (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Global navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand data-codemods>
          <MastheadLogo data-codemods>
            {leftBrand ? (
              <Brand
                src={leftBrand.src}
                alt={leftBrand.alt}
                heights={{ default: leftBrand.height }}
                style={{
                  height: "60px",
                  width: "auto",
                  transform: "translateX(0px) scale(1.35)",
                  transformOrigin: "left top",
                }}
              />
            ) : null}
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );
};
