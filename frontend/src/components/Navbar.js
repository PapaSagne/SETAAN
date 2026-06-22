import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const deconnexion = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#080e00',
      padding: '14px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #2E4600',
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '26px',
          fontWeight: '900',
          letterSpacing: '8px',
          background: 'linear-gradient(135deg, #4a7000, #a0c840)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>SETAAN</span>
        
      </Link>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {token ? (
          <>
            <Link to="/" style={linkStyle}> Catalogue</Link>
            <Link to="/recommandations" style={linkStyle}> Recommandations</Link>
            <Link to="/profil" style={linkStyle}> Profil</Link>
            <Link to="/admin" style={linkStyleAdmin}> Admin</Link>
            <button onClick={deconnexion} style={btnStyle}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Connexion</Link>
            <Link to="/inscription" style={linkStyleGreen}>S'inscrire</Link>
          </>
      )}
      </div>
    </nav>
  );
}


const linkStyleAdmin = {
  color: '#a0c840',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 14px',
  borderRadius: '6px',
  border: '1px solid #2E4600'
};


const linkStyle = {
  color: '#6a9e30',
  textDecoration: 'none',
  fontSize: '14px',
  padding: '8px 14px',
  borderRadius: '6px',
};
const linkStyleGreen = {
  color: '#a0c840',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '6px',
  border: '1px solid #2E4600'
};
const btnStyle = {
  background: 'transparent',
  color: '#6a9e30',
  border: '1px solid #2E4600',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

export default Navbar;