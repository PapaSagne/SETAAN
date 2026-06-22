import pandas as pd
import numpy as np
from scipy.sparse.linalg import svds
from scipy.sparse import csr_matrix
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import math

print("=" * 50)
print("   ÉVALUATION DU MODÈLE SVD — SETAAN")
print("=" * 50)

# ============================================
# 1. CHARGEMENT DES DONNÉES
# ============================================
ratings = pd.read_csv('../data/Archive/ratings.csv')
movies = pd.read_csv('../data/Archive/movies.csv')
print(f"\n✅ Dataset chargé : {len(ratings)} notes")

# ============================================
# 2. DIVISION TRAIN / TEST (80% / 20%)
# ============================================
train_data, test_data = train_test_split(ratings, test_size=0.2, random_state=42)
print(f"✅ Entraînement : {len(train_data)} notes")
print(f"✅ Test         : {len(test_data)} notes")

# ============================================
# 3. CONSTRUCTION DE LA MATRICE D'ENTRAÎNEMENT
# ============================================
matrix = train_data.pivot_table(
    index='userId', columns='movieId', values='rating'
).fillna(0)

matrix_values = matrix.values

# Normalisation par utilisateur (soustraction de la moyenne)
mean_ratings = np.true_divide(
    matrix_values.sum(axis=1),
    (matrix_values != 0).sum(axis=1)
)
mean_ratings = np.nan_to_num(mean_ratings)

matrix_normalized = matrix_values.copy().astype(float)
for i in range(matrix_normalized.shape[0]):
    mask = matrix_normalized[i] != 0
    matrix_normalized[i][mask] -= mean_ratings[i]

# ============================================
# 4. ENTRAÎNEMENT SVD
# ============================================
print("\n⏳ Entraînement du modèle SVD...")
U, sigma, Vt = svds(csr_matrix(matrix_normalized), k=50)
sigma = np.diag(sigma)
predictions = np.dot(np.dot(U, sigma), Vt) + mean_ratings.reshape(-1, 1)
predictions_df = pd.DataFrame(
    predictions,
    columns=matrix.columns,
    index=matrix.index
)
print("✅ Modèle entraîné !")

# ============================================
# 5. CALCUL DU RMSE ET MAE
# ============================================
print("\n⏳ Calcul des métriques...")
actuals = []
predicted = []

for _, row in test_data.iterrows():
    user_id = row['userId']
    movie_id = row['movieId']
    actual_rating = row['rating']

    if user_id in predictions_df.index and movie_id in predictions_df.columns:
        pred_rating = predictions_df.loc[user_id, movie_id]
        pred_rating = max(0.5, min(5.0, pred_rating))
        actuals.append(actual_rating)
        predicted.append(pred_rating)

rmse = math.sqrt(mean_squared_error(actuals, predicted))
mae = np.mean(np.abs(np.array(actuals) - np.array(predicted)))

# ============================================
# 6. CALCUL PRÉCISION / RAPPEL
# ============================================
seuil = 3.5
vrais_positifs  = sum(1 for a, p in zip(actuals, predicted) if a >= seuil and p >= seuil)
faux_positifs   = sum(1 for a, p in zip(actuals, predicted) if a < seuil  and p >= seuil)
faux_negatifs   = sum(1 for a, p in zip(actuals, predicted) if a >= seuil and p < seuil)

precision = vrais_positifs / (vrais_positifs + faux_positifs) if (vrais_positifs + faux_positifs) > 0 else 0
rappel    = vrais_positifs / (vrais_positifs + faux_negatifs) if (vrais_positifs + faux_negatifs) > 0 else 0
f1        = 2 * precision * rappel / (precision + rappel) if (precision + rappel) > 0 else 0

# ============================================
# 7. AFFICHAGE DES RÉSULTATS
# ============================================
print("\n" + "=" * 50)
print("   RÉSULTATS DE L'ÉVALUATION")
print("=" * 50)
print(f"\n📊 Nombre de prédictions testées : {len(actuals)}")
print(f"\n🎯 RMSE  (erreur quadratique)  : {rmse:.4f}")
print(f"🎯 MAE   (erreur absolue)      : {mae:.4f}")
print(f"\n🎯 Précision                   : {precision:.4f} ({precision*100:.1f}%)")
print(f"🎯 Rappel                      : {rappel:.4f} ({rappel*100:.1f}%)")
print(f"🎯 F1-Score                    : {f1:.4f} ({f1*100:.1f}%)")

print("\n" + "=" * 50)
print("   INTERPRÉTATION")
print("=" * 50)

if rmse < 0.9:
    print("✅ RMSE excellent  : le modèle prédit avec très bonne précision")
elif rmse < 1.2:
    print("✅ RMSE bon        : le modèle prédit avec bonne précision")
else:
    print("⚠️  RMSE moyen     : le modèle peut être amélioré")

if precision > 0.7:
    print("✅ Précision bonne : peu de mauvaises recommandations")
else:
    print("⚠️  Précision faible: quelques mauvaises recommandations")

if rappel > 0.7:
    print("✅ Rappel bon      : la plupart des bons films sont trouvés")
else:
    print("⚠️  Rappel faible  : certains bons films sont manqués")

print("=" * 50)