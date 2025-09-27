import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Badge, Space, Typography, Slider } from "antd";
import { ControlOutlined } from "@ant-design/icons";
import mqtt from "mqtt";
import { brokerUrl, username, password } from "../config/mqttConfig";

const { Text } = Typography;

const WheelStatusCard = ({ wheelNumber }) => {
  const [status, setStatus] = useState("Disconnected");
  const [battery, setBattery] = useState(0);
  const [actuatorPosition, setActuatorPosition] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, { username, password });
    
    client.on("connect", () => {
      client.subscribe([
        `wheel/${wheelNumber}/status`,
        `wheel/${wheelNumber}/battery`, 
        `wheel/${wheelNumber}/actuator`
      ]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      
      if (topic === `wheel/${wheelNumber}/status`) setStatus(payload);
      if (topic === `wheel/${wheelNumber}/battery`) setBattery(parseFloat(payload));
      if (topic === `wheel/${wheelNumber}/actuator`) setActuatorPosition(parseFloat(payload));
      
      setLastUpdate(Date.now());
    });

    return () => client.end();
  }, [wheelNumber, brokerUrl, username, password]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastUpdate > 5000) {
        setStatus("Disconnected");
        setBattery(0);
        setActuatorPosition(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const batteryColor = battery > 40 ? '#52c41a' : battery > 20 ? '#faad14' : '#ff4d4f';
  const statusColor = status === "Connected" ? 'success' : 'error';

  return (
    <Card 
      size="small" 
      title={
        <Space>
          <ControlOutlined />
          <Text strong>Wheel {wheelNumber}</Text>
          <Badge status={statusColor} text={status} />
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Statistic 
            title="Battery" 
            value={battery} 
            suffix="V" 
            precision={1}
            valueStyle={{ color: batteryColor }}
          />
        </Col>
        <Col span={12}>
          <Statistic 
            title="Position" 
            value={actuatorPosition} 
            suffix="mm" 
            precision={1}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Actuator Position</Text>
        <Slider 
          value={actuatorPosition} 
          max={150}
          disabled
          tooltip={{ formatter: (value) => `${value}mm` }}
        />
        <Row justify="space-between">
          <Text type="secondary" style={{ fontSize: 10 }}>Retracted</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>Extended</Text>
        </Row>
      </div>
    </Card>
  );
};

export default WheelStatusCard;
