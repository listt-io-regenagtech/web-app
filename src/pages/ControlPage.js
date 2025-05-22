// src/pages/ControlPage.js
import React, { useState } from "react";
import MqttPublisher from "../components/MqttPublisher";

function ControlPage() {
  // If you had extra states or logic in the old App.js, put them here
  const [activeButton, setActiveButton] = useState(null);

  const handlePress = (button, message) => {
    console.log(`Pressed: ${button}, Sending MQTT Message: ${message}`);
    setActiveButton(button);
    // Add MQTT publishing logic here if required
  };

  const handleRelease = (button, message) => {
    console.log(`Released: ${button}, Sending MQTT Message: ${message}`);
    setActiveButton(null);
    // Add MQTT publishing logic here if required
  };

  return (
    <div>
      <h1>SmartPasture Control Panel</h1>
      {/* Place your MqttPublisher or any other relevant UI */}
      <MqttPublisher
        handlePress={handlePress}
        handleRelease={handleRelease}
        activeButton={activeButton}
      />
    </div>
  );
}

export default ControlPage;

