import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import useNavigate here
import HomePage from './pages/HomePage';
import ControlPage from './pages/ControlPage';
import MissionPage from './pages/MissionPage';
import ScheduleMissionPage from './pages/ScheduleMissionPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage'; // Import LoginPage component
import './App.css'; // You can add your styles here

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();  // Initialize the useNavigate hook

  // Check if the user is authenticated on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
    navigate('/'); // Navigate to the login page after logout
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      {isAuthenticated && (
        <aside style={{ width: '200px', background: '#f8f8f8', padding: '1rem' }}>
          <nav>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '1rem' }}>
                <Link to="/home">Home</Link>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <Link to="/control">Control</Link>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <Link to="/mission-setup">Mission Setup</Link>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <Link to="/schedule-mission">Schedule Mision</Link>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <Link to="/report">Report</Link>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '1rem' }}>
        <Routes>
          {!isAuthenticated ? (
            <Route path="/" element={<LoginPage setIsAuthenticated={handleLogin} />} />
          ) : (
            <>
              <Route path="/home" element={<HomePage />} />
              <Route path="/control" element={<ControlPage />} />
              <Route path="/mission-setup" element={<MissionPage />} />
              <Route path="/schedule-mission" element={<ScheduleMissionPage />} />
              <Route path="/report" element={<ReportPage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;

