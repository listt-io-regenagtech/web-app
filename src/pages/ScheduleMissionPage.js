// src/pages/ScheduleMissionPage.js
import React from 'react';
import { Typography, Card, Row, Col, Button, Space, Empty } from 'antd';
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { brandConfig } from '../config/brandConfig';

const { Title, Paragraph } = Typography;

const ScheduleMissionPage = () => {
  return (
    <div style={{ background: brandConfig.colors.background, minHeight: '100vh', padding: '24px' }}>
      <Row justify="center">
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                Mission Scheduler
              </Space>
            }
            style={{ textAlign: 'center' }}
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                style={{
                  ...brandConfig.buttonStyle,
                  backgroundColor: brandConfig.colors.primary,
                  borderColor: brandConfig.colors.primary
                }}
              >
                New Mission
              </Button>
            }
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="large">
                  <Title level={4}>Automated Mission Scheduling</Title>
                  <Paragraph>
                    Schedule and automate OSCAR missions for optimal pasture management. 
                    Plan recurring tasks, monitor execution, and optimize farming operations.
                  </Paragraph>
                </Space>
              }
            >
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />}
                style={{
                  ...brandConfig.buttonStyle,
                  backgroundColor: brandConfig.colors.primary,
                  borderColor: brandConfig.colors.primary
                }}
              >
                Create Your First Mission
              </Button>
            </Empty>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleMissionPage;
