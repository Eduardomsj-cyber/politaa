import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")

    # Datos de la DB cuando la app corre en Railway
    DB_HOST = os.environ.get("MYSQLHOST", "mysql.railway.internal")
    DB_PORT = int(os.environ.get("MYSQLPORT", "3306"))
    DB_USER = os.environ.get("MYSQLUSER", "root")
    DB_PASSWORD = os.environ.get("MYSQLPASSWORD", "fGOloFvTzuXyEUbIcJxFjaFbyPYtOXLg")
    DB_NAME = os.environ.get("MYSQLDATABASE", "railway")
