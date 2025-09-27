// src/pages/MissionPage.js
import React from "react";
import { Card } from "antd";
import ModernGridGenerator from "../components/ModernGridGenerator";
import { brandConfig } from "../config/brandConfig";

function MissionPage() {
  return (
    <div style={{ background: brandConfig.colors.background, minHeight: '100vh', padding: '24px' }}>
      <Card 
        title="🗺️ Mission Setup & Grid Generation"
        style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          borderRadius: brandConfig.antdTheme.token.borderRadius
        }}
      >
        <ModernGridGenerator />
      </Card>
    </div>
  );
}

export default MissionPage;
