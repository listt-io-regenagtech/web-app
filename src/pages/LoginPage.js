import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { brandConfig } from '../config/brandConfig';

const { Content } = Layout;
const { Title, Text } = Typography;

const LoginPage = ({ setIsAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (values.username === 'test@example.com' && values.password === 'password') {
        setIsAuthenticated(true);
        message.success('Login successful!');
        navigate('/home');
      } else {
        message.error('Invalid credentials. Please try again.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: brandConfig.colors.background }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card 
          style={{ 
            width: 400, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 8,
            background: brandConfig.colors.surface
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <img 
                src={brandConfig.logo.main}
                alt={brandConfig.logo.alt}
                style={{ 
                  height: '60px', 
                  marginBottom: 16,
                  borderRadius: 4
                }}
                onError={(e) => {
                  // Fallback to text if logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <Title level={2} style={{ 
                color: brandConfig.colors.text.primary, 
                marginBottom: 8,
                display: 'none'  // Hidden by default, shown if logo fails
              }}>
                {brandConfig.brand.name}
              </Title>
              <Text style={{ color: brandConfig.colors.text.secondary }}>
                {brandConfig.brand.tagline}
              </Text>
            </div>

            <Form
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Please input your username!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: brandConfig.colors.primary }} />} 
                  placeholder="Username (test@example.com)" 
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: brandConfig.colors.primary }} />} 
                  placeholder="Password (password)" 
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<LoginOutlined />}
                  block
                  style={{ 
                    ...brandConfig.buttonStyle,
                    height: 48,
                    backgroundColor: brandConfig.colors.primary,
                    borderColor: brandConfig.colors.primary
                  }}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Demo Credentials: test@example.com / password
              </Text>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;
