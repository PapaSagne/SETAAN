import pandas as pd
import numpy as np
from scipy.sparse.linalg import svds
from scipy.sparse import csr_matrix

# ============================================
# 1. CHARGEMENT DES DONNÉES
# ============================================
ratings = pd.read_csv('../data/Archive/ratings.csv')
movies = pd.read_csv('../data/Archive/movies.csv')

print("Données chargées !")

# ============================================
# 2. CONSTRUCTION DE LA MATRICE UTILISATEUR-FILM
# ============================================
matrix = ratings.pivot_table(
    index='userId',
    columns='movieId',
    values='rating'
).fillna(0)

print(f"Matrice créée : {matrix.shape[0]} utilisateurs x {matrix.shape[1]} films")

# ============================================
# 3. NORMALISATION (soustraire la moyenne)
# ============================================
matrix_values = matrix.values
mean_ratings = np.mean(matrix_values, axis=1)
matrix_normalized = matrix_values - mean_ratings.reshape(-1, 1)

# ============================================
# 4. APPLICATION DE SVD
# ============================================
print("Entraînement du modèle SVD...")
U, sigma, Vt = svds(csr_matrix(matrix_normalized), k=50)
sigma = np.diag(sigma)
print("Modèle entraîné !")

# ============================================
# 5. RECONSTRUCTION DE LA MATRICE DE PRÉDICTIONS
# ============================================
predictions = np.dot(np.dot(U, sigma), Vt) + mean_ratings.reshape(-1, 1)
predictions_df = pd.DataFrame(
    predictions,
    columns=matrix.columns,
    index=matrix.index
)

# ============================================
# 6. FONCTION DE RECOMMANDATION
# ============================================
def recommander_films(user_id, nb_recommandations=10):
    # Films déjà notés par l'utilisateur
    films_notes = ratings[ratings['userId'] == user_id]['movieId'].tolist()

    # Prédictions pour cet utilisateur
    user_predictions = predictions_df.loc[user_id].drop(films_notes, errors='ignore')

    # Trier par score décroissant
    top_films = user_predictions.sort_values(ascending=False).head(nb_recommandations)

    # Récupérer les titres
    resultats = movies[movies['movieId'].isin(top_films.index)][['movieId', 'title', 'genres']]
    resultats = resultats.set_index('movieId')
    resultats['score'] = top_films

    return resultats.sort_values('score', ascending=False)

# ============================================
# 7. TEST
# ============================================
print()
print("=== TEST : Recommandations pour l'utilisateur 1 ===")
print(recommander_films(user_id=1, nb_recommandations=10))