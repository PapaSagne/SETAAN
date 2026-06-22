from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt

SECRET_KEY = "setaan_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hacher_mot_de_passe(mot_de_passe: str):
    return bcrypt.hashpw(mot_de_passe.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verifier_mot_de_passe(mot_de_passe: str, hash: str):
    return bcrypt.checkpw(mot_de_passe.encode('utf-8'), hash.encode('utf-8'))

def creer_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decoder_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None