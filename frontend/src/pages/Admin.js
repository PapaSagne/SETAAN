import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GENRES_DISPONIBLES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy',
  'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir',
  'Horror', 'IMAX', 'Musical', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'War', 'Western'
];

function Admin() {
  const [onglet, setOnglet] = useState('utilisateurs');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [films, setFilms] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Formulaire utilisateur
  const [showFormUser, setShowFormUser] = useState(false);
  const [userEnEdition, setUserEnEdition] = useState(null);
  const [formUser, setFormUser] = useState({ nom: '', email: '', mot_de_passe: '', is_admin: false });

  // Formulaire film
  const [showFormFilm, setShowFormFilm] = useState(false);
  const [searchFilm, setSearchFilm] = useState('');
  const [formFilm, setFormFilm] = useState({ title: '', annee: '', genres: [] });

  // TMDB
  const [tmdbResultats, setTmdbResultats] = useState([]);
  const [tmdbSelectionne, setTmdbSelectionne] = useState(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  // Image locale
  const [imageLocale, setImageLocale] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const charger = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/admin/utilisateurs', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUtilisateurs(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/');
    } finally {
      setChargement(false);
    }
  };

  const chargerFilms = async (search = '') => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/admin/films?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilms(res.data);
    } catch { }
  };

  useEffect(() => { charger(); }, []);
  useEffect(() => { if (onglet === 'films') chargerFilms(); }, [onglet]);

  const afficherMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // ============ UTILISATEURS ============
  const soumettreFormUser = async (e) => {
    e.preventDefault();
    try {
      if (userEnEdition) {
        await axios.put(`http://127.0.0.1:8000/admin/utilisateurs/${userEnEdition.id}`,
          { nom: formUser.nom, email: formUser.email, is_admin: formUser.is_admin },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        afficherMessage('✅ Utilisateur modifié !');
      } else {
        await axios.post('http://127.0.0.1:8000/admin/utilisateurs',
          { nom: formUser.nom, email: formUser.email, mot_de_passe: formUser.mot_de_passe, is_admin: formUser.is_admin },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        afficherMessage('✅ Utilisateur créé !');
      }
      setShowFormUser(false);
      setUserEnEdition(null);
      setFormUser({ nom: '', email: '', mot_de_passe: '', is_admin: false });
      charger();
    } catch (err) {
      afficherMessage('❌ ' + (err.response?.data?.detail || 'Erreur'), 'error');
    }
  };

  const editerUser = (user) => {
    setUserEnEdition(user);
    setFormUser({ nom: user.nom, email: user.email, mot_de_passe: '', is_admin: user.is_admin });
    setShowFormUser(true);
  };

  const supprimerUser = async (id) => {
    if (!window.confirm('Confirmer la suppression de cet utilisateur ?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/utilisateurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      afficherMessage('✅ Utilisateur supprimé !');
      charger();
    } catch (err) {
      afficherMessage('❌ ' + (err.response?.data?.detail || 'Erreur'), 'error');
    }
  };

  // ============ TMDB ============
  const rechercherTmdb = async () => {
    if (!formFilm.title) return;
    setRechercheEnCours(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/admin/recherche-tmdb?titre=${formFilm.title}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTmdbResultats(res.data);
      setTmdbSelectionne(null);
    } catch { }
    finally { setRechercheEnCours(false); }
  };

  const selectionnerTmdb = (film) => {
    setTmdbSelectionne(film);
    setFormFilm(prev => ({ ...prev, title: film.title, annee: film.year }));
    setTmdbResultats([]);
  };

  // ============ IMAGE LOCALE ============
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImage(ev.target.result);
      setImageLocale({ base64: ev.target.result, extension: file.name.split('.').pop() });
    };
    reader.readAsDataURL(file);
  };

  // ============ FILMS ============
  const soumettreFormFilm = async (e) => {
    e.preventDefault();
    if (formFilm.genres.length === 0) {
      afficherMessage('❌ Sélectionnez au moins un genre', 'error');
      return;
    }
    try {
      const title = formFilm.annee ? `${formFilm.title} (${formFilm.annee})` : formFilm.title;
      const res = await axios.post('http://127.0.0.1:8000/admin/films',
        { title, genres: formFilm.genres.join('|'), tmdb_id: tmdbSelectionne?.tmdb_id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Upload image locale si sélectionnée
      if (imageLocale) {
        await axios.post('http://127.0.0.1:8000/admin/films/upload-image',
          { movie_id: res.data.movieId, image_base64: imageLocale.base64, extension: imageLocale.extension },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      afficherMessage('✅ Film ajouté avec succès !');
      setShowFormFilm(false);
      setFormFilm({ title: '', annee: '', genres: [] });
      setTmdbSelectionne(null);
      setTmdbResultats([]);
      setImageLocale(null);
      setPreviewImage(null);
      chargerFilms(searchFilm);
      charger();
    } catch (err) {
      afficherMessage('❌ ' + (err.response?.data?.detail || 'Erreur'), 'error');
    }
  };

  const supprimerFilm = async (movieId, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/films/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      afficherMessage('✅ Film supprimé !');
      chargerFilms(searchFilm);
      charger();
    } catch (err) {
      afficherMessage('❌ ' + (err.response?.data?.detail || 'Erreur'), 'error');
    }
  };

  const toggleGenre = (genre) => {
    setFormFilm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#2E4600' }}>Chargement...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ color: '#a0c840', fontSize: '22px', fontWeight: '700' }}>Espace Administrateur</h2>
        <p style={{ color: '#2E4600', fontSize: '13px', marginTop: '4px' }}>Gestion de la plateforme SETAAN</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: '12px 16px', backgroundColor: messageType === 'success' ? 'rgba(46,70,0,0.1)' : 'rgba(100,0,0,0.1)', border: `1px solid ${messageType === 'success' ? '#2E4600' : '#660000'}`, borderRadius: '8px', marginBottom: '20px', color: messageType === 'success' ? '#6a9e30' : '#ff6666', fontSize: '13px' }}>
          {message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
          {[
            { label: 'Utilisateurs', value: stats.nb_utilisateurs },
            { label: 'Administrateurs', value: stats.nb_admins},
            { label: 'Notes données', value: stats.nb_notes },
            { label: 'Films disponibles', value: stats.nb_films },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ backgroundColor: '#0d1500', borderRadius: '12px', padding: '20px', border: '1px solid #1a2e00', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
              <div style={{ color: '#a0c840', fontSize: '24px', fontWeight: '700' }}>{value}</div>
              <div style={{ color: '#2E4600', fontSize: '11px', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        {[
          { key: 'utilisateurs', label: '👥 Utilisateurs' },
          { key: 'films', label: '🎬 Films' }
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setOnglet(key)} style={{
            padding: '10px 24px',
            background: onglet === key ? 'linear-gradient(135deg, #1a2e00, #2E4600)' : 'transparent',
            color: onglet === key ? '#a0c840' : '#3a5500',
            border: `1px solid ${onglet === key ? '#2E4600' : '#1a2e00'}`,
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ============ ONGLET UTILISATEURS ============ */}
      {onglet === 'utilisateurs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={() => { setShowFormUser(true); setUserEnEdition(null); setFormUser({ nom: '', email: '', mot_de_passe: '', is_admin: false }); }}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              + Ajouter un utilisateur
            </button>
          </div>

          {showFormUser && (
            <div style={{ backgroundColor: '#0d1500', borderRadius: '12px', padding: '25px', border: '1px solid #2E4600', marginBottom: '25px' }}>
              <h3 style={{ color: '#a0c840', marginBottom: '20px', fontSize: '16px' }}>
                {userEnEdition ? '✏️ Modifier l\'utilisateur' : '➕ Ajouter un utilisateur'}
              </h3>
              <form onSubmit={soumettreFormUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Nom complet</label>
                    <input type="text" value={formUser.nom} onChange ={(e) => setFormUser({ ...formUser, nom: e.target.value })} required style={inputStyle} placeholder="Nom complet" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={formUser.email} onChange={(e) => setFormUser({ ...formUser, email: e.target.value })} required style={inputStyle} placeholder="email@exemple.com" />
                  </div>
                </div>
                {!userEnEdition && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Mot de passe</label>
                    <input type="password" value={formUser.mot_de_passe} onChange={(e) => setFormUser({ ...formUser, mot_de_passe: e.target.value })} required style={inputStyle} placeholder="••••••••" />
                  </div>
                )}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="is_admin" checked={formUser.is_admin} onChange={(e) => setFormUser({ ...formUser, is_admin: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#2E4600' }} />
                  <label htmlFor="is_admin" style={{ color: '#6a9e30', fontSize: '14px', cursor: 'pointer' }}>Compte administrateur</label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    {userEnEdition ? 'Modifier' : 'Créer'}
                  </button>
                  <button type="button" onClick={() => { setShowFormUser(false); setUserEnEdition(null); }}
                    style={{ padding: '10px 24px', background: 'transparent', color: '#3a5500', border: '1px solid #1a2e00', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ backgroundColor: '#0d1500', borderRadius: '12px', border: '1px solid #1a2e00', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E4600' }}>
                  {['ID', 'Nom', 'Email', 'Rôle', 'Notes', 'Inscription', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: '#2E4600', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user, index) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #0f1a00', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(46,70,0,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(46,70,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(46,70,0,0.03)'}
                  >
                    <td style={tdStyle}>#{user.id}</td>
                    <td style={{ ...tdStyle, color: '#a0c840', fontWeight: '600' }}>{user.nom}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: user.is_admin ? 'rgba(46,70,0,0.3)' : 'rgba(20,20,20,0.5)', border: `1px solid ${user.is_admin ? '#2E4600' : '#1a1a1a'}`, color: user.is_admin ? '#a0c840' : '#3a5500' }}>
                        {user.is_admin ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td style={tdStyle}>{user.nb_notes}</td>
                    <td style={tdStyle}>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => editerUser(user)} style={{ padding: '5px 12px', background: 'transparent', color: '#6a9e30', border: '1px solid #2E4600', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>✏️ Modifier</button>
                        <button onClick={() => supprimerUser(user.id)} style={{ padding: '5px 12px', background: 'transparent', color: '#884444', border: '1px solid #442222', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ ONGLET FILMS ============ */}
      {onglet === 'films' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
            <input
              type="text"
              placeholder="Rechercher un film..."
              value={searchFilm}
              onChange={(e) => { setSearchFilm(e.target.value); chargerFilms(e.target.value); }}
              style={{ ...inputStyle, flex: 1, margin: 0 }}
            />
            <button onClick={() => { setShowFormFilm(true); setFormFilm({ title: '', annee: '', genres: [] }); setTmdbResultats([]); setTmdbSelectionne(null); setPreviewImage(null); setImageLocale(null); }}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              + Ajouter un film
            </button>
          </div>

          {/* Formulaire ajout film */}
          {showFormFilm && (
            <div style={{ backgroundColor: '#0d1500', borderRadius: '12px', padding: '25px', border: '1px solid #2E4600', marginBottom: '25px' }}>
              <h3 style={{ color: '#a0c840', marginBottom: '20px', fontSize: '16px' }}>🎬 Ajouter un film / série</h3>
              <form onSubmit={soumettreFormFilm}>

                {/* Recherche TMDB */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Titre du film / série</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={formFilm.title}
                      onChange={(e) => { setFormFilm({ ...formFilm, title: e.target.value }); setTmdbResultats([]); setTmdbSelectionne(null); }}
                      required
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Ex: Inception"
                    />
                    <button type="button" onClick={rechercherTmdb}
                      style={{ padding: '11px 18px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {rechercheEnCours ? '⏳' : '🔍 Chercher affiche'}
                    </button>
                  </div>
                </div>

                {/* Résultats TMDB */}
                {tmdbResultats.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#2E4600', fontSize: '12px', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Sélectionnez le bon film :</p>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {tmdbResultats.map(film => (
                        <div key={film.tmdb_id}
                          onClick={() => selectionnerTmdb(film)}
                          style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', border: '2px solid #1a2e00', minWidth: '120px', maxWidth: '120px', backgroundColor: '#080e00', transition: 'all 0.2s', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#2E4600'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2e00'}
                        >
                          {film.poster ? (
                            <img src={film.poster} alt={film.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1500' }}>
                              <span style={{ fontSize: '30px' }}>🎬</span>
                            </div>
                          )}
                          <div style={{ padding: '8px' }}>
                            <p style={{ color: '#a0c840', fontSize: '11px', fontWeight: '600', lineHeight: '1.3', marginBottom: '2px' }}>{film.title}</p>
                            <p style={{ color: '#2E4600', fontSize: '10px' }}>{film.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Film TMDB sélectionné */}
                {tmdbSelectionne && (
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(46,70,0,0.1)', border: '1px solid #2E4600', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {tmdbSelectionne.poster && (
                      <img src={tmdbSelectionne.poster} alt={tmdbSelectionne.title} style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                    )}
                    <div>
                      <p style={{ color: '#a0c840', fontSize: '14px', fontWeight: '600' }}>{tmdbSelectionne.title} ({tmdbSelectionne.year})</p>
                      <p style={{ color: '#6a9e30', fontSize: '12px', marginTop: '3px' }}>✅ Affiche TMDB sélectionnée</p>
                    </div>
                  </div>
                )}

                {/* Upload image locale */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>
                    {tmdbSelectionne ? 'Ou importer une autre affiche manuellement' : 'Affiche du film'}
                  </label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block', width: '100%', padding: '12px',
                        backgroundColor: '#050800', border: '1px dashed #2E4600',
                        borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        color: '#3a5500', fontSize: '13px', transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#6a9e30'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#2E4600'}
                      >
                         Cliquez pour importer une image (JPG, PNG, WEBP)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {!previewImage && tmdbSelectionne && (
                        <p style={{ color: '#2E4600', fontSize: '11px', marginTop: '6px' }}>
                          ℹ️ L'affiche TMDB sera utilisée si aucune image n'est importée.
                        </p>
                      )}
                      {!previewImage && !tmdbSelectionne && (
                        <p style={{ color: '#2E4600', fontSize: '11px', marginTop: '6px' }}>
                          ℹ️ Utilisez 🔍 Chercher affiche ou importez une image manuellement.
                        </p>
                      )}
                    </div>

                    {/* Aperçu image locale */}
                    {previewImage && (
                      <div style={{ position: 'relative' }}>
                        <img src={previewImage} alt="Aperçu" style={{ width: '90px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2E4600' }} />
                        <button
                          type="button"
                          onClick={() => { setPreviewImage(null); setImageLocale(null); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#440000', border: '1px solid #660000', color: '#ff6666', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                        <p style={{ color: '#6a9e30', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>✅ Image prête</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Année */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Année (optionnel)</label>
                  <input type="number" value={formFilm.annee} onChange={(e) => setFormFilm({ ...formFilm, annee: e.target.value })} style={inputStyle} placeholder="Ex: 2024" min="1900" max="2030" />
                </div>

                {/* Genres */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ ...labelStyle, marginBottom: '10px' }}>Genres</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {GENRES_DISPONIBLES.map(genre => (
                      <button key={genre} type="button" onClick={() => toggleGenre(genre)} style={{
                        padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: formFilm.genres.includes(genre) ? '#2E4600' : 'transparent',
                        color: formFilm.genres.includes(genre) ? '#a0c840' : '#3a5500',
                        border: `1px solid ${formFilm.genres.includes(genre) ? '#2E4600' : '#1a2e00'}`
                      }}>
                        {genre}
                      </button>
                    ))}
                  </div>
                  {formFilm.genres.length > 0 && (
                    <p style={{ color: '#6a9e30', fontSize: '12px', marginTop: '8px' }}>Sélectionnés : {formFilm.genres.join(' | ')}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #1a2e00, #2E4600)', color: '#a0c840', border: '1px solid #2E4600', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    Ajouter le film
                  </button>
                  <button type="button" onClick={() => { setShowFormFilm(false); setTmdbResultats([]); setTmdbSelectionne(null); setPreviewImage(null); setImageLocale(null); }}
                    style={{ padding: '10px 24px', background: 'transparent', color: '#3a5500', border: '1px solid #1a2e00', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des films */}
          <div style={{ backgroundColor: '#0d1500', borderRadius: '12px', border: '1px solid #1a2e00', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E4600' }}>
                  {['ID', 'Titre', 'Genres', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: '#2E4600', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {films.map((film, index) => (
                  <tr key={film.movieId} style={{ borderBottom: '1px solid #0f1a00', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(46,70,0,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(46,70,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(46,70,0,0.03)'}
                  >
                    <td style={tdStyle}>#{film.movieId}</td>
                    <td style={{ ...tdStyle, color: '#a0c840', fontWeight: '600' }}>{film.title}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {film.genres.split('|').map(g => (
                          <span key={g} style={{ padding: '2px 8px', backgroundColor: 'rgba(46,70,0,0.2)', border: '1px solid #1a2e00', borderRadius: '10px', fontSize: '11px', color: '#3a5500' }}>{g}</span>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => supprimerFilm(film.movieId, film.title)}
                        style={{ padding: '5px 12px', background: 'transparent', color: '#884444', border: '1px solid #442222', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #0f1a00' }}>
              <p style={{ color: '#2E4600', fontSize: '12px' }}>
                {films.length} film(s) affiché(s) — recherchez pour trouver un film spécifique
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', color: '#2E4600', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #2E4600', backgroundColor: '#050800', color: '#a0c840', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const tdStyle = { padding: '13px 16px', color: '#6a9e30', fontSize: '13px' };

export default Admin;