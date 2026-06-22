from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import numpy as np
from scipy.sparse.linalg import svds
from scipy.sparse import csr_matrix
import requests as http_requests
import sys
sys.path.append('../ml')

from database import engine, get_db, Base, SessionLocal
from models import Utilisateur, Note
from auth import hacher_mot_de_passe, verifier_mot_de_passe, creer_token, decoder_token


import base64
import os

# Création des tables
Base.metadata.create_all(bind=engine)

# ============================================
# CRÉATION ADMIN PAR DÉFAUT
# ============================================
def creer_admin_par_defaut():
    db = SessionLocal()
    try:
        admin = db.query(Utilisateur).filter(Utilisateur.email == "admin@setaan.com").first()
        if not admin:
            admin = Utilisateur(
                nom="Administrateur",
                email="admin@setaan.com",
                mot_de_passe=hacher_mot_de_passe("admin123"),
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("✅ Compte admin créé : admin@setaan.com / admin123")
    finally:
        db.close()

creer_admin_par_defaut()

app = FastAPI(title="SETAAN - API de Recommandation")

# CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ============================================
# CHARGEMENT DU MODÈLE SVD AU DÉMARRAGE
# ============================================
print("Chargement du modèle SVD...")
ratings_df = pd.read_csv('../data/Archive/ratings.csv')
movies_df = pd.read_csv('../data/Archive/movies.csv')

matrix = ratings_df.pivot_table(
    index='userId', columns='movieId', values='rating'
).fillna(0)

matrix_values = matrix.values
mean_ratings = np.true_divide(
    matrix_values.sum(axis=1),
    (matrix_values != 0).sum(axis=1)
)
mean_ratings = np.nan_to_num(mean_ratings)

matrix_normalized = matrix_values.copy().astype(float)
for i in range(matrix_normalized.shape[0]):
    mask = matrix_normalized[i] != 0
    matrix_normalized[i][mask] -= mean_ratings[i]

U, sigma, Vt = svds(csr_matrix(matrix_normalized), k=50)
sigma = np.diag(sigma)
predictions = np.dot(np.dot(U, sigma), Vt) + mean_ratings.reshape(-1, 1)
predictions_df = pd.DataFrame(predictions, columns=matrix.columns, index=matrix.index)
print("Modèle prêt !")

# ============================================
# SCHÉMAS PYDANTIC
# ============================================
class UserCreate(BaseModel):
    nom: str
    email: str
    mot_de_passe: str

class UserUpdate(BaseModel):
    nom: str
    email: str
    is_admin: bool

class UserCreateAdmin(BaseModel):
    nom: str
    email: str
    mot_de_passe: str
    is_admin: bool = False

class NoteCreate(BaseModel):
    movie_id: int
    rating: float

# ============================================
# FONCTIONS UTILITAIRES
# ============================================
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decoder_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

def get_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decoder_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user

# ============================================
# ROUTES PUBLIQUES
# ============================================
@app.get("/")
def accueil():
    return {"message": "Bienvenue sur l'API SETAAN !"}

@app.post("/inscription")
def inscription(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(Utilisateur).filter(Utilisateur.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    nouveau = Utilisateur(
        nom=user.nom,
        email=user.email,
        mot_de_passe=hacher_mot_de_passe(user.mot_de_passe)
    )
    db.add(nouveau)
    db.commit()
    db.refresh(nouveau)
    return {"message": "Compte créé avec succès", "id": nouveau.id}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.email == form.username).first()
    if not user or not verifier_mot_de_passe(form.password, user.mot_de_passe):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")
    token = creer_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "is_admin": user.is_admin}

@app.get("/films")
def get_films(search: str = ""):
    films = movies_df.copy()
    if search:
        films = films[films['title'].str.contains(search, case=False, na=False)]
    return films[['movieId', 'title', 'genres']].head(20).to_dict(orient='records')

@app.get("/film-image/{movie_id}")
def get_film_image(movie_id: int):
    # Vérifier d'abord si une image locale existe
    images_dir = "../data/images"
    for ext in ["jpg", "jpeg", "png", "webp"]:
        local_path = f"{images_dir}/{movie_id}.{ext}"
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()
            return {"image_url": f"data:image/{ext};base64,{image_data}"}

    # Sinon chercher sur TMDB
    try:
        links = pd.read_csv('../data/Archive/links.csv')
        link = links[links['movieId'] == movie_id]
        if link.empty or pd.isna(link.iloc[0]['tmdbId']):
            return {"image_url": None}
        tmdb_id = int(link.iloc[0]['tmdbId'])
        response = http_requests.get(
            f"https://api.themoviedb.org/3/movie/{tmdb_id}",
            params={"api_key": "d42b602fb161565dbfdc3af72b862362", "language": "fr-FR"}
        )
        data = response.json()
        poster_path = data.get("poster_path")
        if poster_path:
            return {"image_url": f"https://image.tmdb.org/t/p/w300{poster_path}"}
        return {"image_url": None}
    except:
        return {"image_url": None}

# ============================================
# ROUTES UTILISATEUR CONNECTÉ
# ============================================
@app.get("/profil")
def get_profil(user: Utilisateur = Depends(get_current_user)):
    return {
        "id": user.id,
        "nom": user.nom,
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at
    }

@app.get("/mes-films-notes")
def get_mes_films_notes(user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.utilisateur_id == user.id).all()
    return {note.movie_id: note.rating for note in notes}

@app.get("/mes-notes")
def get_mes_notes(user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.utilisateur_id == user.id).all()
    resultats = []
    for note in notes:
        film = movies_df[movies_df['movieId'] == note.movie_id]
        if not film.empty:
            resultats.append({
                "movie_id": note.movie_id,
                "title": film.iloc[0]['title'],
                "genres": film.iloc[0]['genres'],
                "rating": note.rating,
                "created_at": note.created_at
            })
    return resultats

@app.post("/notes")
def ajouter_note(note: NoteCreate, user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Note).filter(
        Note.utilisateur_id == user.id,
        Note.movie_id == note.movie_id
    ).first()
    if existing:
        existing.rating = note.rating
    else:
        nouvelle_note = Note(
            utilisateur_id=user.id,
            movie_id=note.movie_id,
            rating=note.rating
        )
        db.add(nouvelle_note)
    db.commit()
    return {"message": "Note enregistrée avec succès"}

@app.delete("/notes/{movie_id}")
def supprimer_note(movie_id: int, user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(
        Note.utilisateur_id == user.id,
        Note.movie_id == movie_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")
    db.delete(note)
    db.commit()
    return {"message": "Note supprimée avec succès"}

@app.get("/recommandations")
def get_recommandations(user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    notes_user = db.query(Note).filter(Note.utilisateur_id == user.id).all()
    if len(notes_user) == 0:
        return {"type": "vide", "data": []}
    bonnes_notes = [n for n in notes_user if n.rating >= 3.0]
    if len(bonnes_notes) == 0:
        return {"type": "mauvaises_notes", "data": []}
    user_ratings = {note.movie_id: note.rating for note in notes_user}
    films_notes = list(user_ratings.keys())
    similarities = {}
    for user_id in matrix.index:
        dataset_user_ratings = ratings_df[ratings_df['userId'] == user_id].set_index('movieId')['rating']
        films_communs = list(set(films_notes) & set(dataset_user_ratings.index))
        if len(films_communs) >= 1:
            vec1 = np.array([user_ratings[f] for f in films_communs])
            vec2 = np.array([dataset_user_ratings[f] for f in films_communs])
            norme1 = np.linalg.norm(vec1)
            norme2 = np.linalg.norm(vec2)
            if norme1 > 0 and norme2 > 0:
                similarite = np.dot(vec1, vec2) / (norme1 * norme2)
                similarities[user_id] = similarite
    if len(similarities) == 0:
        return {"type": "vide", "data": []}
    top_users = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:20]
    top_user_ids = [u[0] for u in top_users]
    notes_similaires = ratings_df[
        (ratings_df['userId'].isin(top_user_ids)) &
        (~ratings_df['movieId'].isin(films_notes)) &
        (ratings_df['rating'] >= 3.0)
    ]
    if notes_similaires.empty:
        return {"type": "vide", "data": []}
    scores = {}
    for _, row in notes_similaires.iterrows():
        movie_id = row['movieId']
        rating = row['rating']
        sim = similarities.get(row['userId'], 0)
        if movie_id not in scores:
            scores[movie_id] = {'total': 0, 'poids': 0}
        scores[movie_id]['total'] += rating * sim
        scores[movie_id]['poids'] += sim
    scores_finaux = {mid: s['total'] / s['poids'] for mid, s in scores.items() if s['poids'] > 0}
    top_films = sorted(scores_finaux.items(), key=lambda x: x[1], reverse=True)[:10]
    top_ids = [f[0] for f in top_films]
    resultats = movies_df[movies_df['movieId'].isin(top_ids)][['movieId', 'title', 'genres']]
    return {"type": "personnalisees", "data": resultats.to_dict(orient='records')}

# ============================================
# ROUTES ADMIN
# ============================================
@app.get("/admin/stats")
def get_stats(admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    nb_users = db.query(Utilisateur).count()
    nb_notes = db.query(Note).count()
    nb_admins = db.query(Utilisateur).filter(Utilisateur.is_admin == True).count()
    return {
        "nb_utilisateurs": nb_users,
        "nb_notes": nb_notes,
        "nb_admins": nb_admins,
        "nb_films": len(movies_df)
    }

@app.get("/admin/utilisateurs")
def get_utilisateurs(admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(Utilisateur).all()
    return [
        {
            "id": u.id,
            "nom": u.nom,
            "email": u.email,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
            "nb_notes": len(u.notes)
        }
        for u in users
    ]

@app.post("/admin/utilisateurs")
def creer_utilisateur_admin(user: UserCreateAdmin, admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    existing = db.query(Utilisateur).filter(Utilisateur.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    nouveau = Utilisateur(
        nom=user.nom,
        email=user.email,
        mot_de_passe=hacher_mot_de_passe(user.mot_de_passe),
        is_admin=user.is_admin
    )
    db.add(nouveau)
    db.commit()
    db.refresh(nouveau)
    return {"message": "Utilisateur créé avec succès", "id": nouveau.id}

@app.put("/admin/utilisateurs/{user_id}")
def modifier_utilisateur(user_id: int, user_data: UserUpdate, admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.nom = user_data.nom
    user.email = user_data.email
    user.is_admin = user_data.is_admin
    db.commit()
    return {"message": "Utilisateur modifié avec succès"}

@app.delete("/admin/utilisateurs/{user_id}")
def supprimer_utilisateur(user_id: int, admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    db.query(Note).filter(Note.utilisateur_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}



    # ============================================
# SCHÉMAS FILMS
# ============================================
class FilmCreate(BaseModel):
    title: str
    genres: str
    tmdb_id: int | None = None
# ============================================
# ROUTES ADMIN FILMS
# ============================================
@app.get("/admin/films")
def get_films_admin(search: str = "", admin: Utilisateur = Depends(get_admin_user)):
    films = movies_df.copy()
    if search:
        films = films[films['title'].str.contains(search, case=False, na=False)]
    return films[['movieId', 'title', 'genres']].head(50).to_dict(orient='records')

@app.delete("/admin/films/{movie_id}")
def supprimer_film(movie_id: int, admin: Utilisateur = Depends(get_admin_user), db: Session = Depends(get_db)):
    global movies_df
    if movie_id not in movies_df['movieId'].values:
        raise HTTPException(status_code=404, detail="Film introuvable")
    movies_df = movies_df[movies_df['movieId'] != movie_id]
    movies_df.to_csv('../data/Archive/movies.csv', index=False)
    return {"message": "Film supprimé avec succès"}



  

@app.post("/admin/films")
def ajouter_film(film: FilmCreate, admin: Utilisateur = Depends(get_admin_user)):
    global movies_df
    nouveau_id = int(movies_df['movieId'].max()) + 1
    nouveau_film = pd.DataFrame([{
        'movieId': nouveau_id,
        'title': film.title,
        'genres': film.genres
    }])
    movies_df = pd.concat([movies_df, nouveau_film], ignore_index=True)
    movies_df.to_csv('../data/Archive/movies.csv', index=False)

    # Sauvegarder le tmdb_id dans links.csv
    if film.tmdb_id:
        links = pd.read_csv('../data/Archive/links.csv')
        nouveau_link = pd.DataFrame([{
            'movieId': nouveau_id,
            'imdbId': None,
            'tmdbId': film.tmdb_id
        }])
        links = pd.concat([links, nouveau_link], ignore_index=True)
        links.to_csv('../data/Archive/links.csv', index=False)

    return {"message": "Film ajouté avec succès", "movieId": nouveau_id}





@app.get("/admin/recherche-tmdb")
def recherche_tmdb(titre: str, admin: Utilisateur = Depends(get_admin_user)):
    try:
        response = http_requests.get(
            "https://api.themoviedb.org/3/search/movie",
            params={
                "api_key": "d42b602fb161565dbfdc3af72b862362",
                "query": titre,
                "language": "fr-FR"
            }
        )
        data = response.json()
        resultats = []
        for film in data.get('results', [])[:5]:
            resultats.append({
                "tmdb_id": film['id'],
                "title": film.get('title', ''),
                "year": film.get('release_date', '')[:4] if film.get('release_date') else '',
                "poster": f"https://image.tmdb.org/t/p/w300{film['poster_path']}" if film.get('poster_path') else None,
                "overview": film.get('overview', '')[:100]
            })
        return resultats
    except:
        return []
    
@app.post("/admin/films/upload-image")
def upload_image_film(data: dict, admin: Utilisateur = Depends(get_admin_user)):
    movie_id = data.get("movie_id")
    image_base64 = data.get("image_base64")
    extension = data.get("extension", "jpg")

    if not movie_id or not image_base64:
        raise HTTPException(status_code=400, detail="Données manquantes")

    # Créer le dossier images s'il n'existe pas
    images_dir = "../data/images"
    os.makedirs(images_dir, exist_ok=True)

    # Décoder et sauvegarder l'image
    image_data = base64.b64decode(image_base64.split(",")[1] if "," in image_base64 else image_base64)
    image_path = f"{images_dir}/{movie_id}.{extension}"
    with open(image_path, "wb") as f:
        f.write(image_data)

    return {"message": "Image uploadée avec succès", "path": image_path}