import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import GaugeComponent from "react-gauge-component";

const arcConfig = {
  colorArray: ["#FF0000", "#FFA500", "#FFFF00", "#008000", "#006400"],
  subArcs: [{ limit: 10 }, { limit: 30 }, {}, {}, {}],
  padding: 0.02,
  width: 0.3,
};

const WheelCard = ({ wheelId, mqttClient }) => {
  const [status, setStatus] = useState("disconnected");
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (!mqttClient || !mqttClient.connected) return;

    const statusTopic = `wheel${wheelId}/status`;
    const actuatorTopic = `wheel${wheelId}/actuator`;

    const handleMessage = (topic, message) => {
      if (topic === statusTopic) {
        setStatus(message.toString().toLowerCase());
      }
      if (topic === actuatorTopic) {
        const val = parseFloat(message.toString());
        if (!isNaN(val)) setPosition(Math.max(0, Math.min(150, val)));
      }
    };

    mqttClient.subscribe(statusTopic);
    mqttClient.subscribe(actuatorTopic);
    mqttClient.on("message", handleMessage);

    return () => {
      mqttClient.unsubscribe(statusTopic);
      mqttClient.unsubscribe(actuatorTopic);
      mqttClient.removeListener("message", handleMessage);
    };
  }, [mqttClient, wheelId]);

  return (
    <div style={{
      border: "2px solid #ccc",
      borderRadius: "15px",
      padding: "15px",
      marginBottom: "20px",
      width: "330px",
      boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff"
    }}>
      {/* Left side: status and progress bar */}
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: "5px" }}>Wheel {wheelId} :</h3>
        <p>
          Status:{" "}
          <span style={{
            color: status === "connected" ? "green" : "red",
            fontWeight: "bold"
          }}>
            ● {status === "connected" ? "Connected" : "Disconnected"}
          </span>
        </p>
        <p style={{ marginBottom: "4px" }}>Actuator position</p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px" }}>Retracted</span>
          <input
            type="range"
            min="0"
            max="150"
            value={position}
            readOnly
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "12px" }}>Extended</span>
        </div>
        <p style={{ fontSize: "13px", textAlign: "center", marginTop: "5px" }}>
          {position.toFixed(0)} mm
        </p>
      </div>

      {/* Right side: Gauge */}
      <div style={{ width: "120px", height: "120px", marginLeft: "15px" }}>
        <GaugeComponent
          value={position}
          type="radial"
          arc={arcConfig}
          pointer={{ elastic: true, animationDelay: 0 }}
        />
      </div>
    </div>
  );
};

export default WheelCard;

