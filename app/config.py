import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")

    # Datos de la DB de Railway
    DB_HOST = os.environ.get("DB_HOST", "mysql.railway.internal")  # MYSQLHOST
    DB_PORT = int(os.environ.get("DB_PORT", "3306"))               # MYSQLPORT
    DB_USER = os.environ.get("DB_USER", "root")                    # MYSQLUSER
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "sRGTfmzxPmVNXckNTrqXkjTMYMmwFFMY")                # MYSQLPASSWORD
    DB_NAME = os.environ.get("DB_NAME", "railway")                 # MYSQLDATABASE
