from flask import Blueprint, request, jsonify
from ..db import get_db

api_hist_bp = Blueprint("api_historial", __name__, url_prefix="/api/historial")

@api_hist_bp.get("/pedidos")
def hist_pedidos():
    estado = request.args.get("estado")  # ABIERTO|PAGADO|CANCELADO|None
    f_ini = request.args.get("desde")    # 'YYYY-MM-DD' opc.
    f_fin = request.args.get("hasta")    # 'YYYY-MM-DD' opc.

    where = []
    args = []
    if estado:
        where.append("p.estado = %s")
        args.append(estado)
    if f_ini:
        where.append("DATE(p.fecha) >= %s")
        args.append(f_ini)
    if f_fin:
        where.append("DATE(p.fecha) <= %s")
        args.append(f_fin)

    sql = """
        SELECT p.id, DATE(p.fecha) AS fecha, p.estado, p.total,
               c.nombre AS cliente
        FROM pedidos p
        LEFT JOIN clientes c ON c.id = p.cliente_id
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY p.id DESC LIMIT 500"

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(sql, args)
        rows = cur.fetchall()
    return jsonify({"ok": True, "items": rows})

@api_hist_bp.get("/pagos")
def hist_pagos():
    f_ini = request.args.get("desde")
    f_fin = request.args.get("hasta")
    where = []
    args = []
    if f_ini:
        where.append("DATE(pg.fecha) >= %s")
        args.append(f_ini)
    if f_fin:
        where.append("DATE(pg.fecha) <= %s")
        args.append(f_fin)

    sql = """
        SELECT pg.id, DATE(pg.fecha) AS fecha, pg.metodo, pg.monto,
               pg.pedido_id, c.nombre AS cliente
        FROM pagos pg
        JOIN pedidos p ON p.id = pg.pedido_id
        LEFT JOIN clientes c ON c.id = p.cliente_id
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY pg.id DESC LIMIT 500"

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(sql, args)
        rows = cur.fetchall()
    return jsonify({"ok": True, "items": rows})
