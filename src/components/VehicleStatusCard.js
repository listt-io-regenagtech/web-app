import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Badge, Space, Typography, Slider, Divider } from "antd";
import { ControlOutlined } from "@ant-design/icons";
import mqtt from "mqtt";
import { brokerUrl, username, password } from "../config/mqttConfig";

const { Text } = Typography;

const VehicleStatusCard = () => {
  const [wheelData, setWheelData] = useState({
    1: { status: "Disconnected", battery: 0, actuatorPosition: 0, lastUpdate: Date.now() },
    2: { status: "Disconnected", battery: 0, actuatorPosition: 0, lastUpdate: Date.now() },
    3: { status: "Disconnected", battery: 0, actuatorPosition: 0, lastUpdate: Date.now() },
    4: { status: "Disconnected", battery: 0, actuatorPosition: 0, lastUpdate: Date.now() }
  });

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, { username, password });
    
    client.on("connect", () => {
      // Subscribe to all wheel topics
      for (let i = 1; i <= 4; i++) {
        client.subscribe([
          `wheel/${i}/status`,
          `wheel/${i}/battery`, 
          `wheel/${i}/actuator`
        ]);
      }
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      const wheelMatch = topic.match(/wheel\/(\d)\/(\w+)/);
      
      if (wheelMatch) {
        const wheelNum = wheelMatch[1];
        const dataType = wheelMatch[2];
        
        setWheelData(prev => ({
          ...prev,
          [wheelNum]: {
            ...prev[wheelNum],
            [dataType === 'status' ? 'status' : 
             dataType === 'battery' ? 'battery' : 'actuatorPosition']: 
             dataType === 'status' ? payload : parseFloat(payload),
            lastUpdate: Date.now()
          }
        }));
      }
    });

    return () => client.end();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setWheelData(prev => {
        const updated = { ...prev };
        for (let i = 1; i <= 4; i++) {
          if (now - updated[i].lastUpdate > 5000) {
            updated[i] = {
              status: "Disconnected",
              battery: 0,
              actuatorPosition: 0,
              lastUpdate: updated[i].lastUpdate
            };
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    const connectedWheels = Object.values(wheelData).filter(wheel => wheel.status === "Connected").length;
    if (connectedWheels === 4) return { status: 'success', text: 'All Systems Online' };
    if (connectedWheels > 0) return { status: 'warning', text: `${connectedWheels}/4 Wheels Connected` };
    return { status: 'error', text: 'System Offline' };
  };

  const overallStatus = getOverallStatus();

  return (
    <Card 
      title={
        <Space>
          <ControlOutlined />
          <Text strong>Vehicle Status</Text>
          <Badge status={overallStatus.status} text={overallStatus.text} />
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map(wheelNum => {
          const wheel = wheelData[wheelNum];
          const batteryColor = wheel.battery > 40 ? '#52c41a' : wheel.battery > 20 ? '#faad14' : '#ff4d4f';
          const statusColor = wheel.status === "Connected" ? 'success' : 'error';
          
          return (
            <Col span={12} key={wheelNum}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>Wheel {wheelNum}</Text>
                  <Badge status={statusColor} text={wheel.status} />
                  
                  <Row gutter={8}>
                    <Col span={12}>
                      <Statistic 
                        title="Battery" 
                        value={wheel.battery} 
                        suffix="V" 
                        precision={1}
                        valueStyle={{ color: batteryColor, fontSize: '14px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Position" 
                        value={wheel.actuatorPosition} 
                        suffix="mm" 
                        precision={1}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                  </Row>
                  
                  <div style={{ width: '100%' }}>
                    <Slider 
                      value={wheel.actuatorPosition} 
                      max={150}
                      disabled
                      size="small"
                      tooltip={{ formatter: (value) => `${value}mm` }}
                    />
                  </div>
                </Space>
              </Card>
              {wheelNum === 2 && <Divider />}
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default VehicleStatusCard;
