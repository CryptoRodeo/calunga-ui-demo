import React from "react";

import {
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from "@patternfly/react-table";

import {
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";

import {
  PythonWheelsContext,
  PythonWheelsProvider,
} from "./python-wheels-context";
import { PythonWheelsToolbar } from "./python-wheels-toolbar";

const PythonWheelsContent: React.FC = () => {
  const { tableControls } = React.useContext(PythonWheelsContext);

  const {
    numRenderedColumns,
    currentPageItems,
    propHelpers: {
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1">Python Wheels</Title>
      </PageSection>
      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v6-global--BackgroundColor--100)",
          }}
        >
          <PythonWheelsToolbar />
          <Table {...tableProps} aria-label="Python Wheels table">
            <Tbody>
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "wheel" })} />
                    <Th {...getThProps({ columnKey: "version" })} />
                    <Th {...getThProps({ columnKey: "abi" })} />
                    <Th {...getThProps({ columnKey: "platform" })} />
                    <Th {...getThProps({ columnKey: "license" })} />
                    <Th {...getThProps({ columnKey: "published" })} />
                    <Th {...getThProps({ columnKey: "sourceIndex" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              {currentPageItems.length === 0 ? (
                <Tr>
                  <Td colSpan={numRenderedColumns}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "var(--pf-v6-global--Color--200)",
                      }}
                    >
                      No Python wheels found
                    </div>
                  </Td>
                </Tr>
              ) : (
                currentPageItems.map((item, rowIndex) => {
                  return (
                    <Tbody key={item.id}>
                      <Tr {...getTrProps({ item })}>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={item}
                          rowIndex={rowIndex}
                        >
                          <Td {...getTdProps({ columnKey: "wheel" })}>
                            {item.wheel}
                          </Td>
                          <Td {...getTdProps({ columnKey: "version" })}>
                            {item.version}
                          </Td>
                          <Td {...getTdProps({ columnKey: "abi" })}>
                            {item.abi}
                          </Td>
                          <Td {...getTdProps({ columnKey: "platform" })}>
                            {item.platform}
                          </Td>
                          <Td {...getTdProps({ columnKey: "license" })}>
                            {item.license}
                          </Td>
                          <Td {...getTdProps({ columnKey: "published" })}>
                            {item.published}
                          </Td>
                          <Td {...getTdProps({ columnKey: "sourceIndex" })}>
                            {item.sourceIndex}
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                      {isCellExpanded(item) && item.description && (
                        <Tr isExpanded>
                          <Td colSpan={numRenderedColumns}>
                            <ExpandableRowContent>
                              {item.description}
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>
      </PageSection>
    </>
  );
};

export const PythonWheels: React.FC = () => {
  return (
    <PythonWheelsProvider>
      <PythonWheelsContent />
    </PythonWheelsProvider>
  );
};
