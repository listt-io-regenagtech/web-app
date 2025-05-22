import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import VideoStream from "./VideoStream";
import GaugeComponent from "react-gauge-component";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const arcConfig = {
  colorArray: ["#FF0000", "#FFA500", "#FFFF00", "#008000", "#006400"],
  subArcs: [{ limit: 10 }, { limit: 15 }, {}, {}, {}],
  padding: 0.02,
  width: 0.3,
};

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const WheelStatusCard = ({ wheelName, statusTopic, batteryTopic, actuatorTopic }) => {
  const [status, setStatus] = useState("Disconnected");
  const [battery, setBattery] = useState(0);
  const [actuatorPosition, setActuatorPosition] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, { username, password });

    client.on("connect", () => {
      client.subscribe([statusTopic, batteryTopic, actuatorTopic]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      if (topic === statusTopic) setStatus(payload);
      if (topic === batteryTopic) setBattery(parseFloat(payload));
      if (topic === actuatorTopic) setActuatorPosition(parseFloat(payload));
      setLastUpdate(Date.now());
    });

    return () => client.end();
  }, [statusTopic, batteryTopic, actuatorTopic]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastUpdate > 3000) {
        setStatus("Disconnected");
        setBattery(0);
        setActuatorPosition(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div
      style={{
        width: "250px",
        border: "1px solid #ccc",
        borderRadius: "12px",
        padding: "10px",
        backgroundColor: "#fff",
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        <div style={{ width: "60%", display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px", marginLeft: "-70px" }}>
            {wheelName} :
          </div>
          <div style={{ fontWeight: "bold", marginBottom: "2px", marginLeft: "-20px" }}>
            Status: <span style={{ color: status === "Connected" ? "green" : "red" }}>● {status}</span>
          </div>
        </div>
        <div style={{ width: "40%", height: "90px", position: "relative" }}>
          <div style={{ position: "absolute", top: -20, right: 0, width: "130px", height: "120px" }}>
            <GaugeComponent
              value={battery}
              minValue={0}
              maxValue={60}
              type="radial"
              arc={arcConfig}
              pointer={{ elastic: true }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: "bold", marginLeft: "1px" }}>
            Actuator position: {actuatorPosition} mm
          </div>
          <div style={{ margin: "0 4px", fontWeight: "bold" }}>|</div>
          <div style={{ fontWeight: "bold", marginRight: "32px" }}>
            Battery: {battery} V
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "4px", gap: "5px" }}>
          <span style={{ fontSize: "8px" }}>Retracted</span>
          <input
            type="range"
            min="0"
            max="150"
            value={actuatorPosition}
            readOnly
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "8px" }}>Extended</span>
        </div>
      </div>
    </div>
  );
};

const brokerUrl = process.env.REACT_APP_MQTT_BROKER;
const username = process.env.REACT_APP_MQTT_USERNAME;
const password = process.env.REACT_APP_MQTT_PASSWORD;
const commandTopic = process.env.REACT_APP_MQTT_TOPIC || "rpi/buttons";
const gpsTopic = process.env.REACT_APP_GPS_TOPIC || "rpi/gps";


const buttonConfig = {
  F: { label: "⬆️ Forward", message: "F_ON", style: { gridColumn: "2" } },
  L: { label: "⬅️ Left", message: "L_ON", style: { gridColumn: "1" } },
  R: { label: "➡️ Right", message: "R_ON", style: { gridColumn: "3" } },
  B: { label: "⬇️ Backward", message: "B_ON", style: { gridColumn: "2" } },
  S: { label: "Stop", message: "S_ON", style: { gridColumn: "1 / span 3" } },
};

const ControlPage = () => {
  const [status, setStatus] = useState("🔴 Disconnected");
  const [client, setClient] = useState(null);
  const [intervals, setIntervals] = useState({});
  const [activeButton, setActiveButton] = useState(null);
  const [controlEnabled, setControlEnabled] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: 52.720046, lng: 0.092452 });

  useEffect(() => {
    const ts = localStorage.getItem("refreshTimestamp");
    if (ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed < 5000) {
        setRefreshDisabled(true);
        setTimeout(() => {
          setRefreshDisabled(false);
          localStorage.removeItem("refreshTimestamp");
        }, 5000 - elapsed);
      } else {
        localStorage.removeItem("refreshTimestamp");
      }
    }
  }, []);

  useEffect(() => {
    const newClient = mqtt.connect(brokerUrl, { username, password });
    newClient.on("connect", () => {
      setStatus("🟢 Connected");
      newClient.subscribe(gpsTopic);
    });
    newClient.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
      setStatus("🔴 Disconnected");
    });
    newClient.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (topic === gpsTopic) {
          setGpsLocation(payload);
        }
      } catch (err) {
        console.error("Error parsing MQTT message:", err);
      }
    });
    setClient(newClient);
    return () => newClient.end();
  }, []);

  const handleRefreshVideo = () => {
    if (refreshDisabled) return;
    setRefreshDisabled(true);
    localStorage.setItem("refreshTimestamp", Date.now().toString());
    window.location.reload();
    setTimeout(() => setRefreshDisabled(false), 5000);
  };

  const handleToggleControl = () => {
    setControlEnabled((prev) => !prev);
  };

  const startPublishing = (key) => {
    if (!controlEnabled || !client || !client.connected) return;
    setActiveButton(key);
    const interval = setInterval(() => {
      client.publish(commandTopic, buttonConfig[key].message);
    }, 200);
    setIntervals((prev) => ({ ...prev, [key]: interval }));
  };

  const stopPublishing = (key) => {
    setActiveButton(null);
    if (intervals[key]) {
      clearInterval(intervals[key]);
      setIntervals((prev) => {
        const newIntervals = { ...prev };
        delete newIntervals[key];
        return newIntervals;
      });
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[1, 2, 3, 4].map((num) => (
            <WheelStatusCard
              key={num}
              wheelName={`Wheel ${num}`}
              statusTopic={`wheel/${num}/status`}
              batteryTopic={`wheel/${num}/battery`}
              actuatorTopic={`wheel/${num}/actuator`}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "30px", marginBottom: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <h2>Live Video Feed</h2>
              <VideoStream key={videoKey} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2>Live GPS Location</h2>
              <MapContainer center={[gpsLocation.lat, gpsLocation.lng]} zoom={18} style={{ width: "560px", height: "315px" }} scrollWheelZoom={true}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" />
                <RecenterMap lat={gpsLocation.lat} lng={gpsLocation.lng} />
                <Marker position={[gpsLocation.lat, gpsLocation.lng]}>
                  <Popup>{gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "10px", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "250px" }}>
            <button
              onClick={handleRefreshVideo}
              disabled={refreshDisabled}
              style={{ backgroundColor: "#bdc3c7", color: "#333", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: refreshDisabled ? "not-allowed" : "pointer", transition: "transform 0.1s" }}
            >
              Refresh Stream
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "16px" }}>Control</label>
              <label className="switch" style={{ transform: "scale(1.3)" }}>
                <input type="checkbox" checked={controlEnabled} onChange={handleToggleControl} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div style={{ textAlign: "center", width: "100%" }}>
            <h3>Control Buttons</h3>
            <p>Status: {status}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxWidth: "300px", margin: "0 auto" }}>
              {Object.entries(buttonConfig).map(([key, { label, style }]) => (
                <button
                  key={key}
                  onMouseDown={() => startPublishing(key)}
                  onMouseUp={() => stopPublishing(key)}
                  onMouseLeave={() => stopPublishing(key)}
                  onTouchStart={(e) => { e.preventDefault(); startPublishing(key); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopPublishing(key); }}
                  style={{
                    padding: "15px",
                    borderRadius: "10px",
                    fontSize: "16px",
                    cursor: "pointer",
                    backgroundColor: key === "S" ? "#e74c3c" : key === "F" || key === "B" ? "#2ecc71" : "#3498db",
                    color: "white",
                    border: "none",
                    gridColumn: style.gridColumn,
                    transition: "transform 0.1s ease, opacity 0.1s ease",
                    transform: activeButton === key ? "scale(1.1)" : "scale(1)",
                    opacity: activeButton === key ? 0.8 : 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPage;

