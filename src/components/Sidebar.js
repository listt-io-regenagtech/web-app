// src/components/Sidebar.js
import React from "react";
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import { 
  HomeOutlined, 
  ControlOutlined, 
  EnvironmentOutlined, 
  FileTextOutlined,
  CalendarOutlined 
} from "@ant-design/icons";

const { Sider } = Layout;

function Sidebar() {
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/home">Home</Link>
    },
    {
      key: 'control',
      icon: <ControlOutlined />,
      label: <Link to="/control">Vehicle Control</Link>
    },
    {
      key: 'mission',
      icon: <EnvironmentOutlined />,
      label: <Link to="/mission">Mission Setup</Link>
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: <Link to="/schedule-mission">Schedule Mission</Link>
    },
    {
      key: 'report',
      icon: <FileTextOutlined />,
      label: <Link to="/report-page">Reports</Link>
    }
  ];

  return (
    <Sider 
      width={220} 
      style={{ 
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '8px'
      }}>
        <h3 style={{ margin: 0, color: '#001529' }}>🌾 Listt.io</h3>
      </div>
      
      <Menu
        mode="inline"
        defaultSelectedKeys={['home']}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
}

export default Sidebar;
