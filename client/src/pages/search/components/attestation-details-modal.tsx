import type React from "react";
import {
  Modal,
  ModalVariant,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  ModalBody,
  ModalFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import type { Attestation } from "../search-context";
import { AttestationStatusBadge } from "./attestation-status-badge";
import { SLSABadge } from "./slsa-badge";

interface IAttestationDetailsModalProps {
  attestations: Attestation[];
  packageName: string;
  packageVersion: string;
  onClose: () => void;
}

export const AttestationDetailsModal: React.FC<
  IAttestationDetailsModalProps
> = ({ attestations, packageName, packageVersion, onClose }) => {
  return (
    <Modal
      variant={ModalVariant.medium}
      title={`Attestations for ${packageName} v${packageVersion}`}
      isOpen={true}
      onClose={onClose}
    >
      <ModalBody>
        <div>
          {attestations.map((attestation, index) => (
            <div key={`${attestation.type}-${index}`}>
              {index > 0 && <Divider style={{ margin: "1.5rem 0" }} />}
              <div style={{ marginBottom: "0.75rem" }}>
                <h3
                  style={{
                    fontSize: "var(--pf-v6-global--FontSize--lg)",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  {attestation.type.charAt(0).toUpperCase() +
                    attestation.type.slice(1)}{" "}
                  Attestation
                </h3>
                <AttestationStatusBadge
                  attestation={attestation}
                  showVerifier={true}
                />
                {attestation.slsaLevel && (
                  <span style={{ marginLeft: "0.5rem" }}>
                    <SLSABadge level={attestation.slsaLevel} />
                  </span>
                )}
              </div>

              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Verifier</DescriptionListTerm>
                  <DescriptionListDescription>
                    {attestation.verifier}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Verified</DescriptionListTerm>
                  <DescriptionListDescription>
                    {new Date(attestation.timestamp).toLocaleString()}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {attestation.buildPlatform && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Platform</DescriptionListTerm>
                    <DescriptionListDescription>
                      {attestation.buildPlatform}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {attestation.subject && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Subject</DescriptionListTerm>
                    <DescriptionListDescription>
                      {attestation.subject}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {attestation.certificateUrl && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Certificate</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        isSmall
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href={attestation.certificateUrl}
                        target="_blank"
                        style={{ padding: 0 }}
                      >
                        View
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {attestation.signatureUrl && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Signature</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        isSmall
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href={attestation.signatureUrl}
                        target="_blank"
                        style={{ padding: 0 }}
                      >
                        View
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
