# app/routes/api_clientes.py
from flask import Blueprint, request, jsonify
from ..db import get_db

api_clientes_bp = Blueprint("api_clientes", __name__, url_prefix="/api/clientes")

@api_clientes_bp.get("")
def api_clientes_list():
    q = (request.args.get("q") or "").strip()
    conn = get_db()
    with conn.cursor() as cur:
        if q:
            cur.execute(
                "SELECT id, nombre, telefono, email, creado_en FROM clientes WHERE nombre LIKE %s OR telefono LIKE %s OR email LIKE %s ORDER BY id DESC",
                (f"%{q}%", f"%{q}%", f"%{q}%")
            )
        else:
            cur.execute("SELECT id, nombre, telefono, email, creado_en FROM clientes ORDER BY id DESC")
        rows = cur.fetchall()
    return jsonify({"ok": True, "items": rows})

@api_clientes_bp.post("")
def api_clientes_create():
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    telefono = (data.get("telefono") or "").strip() or None
    email = (data.get("email") or "").strip() or None

    if not nombre:
        return jsonify({"ok": False, "msg": "El nombre es requerido"}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO clientes(nombre, telefono, email) VALUES (%s, %s, %s)",
                (nombre, telefono, email)
            )
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        conn.rollback()
        # Teléfono único: si choca, devuelve mensaje entendible
        return jsonify({"ok": False, "msg": "No se pudo guardar (¿teléfono duplicado?)"}), 400

@api_clientes_bp.put("/<int:cliente_id>")
def api_clientes_update(cliente_id):
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    telefono = (data.get("telefono") or "").strip() or None
    email = (data.get("email") or "").strip() or None

    if not nombre:
        return jsonify({"ok": False, "msg": "El nombre es requerido"}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE clientes SET nombre=%s, telefono=%s, email=%s WHERE id=%s",
                (nombre, telefono, email, cliente_id)
            )
        conn.commit()
        return jsonify({"ok": True})
    except Exception:
        conn.rollback()
        return jsonify({"ok": False, "msg": "No se pudo actualizar (¿teléfono duplicado?)"}), 400

@api_clientes_bp.delete("/<int:cliente_id>")
def api_clientes_delete(cliente_id):
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM clientes WHERE id=%s", (cliente_id,))
    conn.commit()
    return jsonify({"ok": True})
