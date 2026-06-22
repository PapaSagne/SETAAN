import pandas as pd

# Chargement des notes
ratings = pd.read_csv('../data/Archive/ratings.csv')

# Chargement des films
movies = pd.read_csv('../data/Archive/movies.csv')

# Informations générales
print("=== DATASET MOVIELENS ===")
print(f"Nombre de notes      : {len(ratings)}")
print(f"Nombre d'utilisateurs: {ratings['userId'].nunique()}")
print(f"Nombre de films      : {ratings['movieId'].nunique()}")
print(f"Note minimale        : {ratings['rating'].min()}")
print(f"Note maximale        : {ratings['rating'].max()}")
print(f"Note moyenne         : {ratings['rating'].mean():.2f}")
print()

# Les 5 premiers films
print("=== APERÇU DES FILMS ===")
print(movies.head())
print()

# Les 5 premières notes
print("=== APERÇU DES NOTES ===")
print(ratings.head())
print()

# Les genres disponibles
print("=== GENRES DISPONIBLES ===")
genres = set()
for g in movies['genres'].str.split('|'):
    genres.update(g)
print(sorted(genres))