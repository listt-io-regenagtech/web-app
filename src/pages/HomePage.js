// src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Welcome to listt.io prototype Web-App </h1>
      <p>Your tool for efficient mission setup, control and report generation !!!</p>
    </div>
  );
};

export default HomePage;

