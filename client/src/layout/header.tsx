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
            <Split>
              <SplitItem>
                {leftBrand ? (
                  <Brand src={leftBrand.src} alt={leftBrand.alt} heights={{ default: leftBrand.height }} />
                ) : null}
              </SplitItem>
              <SplitItem isFilled>
                {leftTitle ? (
                  <Title
                    className="logo-pointer"
                    headingLevel={leftTitle?.heading ?? "h1"}
                    size={leftTitle?.size ?? "2xl"}
                  >
                    {leftTitle.text}
                  </Title>
                ) : null}
              </SplitItem>
            </Split>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );
};
