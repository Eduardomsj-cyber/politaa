import os
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")
    DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.environ.get("DB_PORT", "3306"))
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "1297")
    DB_NAME = os.environ.get("DB_NAME", "foodpos")
