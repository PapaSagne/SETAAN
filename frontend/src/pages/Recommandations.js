import React, { useState, useEffect } from 'react';
import axios from 'axios';

const imageCache = {};

function RecoCard({ film, index, type }) {
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
      backgroundColor: '#0d1500', borderRadius: '12px',
      overflow: 'hidden', border: '1px solid #1a2e00',
      borderTop: '2px solid #2E4600',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ width: '100%', height: '200px', backgroundColor: '#0a1200', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1, background: 'rgba(0,0,0,0.7)', color: '#2E4600', fontSize: '11px', border: '1px solid #2E4600', padding: '2px 8px', borderRadius: '10px' }}>
          #{index + 1}
        </div>
        {imageUrl ? (
          <img src={imageUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '40px' }}>🎬</span>
            <span style={{ color: '#2E4600', fontSize: '11px', marginTop: '8px' }}>Pas d'affiche</span>
          </div>
        )}
      </div>
      <div style={{ padding: '15px' }}>
        <h4 style={{ color: '#a0c840', marginBottom: '5px', fontSize: '13px', lineHeight: '1.4' }}>{film.title}</h4>
        <p style={{ color: '#2E4600', fontSize: '11px', marginBottom: '8px' }}>{film.genres?.split('|')[0]}</p>
        <p style={{ color: '#6a9e30', fontSize: '11px' }}>✦ Recommandé pour vous</p>
      </div>
    </div>
  );
}

function Recommandations() {
  const [recommandations, setRecommandations] = useState([]);
  const [type, setType] = useState('');
  const [chargement, setChargement] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/recommandations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommandations(res.data.data);
        setType(res.data.type);
      } catch {
        console.error('Erreur');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // ============ ÉTAT VIDE ============
  if (!chargement && type === 'vide') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', marginBottom: '25px' }}> Recommandations</h2>
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#0d1500', borderRadius: '16px', border: '1px solid #1a2e00' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎬</div>
          <h3 style={{ color: '#a0c840', marginBottom: '12px', fontSize: '18px' }}>Aucune recommandation pour l'instant</h3>
          <p style={{ color: '#2E4600', fontSize: '14px', lineHeight: '1.6' }}>
            Rendez-vous dans le <strong style={{ color: '#6a9e30' }}>Catalogue</strong> et notez un film que vous avez aimé.<br />
            Vos recommandations personnalisées apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  // ============ MAUVAISES NOTES ============
  if (!chargement && type === 'mauvaises_notes') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', marginBottom: '25px' }}> Recommandations</h2>
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#0d1500', borderRadius: '16px', border: '1px solid #1a2e00' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⭐</div>
          <h3 style={{ color: '#a0c840', marginBottom: '12px', fontSize: '18px' }}>Notez un film que vous avez aimé</h3>
          <p style={{ color: '#2E4600', fontSize: '14px', lineHeight: '1.6' }}>
            Pour recevoir des recommandations, notez au moins un film avec une note de <strong style={{ color: '#6a9e30' }}>3.0 ou plus</strong>.<br />
            Cela nous permet de trouver des films qui correspondent à vos goûts.
          </p>
        </div>
      </div>
    );
  }

  // ============ CHARGEMENT ============
  if (chargement) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', marginBottom: '25px' }}> Recommandations</h2>
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <div style={{ fontSize: '36px', marginBottom: '15px' }}>⏳</div>
          <p style={{ color: '#2E4600', fontSize: '13px', letterSpacing: '1px' }}>Calcul en cours...</p>
        </div>
      </div>
    );
  }

  // ============ RECOMMANDATIONS ============
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}>Recommandations</h2>
        <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: '#0d1500', borderRadius: '8px', border: '1px solid #2E4600' }}>
          <p style={{ color: '#6a9e30', fontSize: '13px' }}>
            ✦ Ces films ont été sélectionnés en analysant vos notes et en les comparant aux utilisateurs ayant des goûts similaires.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {recommandations.map((film, index) => (
          <RecoCard key={film.movieId} film={film} index={index} type={type} />
        ))}
      </div>
    </div>
  );
}

export default Recommandations;