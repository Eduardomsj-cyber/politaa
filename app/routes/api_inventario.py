from flask import Blueprint, request, jsonify
from pymysql.err import IntegrityError
from ..db import get_db

api_inv_bp = Blueprint("api_inventario", __name__, url_prefix="/api/productos")

# --------- LISTAR PRODUCTOS ----------
@api_inv_bp.get("")
def productos_list():
    q = (request.args.get("q") or "").strip()
    conn = get_db()
    with conn.cursor() as cur:
        if q:
            cur.execute("""
                SELECT id, nombre, precio, stock, activo, imagen_url
                FROM productos
                WHERE nombre LIKE %s
                ORDER BY id DESC
            """, (f"%{q}%",))
        else:
            cur.execute("""
                SELECT id, nombre, precio, stock, activo, imagen_url
                FROM productos
                ORDER BY id DESC
            """)
        rows = cur.fetchall()
    for r in rows:
        r["precio"] = float(r["precio"])
        r["stock"] = int(r["stock"])
        r["activo"] = bool(r["activo"])
    return jsonify({"ok": True, "items": rows})


# --------- CREAR PRODUCTO ----------
@api_inv_bp.post("")
def productos_create():
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    precio = data.get("precio")
    stock = data.get("stock", 0)
    activo = 1 if data.get("activo", True) else 0
    imagen_url = data.get("imagen_url", "")

    if not nombre:
        return jsonify({"ok": False, "msg": "El nombre es requerido"}), 400

    try:
        precio = float(precio)
        stock = int(stock)
        if precio < 0 or stock < 0:
            raise ValueError()
    except Exception:
        return jsonify({"ok": False, "msg": "Precio/stock inválidos"}), 400

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO productos (nombre, precio, stock, activo, imagen_url)
            VALUES (%s, %s, %s, %s, %s)
        """, (nombre, precio, stock, activo, imagen_url))
    conn.commit()
    return jsonify({"ok": True})


# --------- ACTUALIZAR PRODUCTO ----------
@api_inv_bp.put("/<int:pid>")
def productos_update(pid):
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    precio = data.get("precio")
    stock = data.get("stock", 0)
    activo = 1 if data.get("activo", True) else 0
    imagen_url = data.get("imagen_url", "")

    if not nombre:
        return jsonify({"ok": False, "msg": "El nombre es requerido"}), 400

    try:
        precio = float(precio)
        stock = int(stock)
        if precio < 0 or stock < 0:
            raise ValueError()
    except Exception:
        return jsonify({"ok": False, "msg": "Precio/stock inválidos"}), 400

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE productos
            SET nombre = %s, precio = %s, stock = %s, activo = %s, imagen_url = %s
            WHERE id = %s
        """, (nombre, precio, stock, activo, imagen_url, pid))
    conn.commit()
    return jsonify({"ok": True})


# --------- TOGGLE ACTIVO ----------
@api_inv_bp.patch("/<int:pid>/toggle")
def productos_toggle(pid):
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("UPDATE productos SET activo = NOT activo WHERE id = %s", (pid,))
    conn.commit()
    return jsonify({"ok": True})


# --------- BORRAR PRODUCTO ----------
@api_inv_bp.delete("/<int:pid>")
def productos_delete(pid):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            # ¿Usado en líneas de pedido?
            cur.execute("SELECT COUNT(*) AS c FROM pedido_linea WHERE producto_id = %s", (pid,))
            usado_pl = cur.fetchone()["c"]

            # ¿Usado como producto de una receta?
            cur.execute("SELECT COUNT(*) AS c FROM recetas WHERE producto_id = %s", (pid,))
            usado_rec = cur.fetchone()["c"]

            if (usado_pl or usado_rec):
                return jsonify({
                    "ok": False,
                    "msg": "No se puede borrar: el producto ya fue utilizado. "
                           "Sugerencia: desactívalo."
                }), 409

            # Si quisieras limpiar recetas huérfanas explícitamente:
            cur.execute("DELETE FROM recetas WHERE producto_id = %s", (pid,))

            # Borrar el producto
            cur.execute("DELETE FROM productos WHERE id = %s", (pid,))
        conn.commit()
        return jsonify({"ok": True})

    except IntegrityError:
        conn.rollback()
        return jsonify({
            "ok": False,
            "msg": "No se puede borrar por restricciones de referencias. Desactívalo."
        }), 409
    except Exception:
        conn.rollback()
        return jsonify({"ok": False, "msg": "Error interno al borrar"}), 500
