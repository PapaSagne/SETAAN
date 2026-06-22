import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Inscription() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const handleInscription = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/inscription', { nom, email, mot_de_passe: motDePasse });
      setMessage('✅ Compte créé avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.detail || 'Une erreur est survenue'));
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    borderRadius: '8px', border: '1px solid #2E4600',
    backgroundColor: '#050800', color: '#a0c840',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'all 0.3s'
  };

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#080e00', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(46,70,0,0.8), transparent)', animation: 'scanline 8s linear infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(46,70,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(46,70,0,0.07) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '420px', backgroundColor: '#0d1500', borderRadius: '16px', padding: '45px 40px', border: '1px solid #2E4600', boxShadow: '0 0 40px rgba(46,70,0,0.2)', animation: visible ? 'slideUp 0.5s ease forwards' : 'none', opacity: visible ? 1 : 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '10px', background: 'linear-gradient(135deg, #4a7000, #a0c840)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>SETAAN</div>
          <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, transparent, #2E4600, transparent)', margin: '10px auto 12px' }} />
          <p style={{ color: '#2E4600', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' }}>Créer un compte</p>
        </div>

        {message && <div style={{ backgroundColor: 'rgba(46,70,0,0.15)', border: '1px solid #2E4600', color: '#6a9e30', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '13px' }}>{message}</div>}

        <form onSubmit={handleInscription}>
          {[
            { label: 'Nom complet', value: nom, setter: setNom, type: 'text', placeholder: 'Votre nom' },
            { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'votre@email.com' },
            { label: 'Mot de passe', value: motDePasse, setter: setMotDePasse, type: 'password', placeholder: '••••••••' }
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#2E4600', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</label>
              <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} required style={inputStyle} />
            </div>
          ))}
          <button type="submit" style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase' }}>
            → CRÉER MON COMPTE
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #1a2e00' }}>
          <p style={{ color: '#2E4600', fontSize: '13px' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#6a9e30', fontWeight: 'bold', textDecoration: 'none' }}>Se connecter →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Inscription;