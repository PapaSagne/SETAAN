import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import Accueil from './pages/Accueil';
import Recommandations from './pages/Recommandations';
import Profil from './pages/Profil';
import Admin from './pages/Admin';
import './index.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#080e00' }}>
        <Navbar />
        <div style={{ padding: '30px 20px' }}>
          <Routes>
            <Route path="/" element={token ? <Accueil /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/recommandations" element={token ? <Recommandations /> : <Navigate to="/login" />} />
            <Route path="/profil" element={token ? <Profil /> : <Navigate to="/login" />} />
            <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;