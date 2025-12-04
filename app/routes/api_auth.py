# app/routes/api_auth.py
from flask import Blueprint, request, jsonify, session, redirect, url_for, current_app
from ..db import get_db
from pymysql.err import OperationalError, ProgrammingError

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

@auth_bp.post("/login")
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"ok": False, "msg": "Faltan credenciales"}), 400

    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, username, rol
                FROM usuarios
                WHERE username=%s AND password_hash = SHA2(%s, 256)
                LIMIT 1
                """,
                (username, password),
            )
            row = cur.fetchone()
    except OperationalError as e:
        current_app.logger.exception("DB connection error")
        return jsonify({"ok": False, "msg": "Error de conexión a la base de datos"}), 500
    except ProgrammingError as e:
        current_app.logger.exception("SQL error")
        return jsonify({"ok": False, "msg": "Error de consulta SQL (revisa el esquema)"}), 500
    except Exception as e:
        current_app.logger.exception("Unexpected error in /api/login")
        return jsonify({"ok": False, "msg": "Error interno"}), 500

    if not row:
        return jsonify({"ok": False, "msg": "Usuario o contraseña incorrectos"}), 401

    session["user"] = {"id": row["id"], "username": row["username"], "rol": row["rol"]}
    return jsonify({"ok": True})

@auth_bp.get("/logout")
def api_logout():
    session.pop("user", None)
    return redirect(url_for("pages.login"))

# util para probar rápido
@auth_bp.get("/ping")
def api_ping():
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            one = cur.fetchone()
        return jsonify({"ok": True, "db": bool(one and one.get("ok") == 1)})
    except Exception:
        current_app.logger.exception("Ping error")
        return jsonify({"ok": False, "db": False}), 500
