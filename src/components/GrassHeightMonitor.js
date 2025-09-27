import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Space, Typography, Alert, Badge } from "antd";
import { DisconnectOutlined, CheckCircleOutlined } from "@ant-design/icons";
import mqtt from "mqtt";
import { brokerUrl, username, password, grassHeightTopic } from "../config/mqttConfig";

const { Text } = Typography;

const GrassHeightMonitor = () => {
  const [grassHeight, setGrassHeight] = useState(null); // null = no data yet
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sensorConnected, setSensorConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, { username, password });
    
    client.on("connect", () => {
      client.subscribe(grassHeightTopic);
    });

    client.on("message", (topic, message) => {
      if (topic === grassHeightTopic) {
        const height = parseFloat(message.toString());
        if (!isNaN(height) && height >= 0) { // Remove 1m limit
          setGrassHeight(height);
          setLastUpdate(Date.now());
          setSensorConnected(true);
        }
      }
    });

    return () => client.end();
  }, []);

  // Check sensor connection timeout
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate && Date.now() - lastUpdate > 10000) { // 10 second timeout
        setSensorConnected(false);
        setGrassHeight(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getGrassVisualization = (height) => {
    if (!height && height !== 0) return null;
    
    const heightCm = Math.round(height * 100);
    
    // Determine grass level (1-5) based on height
    let grassLevel = 1; // Bare/Overgrazed
    if (heightCm > 5) grassLevel = 2;      // Short
    if (heightCm > 15) grassLevel = 3;     // Medium  
    if (heightCm > 35) grassLevel = 4;     // Tall
    if (heightCm > 60) grassLevel = 5;     // Very Tall
    
    const getLevelName = (level) => {
      switch(level) {
        case 1: return 'Bare/Overgrazed';
        case 2: return 'Short Grass';
        case 3: return 'Medium Grass';
        case 4: return 'Tall Grass';
        case 5: return 'Very Tall';
        default: return 'Unknown';
      }
    };

    return (
      <div style={{ 
        position: 'relative', 
        height: '200px', 
        width: '100%',
        border: '2px solid #d9d9d9',
        borderRadius: '8px',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Grass level image */}
        <img 
          src={`/web-app/images/grass/level-${grassLevel}.png`}
          alt={`Grass Level ${grassLevel}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '6px'
          }}
          onError={(e) => {
            // Fallback if image doesn't exist
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        
        {/* Fallback content if image not found */}
        <div style={{
          display: 'none',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666',
          background: '#f0f0f0'
        }}>
          <Text>🌱</Text>
          <Text style={{ fontSize: 12 }}>Level {grassLevel}</Text>
          <Text style={{ fontSize: 10 }}>{getLevelName(grassLevel)}</Text>
        </div>
        
        {/* Height indicator overlay */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {heightCm}cm
        </div>
        
        {/* Grass level indicator */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          background: 'rgba(255,255,255,0.9)',
          color: '#333',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          Level {grassLevel}
        </div>
      </div>
    );
  };

  const getGrassStatus = (height) => {
    if (!height && height !== 0) return { text: 'No Data', color: 'default' };
    
    const heightCm = Math.round(height * 100);
    if (heightCm < 5) return { text: 'Overgrazed - Move Animals!', color: 'error' };
    if (heightCm < 10) return { text: 'Low Grass - Move Soon', color: 'warning' };
    if (heightCm < 25) return { text: 'Good Grazing Height', color: 'success' };
    if (heightCm < 40) return { text: 'Excellent Growth', color: 'success' };
    if (heightCm < 80) return { text: 'Ready for Grazing', color: 'success' };
    if (heightCm < 150) return { text: 'Very Tall - Perfect for Grazing', color: 'success' };
    return { text: 'Extremely Tall Grass', color: 'warning' };
  };

  const heightCm = grassHeight ? Math.round(grassHeight * 100) : 0;
  const grassStatus = getGrassStatus(grassHeight);

  if (!sensorConnected) {
    return (
      <Card 
        title={
          <Space>
            <span style={{ fontSize: '16px' }}>🌱</span>
            <Text strong>Grass Height Monitor</Text>
            <Badge status="error" text="Disconnected" />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#999'
        }}>
          <DisconnectOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>
            <Text strong style={{ fontSize: 16, color: '#999' }}>
              Sensor Not Connected
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Check sensor connection and MQTT broker
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <span style={{ fontSize: '16px' }}>🌱</span>
          <Text strong>Grass Height Monitor</Text>
          <Badge status="success" text="Connected" />
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16} align="top">
        <Col span={10}>
          {getGrassVisualization(grassHeight)}
        </Col>
        <Col span={14}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Statistic 
              title="Height" 
              value={heightCm} 
              suffix="cm"
              valueStyle={{ 
                color: grassStatus.color === 'success' ? '#52c41a' :
                       grassStatus.color === 'warning' ? '#faad14' : '#ff4d4f'
              }}
            />
            
            <Badge 
              status={grassStatus.color} 
              text={grassStatus.text}
              style={{ fontSize: 12 }}
            />
            
            {lastUpdate && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
              </Text>
            )}
          </Space>
        </Col>
      </Row>
      
      {heightCm < 10 && heightCm > 0 && (
        <Alert
          message="Move Animals Required"
          description={`Grass height (${heightCm}cm) is too low. Animals have overgrazed this area. Move fence to allow grass recovery.`}
          type={heightCm < 5 ? "error" : "warning"}
          showIcon
          style={{ marginTop: 16 }}
          closable
        />
      )}
    </Card>
  );
};

export default GrassHeightMonitor;
