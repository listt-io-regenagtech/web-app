// src/pages/HomePage.js
import React from 'react';
import { Typography, Card, Row, Col, Button, Space } from 'antd';
import { 
  ControlOutlined, 
  EnvironmentOutlined, 
  FileTextOutlined, 
  CalendarOutlined,
  RocketOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { brandConfig } from '../config/brandConfig';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const features = [
    {
      icon: <ControlOutlined style={{ fontSize: 48, color: brandConfig.colors.primary }} />,
      title: 'Vehicle Control',
      description: 'Real-time control of your SmartPasture vehicle with 4-wheel steering modes',
      link: '/control'
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: 48, color: brandConfig.colors.secondary }} />,
      title: 'Mission Planning',
      description: 'Plan and schedule autonomous missions for efficient pasture management',
      link: '/mission-setup'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 48, color: brandConfig.colors.status.warning }} />,
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports and analyze pasture data',
      link: '/report'
    },
    {
      icon: <CalendarOutlined style={{ fontSize: 48, color: brandConfig.colors.status.info }} />,
      title: 'Schedule Missions',
      description: 'Automated mission scheduling for optimal pasture maintenance',
      link: '/schedule-mission'
    }
  ];

  return (
    <div style={{ background: brandConfig.colors.background, minHeight: '100vh', padding: '48px 24px' }}>
        <Row justify="center">
          <Col xs={24} lg={16}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Title level={1} style={{ color: brandConfig.colors.text.primary }}>
                Welcome to {brandConfig.brand.name}
              </Title>
              <Paragraph style={{ fontSize: 18, color: brandConfig.colors.text.secondary }}>
                {brandConfig.brand.description}
              </Paragraph>
              
              <Space size="large" style={{ marginTop: 24 }}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<RocketOutlined />}
                  href="/control"
                  style={{
                    ...brandConfig.buttonStyle,
                    backgroundColor: brandConfig.colors.primary,
                    borderColor: brandConfig.colors.primary
                  }}
                >
                  Start Controlling
                </Button>
                <Button 
                  size="large" 
                  icon={<EnvironmentOutlined />}
                  href="/mission-setup"
                  style={{
                    ...brandConfig.buttonStyle,
                    color: brandConfig.colors.primary,
                    borderColor: brandConfig.colors.primary
                  }}
                >
                  Plan Mission
                </Button>
              </Space>
            </div>

            <Row gutter={[24, 24]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Link to={feature.link} style={{ textDecoration: 'none' }}>
                    <Card 
                      hoverable
                      style={{ height: '100%' }}
                      bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
                    >
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {feature.icon}
                        <Title level={4} style={{ margin: 0 }}>
                          {feature.title}
                        </Title>
                        <Paragraph style={{ margin: 0, color: '#666' }}>
                          {feature.description}
                        </Paragraph>
                      </Space>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
    </div>
  );
};

export default HomePage;
