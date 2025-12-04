import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")

    # Datos de la DB de Railway
    DB_HOST = os.environ.get("DB_HOST", "tramway.proxy.rlwy.net")  # MYSQLHOST
    DB_PORT = int(os.environ.get("DB_PORT", "27269"))               # MYSQLPORT
    DB_USER = os.environ.get("DB_USER", "root")                    # MYSQLUSER
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "fGOloFvTzuXyEUbIcJxFjaFbyPYtOXLg")                # MYSQLPASSWORD
    DB_NAME = os.environ.get("DB_NAME", "railway")                 # MYSQLDATABASE
