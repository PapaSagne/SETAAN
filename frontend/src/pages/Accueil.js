import React, { useState, useEffect } from 'react';
import axios from 'axios';

const imageCache = {};

function FilmCard({ film, onNote, dejaNote, maNote }) {

  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const chargerImage = async () => {
      if (imageCache[film.movieId]) {
        setImageUrl(imageCache[film.movieId]);
        return;
      }
      try {
        const res = await axios.get(`http://127.0.0.1:8000/film-image/${film.movieId}`);
        const url = res.data.image_url;
        imageCache[film.movieId] = url;
        setImageUrl(url);
      } catch {
        setImageUrl(null);
      }
    };
    chargerImage();
  }, [film.movieId]);

  return (
    <div className="card-hover" style={{
      backgroundColor: '#0d1500',
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${dejaNote ? '#2E4600' : '#1a2e00'}`,
      boxShadow: dejaNote ? '0 4px 20px rgba(46,70,0,0.2)' : '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>

      {/* Badge déjà noté */}
      {dejaNote && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 2,
          backgroundColor: 'rgba(0,0,0,0.85)',
          border: '1px solid #2E4600',
          color: '#a0c840',
          fontSize: '11px', fontWeight: 'bold',
          padding: '3px 10px', borderRadius: '20px',
          letterSpacing: '0.5px'
        }}>
          ✅ Noté {maNote}/5
        </div>
      )}

      {/* Image */}
      <div style={{ width: '100%', height: '200px', backgroundColor: '#0a1200', overflow: 'hidden' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: dejaNote ? 0.7 : 1 }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '40px' }}>🎬</span>
            <span style={{ color: '#2E4600', fontSize: '11px', marginTop: '8px' }}>Pas d'affiche</span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ color: dejaNote ? '#6a9e30' : '#a0c840', marginBottom: '5px', fontSize: '13px', lineHeight: '1.4' }}>
          {film.title}
        </h4>
        <p style={{ color: '#2E4600', fontSize: '11px', marginBottom: '12px', flex: 1 }}>
          {film.genres.split('|')[0]}
        </p>

        {dejaNote ? (
          // Film déjà noté — afficher les étoiles et option modifier
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ fontSize: '14px', opacity: i <= Math.round(maNote) ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
            <select
              onChange={(e) => onNote(film.movieId, e.target.value)}
              defaultValue=""
              style={{ width: '100%', padding: '7px', borderRadius: '6px', background: '#050800', color: '#3a5500', border: '1px solid #1a2e00', cursor: 'pointer', fontSize: '11px', outline: 'none' }}
            >
              <option value="" disabled>✏️ Modifier la note</option>
              <option value="0.5">0.5 — Très mauvais</option>
              <option value="1">1.0 — Mauvais</option>
              <option value="1.5">1.5</option>
              <option value="2">2.0 — Moyen</option>
              <option value="2.5">2.5</option>
              <option value="3">3.0 — Bien</option>
              <option value="3.5">3.5</option>
              <option value="4">4.0 — Très bien</option>
              <option value="4.5">4.5</option>
              <option value="5">5.0 — Excellent</option>
            </select>
          </div>
        ) : (
          // Film non noté
          <select
            onChange={(e) => onNote(film.movieId, e.target.value)}
            defaultValue=""
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#050800', color: '#6a9e30', border: '1px solid #2E4600', cursor: 'pointer', fontSize: '12px', outline: 'none' }}
          >
            <option value="" disabled>⭐ Noter ce film</option>
            <option value="0.5">0.5 — Très mauvais</option>
            <option value="1">1.0 — Mauvais</option>
            <option value="1.5">1.5</option>
            <option value="2">2.0 — Moyen</option>
            <option value="2.5">2.5</option>
            <option value="3">3.0 — Bien</option>
            <option value="3.5">3.5</option>
            <option value="4">4.0 — Très bien</option>
            <option value="4.5">4.5</option>
            <option value="5">5.0 — Excellent</option>
          </select>
        )}
      </div>
    </div>
  );
}

function Accueil() {
  const [films, setFilms] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [mesNotes, setMesNotes] = useState({});
  const token = localStorage.getItem('token');

  const chargerFilms = async (q = '') => {
    const res = await axios.get(`http://127.0.0.1:8000/films?search=${q}`);
    setFilms(res.data);
  };

  const chargerMesNotes = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/mes-films-notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMesNotes(res.data);
    } catch {
      console.error('Erreur chargement notes');
    }
  };

  useEffect(() => {
    chargerFilms();
    chargerMesNotes();
  }, []);

  const noterFilm = async (movieId, rating) => {
    try {
      await axios.post('http://127.0.0.1:8000/notes',
        { movie_id: movieId, rating: parseFloat(rating) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Mettre à jour localement sans recharger
      setMesNotes(prev => ({ ...prev, [movieId]: parseFloat(rating) }));
      setMessage('✅ Note enregistrée !');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('❌ Erreur lors de la notation');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}> Catalogue</h2>
        <p style={{ color: '#2E4600', fontSize: '13px', marginTop: '4px' }}>
          Notez des films pour recevoir des recommandations personnalisées. {' '}
          <span style={{ color: '#6a9e30' }}>{Object.keys(mesNotes).length} film(s) noté(s)</span>
        </p>
      </div>

      {message && (
        <div style={{ color: '#6a9e30', padding: '10px 15px', backgroundColor: 'rgba(46,70,0,0.1)', borderRadius: '8px', border: '1px solid #2E4600', marginBottom: '15px', fontSize: '13px' }}>
          {message}
        </div>
      )}

      <input
        type="text"
        placeholder="Rechercher un film..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); chargerFilms(e.target.value); }}
        style={{ width: '100%', padding: '13px 16px', borderRadius: '8px', border: '1px solid #2E4600', backgroundColor: '#050800', color: '#a0c840', fontSize: '14px', marginBottom: '25px', boxSizing: 'border-box', outline: 'none' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {films.map(film => (
          <FilmCard
            key={film.movieId}
            film={film}
            onNote={noterFilm}
            token={token}
            dejaNote={mesNotes.hasOwnProperty(film.movieId)}
            maNote={mesNotes[film.movieId]}
          />
        ))}
      </div>
    </div>
  );
}

export default Accueil;