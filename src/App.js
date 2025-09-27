import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import HomePage from './pages/HomePage';
import ControlPage from './pages/ControlPage';
import MissionPage from './pages/MissionPage';
import ScheduleMissionPage from './pages/ScheduleMissionPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import NavigationBar from './components/NavigationBar';
import './App.css';

const { Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();  // Initialize the useNavigate hook

  // Check if the user is authenticated on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      console.log("Authenticated user");
      // Redirect to home if on root path
      if (window.location.pathname === '/') {
        navigate('/home');
      }
    } else {
      console.log("Non-authenticated user");
      navigate('/'); // Redirect to login if not authenticated  
    }
  }, [navigate]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
    navigate('/'); // Navigate to the login page after logout
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={handleLogin} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavigationBar onLogout={handleLogout} />
      
      <Content>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/control" element={<ControlPage />} />
          <Route path="/mission-setup" element={<MissionPage />} />
          <Route path="/schedule-mission" element={<ScheduleMissionPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
