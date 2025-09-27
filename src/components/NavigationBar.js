import React from "react";
import { Menu, Button, Space, Typography } from "antd";
import { Link, useLocation } from "react-router-dom";
import { 
  HomeOutlined, 
  ControlOutlined, 
  EnvironmentOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import { brandConfig } from "../config/brandConfig";

const { Text } = Typography;

function NavigationBar({ onLogout }) {
  const location = useLocation();
  
  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: <Link to="/home">Home</Link>
    },
    {
      key: '/control',
      icon: <ControlOutlined />,
      label: <Link to="/control">Control</Link>
    },
    {
      key: '/mission-setup',
      icon: <EnvironmentOutlined />,
      label: <Link to="/mission-setup">Mission Setup</Link>
    },
    {
      key: '/schedule-mission',
      icon: <CalendarOutlined />,
      label: <Link to="/schedule-mission">Schedule</Link>
    },
    {
      key: '/report',
      icon: <FileTextOutlined />,
      label: <Link to="/report">Reports</Link>
    }
  ];

  return (
    <div style={{ 
      background: brandConfig.colors.dark, 
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 32 }}>
          <img 
            src={brandConfig.logo.white}
            alt={brandConfig.logo.alt}
            style={{ 
              height: '40px', 
              marginRight: 12,
              borderRadius: 4
            }}
            onError={(e) => {
              // Fallback to text if logo fails to load
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <Text strong style={{ 
            color: brandConfig.colors.text.light, 
            fontSize: 18,
            display: 'none'  // Hidden by default, shown if logo fails
          }}>
            {brandConfig.brand.name}
          </Text>
        </div>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ 
            background: 'transparent',
            border: 'none',
            minWidth: 500
          }}
        />
      </div>

      <Button 
        type="text" 
        icon={<LogoutOutlined />}
        onClick={onLogout}
        style={{ 
          color: brandConfig.colors.text.light,
          borderColor: brandConfig.colors.primary
        }}
      >
        Logout
      </Button>
    </div>
  );
}

export default NavigationBar;
