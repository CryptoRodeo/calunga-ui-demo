import type React from "react";

export const PackageDetailMinimal: React.FC = () => {
  console.log("PackageDetailMinimal rendered");

  return (
    <div style={{ padding: "2rem", backgroundColor: "#e8f5e8" }}>
      <h1>🎉 SUCCESS: Minimal Package Detail Loaded!</h1>
      <p>If you can see this, the routing is working.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
};
