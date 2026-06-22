from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base de données SQLite (fichier local, pas besoin d'installation)
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/setaan_db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Fonction pour obtenir la session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()