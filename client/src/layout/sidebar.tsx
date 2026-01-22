import type React from "react";
import { NavLink } from "react-router-dom";
import {
  Nav,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import nav from "@patternfly/react-styles/css/components/Nav/nav";

import { Paths } from "../Routes";

const LINK_CLASS = nav.navLink;
const ACTIVE_LINK_CLASS = nav.modifiers.current;

export const SidebarApp: React.FC = () => {
  const renderPageNav = () => {
    return (
      <Nav id="nav-sidbar" aria-label="nav-sidebar">
        <NavList>
          <li className={nav.navItem}>
            <NavLink
              to={Paths.pythonWheels}
              className={({ isActive }) => {
                return css(LINK_CLASS, isActive ? ACTIVE_LINK_CLASS : "");
              }}
            >
              Python Wheels
            </NavLink>
          </li>
        </NavList>
      </Nav>
    );
  };

  return (
    <PageSidebar>
      <PageSidebarBody>{renderPageNav()}</PageSidebarBody>
    </PageSidebar>
  );
};
