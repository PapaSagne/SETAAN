import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const GENRES = [
  'Action', 'Aventure', 'Comédie', 'Drame', 'Horreur',
  'Science-Fiction', 'Romance', 'Thriller', 'Animation',
  'Documentaire', 'Fantasy', 'Policier', 'Guerre', 'Western',
  'Musical', 'Mystère', 'Crime', 'Biographie'
];

function GenreAnimation() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Génère une position aléatoire unique
    const spawn = () => {
      const id = Date.now() + Math.random();
      const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
      const top = Math.random() * 85;
      const left = Math.random() * 85;

      setItems(prev => [...prev, { id, genre, top, left, leaving: false }]);

      // Après 2s, marque comme sortant
      setTimeout(() => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, leaving: true } : i));
      }, 2000);

      // Après 2.5s, supprime
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== id));
      }, 2500);
    };

    // Premier spawn immédiat
    spawn();
    const interval = setInterval(spawn, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {items.map(({ id, genre, top, left, leaving }) => (
        <span
          key={id}
          className={leaving ? 'genre-tag-out' : 'genre-tag-in'}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            color: `rgba(46, 70, 0, ${0.3 + Math.random() * 0.4})`,
            fontSize: `${11 + Math.random() * 10}px`,
            fontWeight: '600',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {genre}
        </span>
      ))}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', motDePasse);
      const response = await axios.post('http://127.0.0.1:8000/login', formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch {
      setErreur('Email ou mot de passe incorrect');
      setChargement(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    borderRadius: '8px', border: '1px solid #2E4600',
    backgroundColor: '#050800',
    color: '#a0c840', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none', transition: 'all 0.3s'
  };

  return (
    <div style={{
      minHeight: '88vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#080e00',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Animation genres */}
      <GenreAnimation />

      {/* Grille */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundImage: `
          linear-gradient(rgba(46,70,0,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(46,70,0,0.07) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '420px',
        backgroundColor: '#0d1500',
        borderRadius: '16px',
        padding: '45px 40px',
        border: '1px solid #2E4600',
        boxShadow: '0 0 40px rgba(46,70,0,0.2)',
        animation: visible ? 'slideUp 0.5s ease forwards' : 'none',
        opacity: visible ? 1 : 0,
      }}>

        {/* En-tête — curseur supprimé */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{
            fontSize: '36px', fontWeight: '900', letterSpacing: '10px',
            background: 'linear-gradient(135deg, #4a7000, #a0c840)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px'
          }}>
            SETAAN
          </div>
          <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, transparent, #2E4600, transparent)', margin: '10px auto 12px' }} />
          <p style={{ color: '#2E4600', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' }}>Connexion</p>
        </div>

        {erreur && (
          <div style={{ backgroundColor: 'rgba(46,70,0,0.15)', border: '1px solid #2E4600', color: '#6a9e30', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '13px' }}>
            ⚠️ {erreur}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#2E4600', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', color: '#2E4600', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Mot de passe</label>
            <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>
          <button type="submit" disabled={chargement} style={{
            width: '100%', padding: '13px',
            background: chargement ? 'rgba(46,70,0,0.2)' : 'linear-gradient(135deg, #1a2e00, #2E4600)',
            color: chargement ? '#2E4600' : '#a0c840',
            border: '1px solid #2E4600', borderRadius: '8px',
            fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px',
            cursor: chargement ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s', textTransform: 'uppercase'
          }}>
            {chargement ? '// CONNEXION...' : '→ SE CONNECTER'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #1a2e00' }}>
          <p style={{ color: '#2E4600', fontSize: '13px' }}>
            Pas encore de compte ?{' '}
            <Link to="/inscription" style={{ color: '#6a9e30', fontWeight: 'bold', textDecoration: 'none' }}>S'inscrire →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;