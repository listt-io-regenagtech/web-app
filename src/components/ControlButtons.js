import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Row, Col, Space, Typography, Switch, Badge, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  StopOutlined,
  ControlOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import mqtt from "mqtt";
import { brokerUrl, username, password, commandTopic } from "../config/mqttConfig";
import { brandConfig } from "../config/brandConfig";

const { Text } = Typography;

const ControlButtons = () => {
  const [client, setClient] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [controlEnabled, setControlEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("🔴 Disconnected");
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const cardRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const newClient = mqtt.connect(brokerUrl, { username, password });
    
    newClient.on("connect", () => {
      setConnectionStatus("🟢 Connected");
    });
    
    newClient.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
      setConnectionStatus("🔴 Disconnected");
    });
    
    setClient(newClient);
    return () => newClient.end();
  }, []);

  // Keyboard control
  useEffect(() => {
    if (!keyboardEnabled || !controlEnabled) return;

    const handleKeyDown = (e) => {
      if (!controlEnabled || !client || !client.connected || e.repeat) return;
      
      let key = null;
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          key = 'F';
          break;
        case 's':
        case 'arrowdown':
          key = 'B';
          break;
        case 'a':
        case 'arrowleft':
          key = 'L';
          break;
        case 'd':
        case 'arrowright':
          key = 'R';
          break;
        case ' ':
        case 'escape':
          key = 'S';
          e.preventDefault();
          break;
      }
      
      if (key && activeButton !== key) {
        setActiveButton(key);
        
        // Clear any existing interval first
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Send initial command
        client.publish(commandTopic, `${key}_ON`);
        
        // Set up interval for continuous sending (same as mouse)
        intervalRef.current = setInterval(() => {
          if (client && client.connected) {
            client.publish(commandTopic, `${key}_ON`);
          }
        }, 200);
      }
    };

    const handleKeyUp = (e) => {
      setActiveButton(null);
      
      // Clear the continuous sending interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (keyboardEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardEnabled, controlEnabled, client, activeButton, commandTopic]);

  const buttonConfig = [
    { key: 'F', label: 'Forward', message: 'F_ON', icon: <ArrowUpOutlined />, type: 'primary' },
    { key: 'L', label: 'Left', message: 'L_ON', icon: <ArrowLeftOutlined />, type: 'default' },
    { key: 'R', label: 'Right', message: 'R_ON', icon: <ArrowRightOutlined />, type: 'default' },
    { key: 'B', label: 'Backward', message: 'B_ON', icon: <ArrowDownOutlined />, type: 'primary' },
    { key: 'S', label: 'STOP', message: 'S_ON', icon: <StopOutlined />, type: 'primary', danger: true }
  ];

  const startPublishing = (config) => {
    if (!controlEnabled || !client || !client.connected) return;
    setActiveButton(config.key);
    
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Send initial command
    client.publish(commandTopic, config.message);
    
    // Set up interval for continuous sending
    intervalRef.current = setInterval(() => {
      if (client && client.connected) {
        client.publish(commandTopic, config.message);
      }
    }, 200); // Send every 200ms while button held
  };

  const stopPublishing = () => {
    setActiveButton(null);
    
    // Clear the continuous sending interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <Card 
      ref={cardRef}
      title={
        <Space>
          <ControlOutlined />
          <Text strong>Vehicle Control</Text>
          <Badge 
            status={connectionStatus.includes("Connected") ? "success" : "error"} 
            text={connectionStatus}
          />
        </Space>
      }
      style={{ border: keyboardEnabled ? `2px solid ${brandConfig.colors.primary}` : undefined }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row justify="center" gutter={16}>
          <Col>
            <Space>
              <Text>Control System:</Text>
              <Switch 
                checked={controlEnabled} 
                onChange={setControlEnabled}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </Space>
          </Col>
          <Col>
            <Tooltip title="Use WASD or Arrow Keys + Spacebar for STOP">
              <Space>
                <Text>Keyboard:</Text>
                <Switch
                  checked={keyboardEnabled}
                  onChange={setKeyboardEnabled}
                  checkedChildren={<ThunderboltOutlined />}
                  unCheckedChildren="OFF"
                  disabled={!controlEnabled}
                />
              </Space>
            </Tooltip>
          </Col>
        </Row>

        <Row gutter={[12, 12]} justify="center">
          {/* Forward Button */}
          <Col span={24} style={{ textAlign: 'center' }}>
            <Button
              type={buttonConfig[0].type}
              size="large"
              loading={activeButton === 'F'}
              disabled={!controlEnabled}
              onMouseDown={() => startPublishing(buttonConfig[0])}
              onMouseUp={stopPublishing}
              onMouseLeave={stopPublishing}
              icon={buttonConfig[0].icon}
              style={ !controlEnabled ? 
                {...brandConfig.disabledButtonStyle, minWidth: 120} :
                {
                  ...brandConfig.buttonStyle,
                  minWidth: 120,
                  backgroundColor: brandConfig.colors.primary,
                  borderColor: brandConfig.colors.primary
                }
              }
            >
              {buttonConfig[0].label}
            </Button>
          </Col>
          
          {/* Left - Stop - Right Row */}
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button
              type={buttonConfig[1].type}
              size="large"
              loading={activeButton === 'L'}
              disabled={!controlEnabled}
              onMouseDown={() => startPublishing(buttonConfig[1])}
              onMouseUp={stopPublishing}
              onMouseLeave={stopPublishing}
              icon={buttonConfig[1].icon}
              style={ !controlEnabled ? 
                {...brandConfig.disabledButtonStyle, minWidth: 80} :
                {
                  ...brandConfig.buttonStyle,
                  minWidth: 80,
                  borderColor: brandConfig.colors.primary,
                  color: brandConfig.colors.primary
                }
              }
            >
              {buttonConfig[1].label}
            </Button>
          </Col>
          
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              danger={buttonConfig[4].danger}
              size="large"
              loading={activeButton === 'S'}
              disabled={!controlEnabled}
              onMouseDown={() => startPublishing(buttonConfig[4])}
              onMouseUp={stopPublishing}
              onMouseLeave={stopPublishing}
              icon={buttonConfig[4].icon}
              style={ !controlEnabled ? 
                {...brandConfig.disabledButtonStyle, minWidth: 80} :
                {
                  ...brandConfig.buttonStyle,
                  minWidth: 80,
                  backgroundColor: brandConfig.colors.status.error,
                  borderColor: brandConfig.colors.status.error
                }
              }
            >
              {buttonConfig[4].label}
            </Button>
          </Col>
          
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button
              type={buttonConfig[2].type}
              size="large"
              loading={activeButton === 'R'}
              disabled={!controlEnabled}
              onMouseDown={() => startPublishing(buttonConfig[2])}
              onMouseUp={stopPublishing}
              onMouseLeave={stopPublishing}
              icon={buttonConfig[2].icon}
              style={ !controlEnabled ? 
                {...brandConfig.disabledButtonStyle, minWidth: 80} :
                {
                  ...brandConfig.buttonStyle,
                  minWidth: 80,
                  borderColor: brandConfig.colors.primary,
                  color: brandConfig.colors.primary
                }
              }
            >
              {buttonConfig[2].label}
            </Button>
          </Col>
          
          {/* Backward Button */}
          <Col span={24} style={{ textAlign: 'center' }}>
            <Button
              type={buttonConfig[3].type}
              size="large"
              loading={activeButton === 'B'}
              disabled={!controlEnabled}
              onMouseDown={() => startPublishing(buttonConfig[3])}
              onMouseUp={stopPublishing}
              onMouseLeave={stopPublishing}
              icon={buttonConfig[3].icon}
              style={ !controlEnabled ? 
                {...brandConfig.disabledButtonStyle, minWidth: 120} :
                {
                  ...brandConfig.buttonStyle,
                  minWidth: 120,
                  backgroundColor: brandConfig.colors.primary,
                  borderColor: brandConfig.colors.primary
                }
              }
            >
              {buttonConfig[3].label}
            </Button>
          </Col>
        </Row>

        {keyboardEnabled && (
          <div style={{ 
            textAlign: 'center', 
            fontSize: 11, 
            color: '#666',
            background: '#f0f0f0',
            padding: 8,
            borderRadius: 4
          }}>
            <Text type="secondary">
              🎮 W/↑: Forward | A/←: Left | S/↓: Backward | D/→: Right | Space/Esc: STOP
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ControlButtons;
