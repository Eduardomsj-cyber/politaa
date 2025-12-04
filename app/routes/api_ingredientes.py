from flask import Blueprint, request, jsonify
from ..db import get_db

api_ing_bp = Blueprint("api_ingredientes", __name__, url_prefix="/api/ingredientes")

@api_ing_bp.get("")
def listar():
    q = (request.args.get("q") or "").strip()
    conn = get_db()
    with conn.cursor() as cur:
        if q:
            cur.execute("""SELECT id, nombre, unidad
                           FROM ingredientes
                           WHERE nombre LIKE %s
                           ORDER BY nombre ASC""", (f"%{q}%",))
        else:
            cur.execute("SELECT id, nombre, unidad FROM ingredientes ORDER BY id DESC")
        rows = cur.fetchall()
    return jsonify({"ok": True, "items": rows})

@api_ing_bp.post("")
def crear():
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    unidad = (data.get("unidad") or "pz").strip()
    if not nombre:
        return jsonify({"ok": False, "msg": "Nombre requerido"}), 400
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO ingredientes(nombre, unidad) VALUES(%s,%s)", (nombre, unidad))
        iid = cur.lastrowid
    conn.commit()
    return jsonify({"ok": True, "id": iid})

@api_ing_bp.put("/<int:iid>")
def editar(iid):
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    unidad = (data.get("unidad") or "pz").strip()
    if not nombre:
        return jsonify({"ok": False, "msg": "Nombre requerido"}), 400
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("UPDATE ingredientes SET nombre=%s, unidad=%s WHERE id=%s",
                    (nombre, unidad, iid))
    conn.commit()
    return jsonify({"ok": True})

@api_ing_bp.delete("/<int:iid>")
def borrar(iid):
    conn = get_db()
    with conn.cursor() as cur:
        # Si luego conectamos recetas, ON DELETE CASCADE ya protege
        cur.execute("DELETE FROM ingredientes WHERE id=%s", (iid,))
    conn.commit()
    return jsonify({"ok": True})
