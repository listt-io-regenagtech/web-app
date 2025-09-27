import React, { useState, useEffect } from "react";
import { Layout, Card, Row, Col, Button, Typography, Statistic } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import mqtt from "mqtt";

// Import modularized components
import VehicleStatusCard from "./VehicleStatusCard";
import GrassHeightMonitor from "./GrassHeightMonitor";
import ControlButtons from "./ControlButtons";
import RecenterMap from "./RecenterMap";
import VideoStream from "./VideoStream";

// Import configuration
import { 
  brokerUrl, 
  username, 
  password, 
  gpsTopic, 
  environmentalTopic,
  leafletConfig 
} from "../config/mqttConfig";
import { brandConfig } from "../config/brandConfig";

// Import leaflet marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const { Header, Content } = Layout;
const { Title } = Typography;

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ModernControlPage = () => {
  const [videoKey, setVideoKey] = useState(0);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(leafletConfig.defaultCenter);
  const [envData, setEnvData] = useState({ temperature: 0, humidity: 0, pressure: 0 });

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, { username, password });
    
    client.on("connect", () => {
      client.subscribe([gpsTopic, environmentalTopic]);
    });
    
    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (topic === gpsTopic) {
          setGpsLocation(payload);
        }
        if (topic === environmentalTopic) {
          setEnvData(payload);
        }
      } catch (err) {
        console.error("Error parsing MQTT message:", err);
      }
    });

    return () => client.end();
  }, []);

  const handleRefreshVideo = () => {
    if (refreshDisabled) return;
    setRefreshDisabled(true);
    setVideoKey(prev => prev + 1);
    setTimeout(() => setRefreshDisabled(false), 5000);
  };

  return (
    <div style={{ background: brandConfig.colors.background, minHeight: '100vh' }}>
      <div style={{ padding: '24px 24px 0 24px', textAlign: 'right' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefreshVideo}
          disabled={refreshDisabled}
          type="primary"
          style={{ 
            ...brandConfig.buttonStyle,
            backgroundColor: brandConfig.colors.primary,
            borderColor: brandConfig.colors.primary
          }}
        >
          Refresh Stream
        </Button>
      </div>

      <div style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          {/* Left Column - GPS Map above Vehicle Status */}
          <Col xs={24} lg={6}>
            <Row gutter={[0, 24]}>
              <Col span={24}>
                <Card title="📍 GPS Location" size="small">
                  <MapContainer 
                    center={[gpsLocation.lat, gpsLocation.lng]} 
                    zoom={leafletConfig.defaultZoom} 
                    style={{ width: "100%", height: "200px" }} 
                    scrollWheelZoom={true}
                  >
                    <TileLayer 
                      url={leafletConfig.tileLayerUrl} 
                      attribution={leafletConfig.attribution} 
                    />
                    <RecenterMap lat={gpsLocation.lat} lng={gpsLocation.lng} />
                    <Marker position={[gpsLocation.lat, gpsLocation.lng]}>
                      <Popup>
                        {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </Card>
              </Col>
              
              <Col span={24}>
                <VehicleStatusCard />
              </Col>
            </Row>
          </Col>

          {/* Middle Column - Video Feed + Controls */}
          <Col xs={24} lg={12}>
            <Card title="📹 Live Video Feed & Controls">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 16,
                background: '#000',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <VideoStream key={videoKey} />
              </div>
              <ControlButtons />
            </Card>
          </Col>

          {/* Right Column - Grass Height and Environmental Data */}
          <Col xs={24} lg={6}>
            <Row gutter={[0, 24]}>
              <Col span={24}>
                <GrassHeightMonitor />
              </Col>
              
              <Col span={24}>
                <Card title="🌡️ Environmental Data">
                  <Row gutter={16}>
                    <Col span={24}>
                      <Statistic 
                        title="Temperature" 
                        value={envData.temperature} 
                        suffix="°C" 
                        precision={1}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Humidity" 
                        value={envData.humidity} 
                        suffix="%" 
                        precision={1}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Pressure" 
                        value={envData.pressure} 
                        suffix="hPa" 
                        precision={0}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ModernControlPage;
