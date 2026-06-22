import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profil() {
  const [profil, setProfil] = useState(null);
  const [notes, setNotes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const charger = async () => {
      try {
        const [profilRes, notesRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/profil', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://127.0.0.1:8000/mes-notes', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setProfil(profilRes.data);
        setNotes(notesRes.data);
      } catch (err) {
        console.error('Erreur chargement profil');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const supprimerNote = async (movieId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/notes/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n.movie_id !== movieId));
    } catch {
      console.error('Erreur suppression');
    }
  };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#2E4600', fontSize: '13px', letterSpacing: '1px' }}>Chargement...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>

      {/* Carte profil */}
      <div style={{ backgroundColor: '#0d1500', borderRadius: '16px', padding: '30px', border: '1px solid #2E4600', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '25px' }}>
        <div style={{
          width: '75px', height: '75px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a2e00, #2E4600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '30px', border: '2px solid #2E4600', flexShrink: 0
        }}>
          👤
        </div>
        <div>
          <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
            {profil?.nom}
          </h2>
          <p style={{ color: '#2E4600', fontSize: '13px', marginBottom: '4px' }}>📧 {profil?.email}</p>
          <p style={{ color: '#2E4600', fontSize: '13px' }}>📅 Membre depuis le {new Date(profil?.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#a0c840' }}>{notes.length}</div>
          <div style={{ color: '#2E4600', fontSize: '12px', letterSpacing: '1px' }}>FILMS NOTÉS</div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {[
          {
            label: 'Note moyenne donnée',
            value: notes.length > 0 ? (notes.reduce((s, n) => s + n.rating, 0) / notes.length).toFixed(1) : '—',
           
          },
          {
            label: 'Meilleure note',
            value: notes.length > 0 ? Math.max(...notes.map(n => n.rating)) : '—',
            
          },
          {
            label: 'Note la plus basse',
            value: notes.length > 0 ? Math.min(...notes.map(n => n.rating)) : '—',
            
          }
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ backgroundColor: '#0d1500', borderRadius: '12px', padding: '20px', border: '1px solid #1a2e00', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{value}</div>
            <div style={{ color: '#2E4600', fontSize: '11px', letterSpacing: '0.5px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Historique des notes */}
      <div>
        <h3 style={{ color: '#a0c840', fontSize: '18px', marginBottom: '15px', letterSpacing: '0.5px' }}>
           Historique des notes
        </h3>
        {notes.length === 0 ? (
          <div style={{ backgroundColor: '#0d1500', borderRadius: '12px', padding: '40px', border: '1px solid #1a2e00', textAlign: 'center' }}>
            <p style={{ color: '#2E4600', fontSize: '14px' }}>Vous n'avez pas encore noté de films.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notes.map((note) => (
              <div key={note.movie_id} style={{
                backgroundColor: '#0d1500', borderRadius: '10px',
                padding: '15px 20px', border: '1px solid #1a2e00',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2E4600'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2e00'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <div>
                    <p style={{ color: '#a0c840', fontSize: '14px', fontWeight: '600' }}>{note.title}</p>
                    <p style={{ color: '#2E4600', fontSize: '11px', marginTop: '2px' }}>{note.genres?.split('|')[0]}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#a0c840', fontSize: '18px', fontWeight: '700' }}>{note.rating}</span>
                    <span style={{ color: '#2E4600', fontSize: '12px' }}> / 5</span>
                  </div>
                  <button
                    onClick={() => supprimerNote(note.movie_id)}
                    style={{
                      background: 'transparent', border: '1px solid #1a2e00',
                      color: '#3a5500', padding: '6px 12px', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = '#cc3300'; e.target.style.color = '#cc3300'; }}
                    onMouseLeave={e => { e.target.style.borderColor = '#1a2e00'; e.target.style.color = '#3a5500'; }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profil;