import React from "react";
import { Card } from "antd";
import Report from "../components/Report";
import { brandConfig } from "../config/brandConfig";

function ReportPage() {
  return (
    <div style={{ background: brandConfig.colors.background, minHeight: '100vh', padding: '24px' }}>
      <Card 
        title="📊 Mission Reports & Data Analysis"
        style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          borderRadius: brandConfig.antdTheme.token.borderRadius
        }}
      >
        <Report />
      </Card>
    </div>
  );
}

export default ReportPage;
