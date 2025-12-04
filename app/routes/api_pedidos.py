from flask import Blueprint, request, jsonify
from ..db import get_db

api_pedidos_bp = Blueprint("api_pedidos", __name__, url_prefix="/api/pedidos")

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def _recalcular_total(pedido_id, conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COALESCE(SUM(precio*cantidad),0) AS total
            FROM pedido_linea WHERE pedido_id=%s
        """, (pedido_id,))
        total = cur.fetchone()["total"]
        cur.execute("UPDATE pedidos SET total=%s WHERE id=%s", (total, pedido_id))
    conn.commit()
    return total

# ---------------------------------------------------------
# Listado y creación
# ---------------------------------------------------------
@api_pedidos_bp.get("")
def listar_pedidos():
    estado = request.args.get("estado")  # ABIERTO|PAGADO|CANCELADO|None
    conn = get_db()
    with conn.cursor() as cur:
        if estado:
            cur.execute("""
                SELECT p.id, c.nombre AS cliente, p.fecha, p.estado, p.total
                FROM pedidos p
                LEFT JOIN clientes c ON c.id=p.cliente_id
                WHERE p.estado=%s
                ORDER BY p.id DESC
            """, (estado,))
        else:
            cur.execute("""
                SELECT p.id, c.nombre AS cliente, p.fecha, p.estado, p.total
                FROM pedidos p
                LEFT JOIN clientes c ON c.id=p.cliente_id
                ORDER BY p.id DESC
            """)
        rows = cur.fetchall()
    return jsonify({"ok": True, "items": rows})

@api_pedidos_bp.post("")
def crear_pedido():
    data = request.get_json() or {}
    cliente_id = data.get("cliente_id")  # puede ser None
    usuario_id = data.get("usuario_id")  # opcional, si quieres registrar cajero

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO pedidos(cliente_id, usuario_id) VALUES (%s,%s)",
            (cliente_id, usuario_id)
        )
        pid = cur.lastrowid
    conn.commit()
    return jsonify({"ok": True, "pedido_id": pid})

# ---------------------------------------------------------
# Detalle
# ---------------------------------------------------------
@api_pedidos_bp.get("/<int:pid>")
def detalle_pedido(pid):
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT p.id, p.fecha, p.estado, p.total,
                   c.id AS cliente_id, c.nombre AS cliente
            FROM pedidos p
            LEFT JOIN clientes c ON c.id=p.cliente_id
            WHERE p.id=%s
        """, (pid,))
        pedido = cur.fetchone()
        if not pedido:
            return jsonify({"ok": False, "msg": "Pedido no existe"}), 404

        cur.execute("""
            SELECT l.id, l.producto_id, pr.nombre, l.precio, l.cantidad,
                   (l.precio*l.cantidad) AS subtotal
            FROM pedido_linea l
            JOIN productos pr ON pr.id=l.producto_id
            WHERE l.pedido_id=%s
            ORDER BY l.id ASC
        """, (pid,))
        lineas = cur.fetchall()

        cur.execute("""
            SELECT id, metodo, monto, fecha
            FROM pagos WHERE pedido_id=%s ORDER BY id ASC
        """, (pid,))
        pagos = cur.fetchall()

    return jsonify({"ok": True, "pedido": pedido, "lineas": lineas, "pagos": pagos})

# ---------------------------------------------------------
# Líneas de pedido
# ---------------------------------------------------------
@api_pedidos_bp.post("/<int:pid>/lineas")
def agregar_linea(pid):
    data = request.get_json() or {}
    producto_id = data.get("producto_id")
    cantidad = int(data.get("cantidad", 1))
    if not producto_id or cantidad <= 0:
        return jsonify({"ok": False, "msg": "Producto y cantidad > 0"}), 400

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT precio FROM productos WHERE id=%s", (producto_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"ok": False, "msg": "Producto no existe"}), 404
        precio = row["precio"]

        cur.execute("""
            INSERT INTO pedido_linea(pedido_id, producto_id, precio, cantidad)
            VALUES (%s,%s,%s,%s)
        """, (pid, producto_id, precio, cantidad))

    conn.commit()
    total = _recalcular_total(pid, conn)  # Actualiza el total del pedido
    return jsonify({"ok": True, "total": float(total)})

@api_pedidos_bp.put("/<int:pid>/lineas/<int:linea_id>")
def editar_linea(pid, linea_id):
    data = request.get_json() or {}
    try:
        precio = float(data.get("precio"))
        cantidad = int(data.get("cantidad"))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "msg": "Valores inválidos"}), 400

    if cantidad <= 0 or precio < 0:
        return jsonify({"ok": False, "msg": "Valores inválidos"}), 400

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE pedido_linea SET precio=%s, cantidad=%s
            WHERE id=%s AND pedido_id=%s
        """, (precio, cantidad, linea_id, pid))
    conn.commit()
    total = _recalcular_total(pid, conn)
    return jsonify({"ok": True, "total": float(total)})

@api_pedidos_bp.delete("/<int:pid>/lineas/<int:linea_id>")
def borrar_linea(pid, linea_id):
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM pedido_linea WHERE id=%s AND pedido_id=%s", (linea_id, pid))
    conn.commit()
    total = _recalcular_total(pid, conn)
    return jsonify({"ok": True, "total": float(total)})

# ---------------------------------------------------------
# Pagos
# ---------------------------------------------------------
@api_pedidos_bp.post("/<int:pid>/pagos")
def agregar_pago(pid):
    data = request.get_json() or {}
    metodo = (data.get("metodo") or "").upper()
    try:
        monto = float(data.get("monto", 0))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "msg": "Monto inválido"}), 400

    if metodo not in ("EFECTIVO", "TARJETA", "TRANSFERENCIA") or monto <= 0:
        return jsonify({"ok": False, "msg": "Pago inválido"}), 400

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO pagos(pedido_id, metodo, monto) VALUES (%s,%s,%s)",
            (pid, metodo, monto)
        )
        # si el total pagado >= total pedido -> marcar como PAGADO
        cur.execute("SELECT total FROM pedidos WHERE id=%s", (pid,))
        total = cur.fetchone()["total"]
        cur.execute("SELECT COALESCE(SUM(monto),0) as pagado FROM pagos WHERE pedido_id=%s", (pid,))
        pagado = cur.fetchone()["pagado"]
        if pagado >= total and total > 0:
            cur.execute("UPDATE pedidos SET estado='PAGADO' WHERE id=%s", (pid,))
    conn.commit()
    return jsonify({"ok": True})

# ---------------------------------------------------------
# Actualización de pedido (cliente_id)
# ---------------------------------------------------------
@api_pedidos_bp.put("/<int:pid>")
def actualizar_pedido(pid):
    """
    Actualiza campos simples del pedido.
    Por ahora soporta: cliente_id (int | null | "").
    """
    data = request.get_json() or {}
    cliente_id = data.get("cliente_id", None)

    conn = get_db()
    with conn.cursor() as cur:
        # Normaliza a NULL cuando venga vacío
        if cliente_id in ("", None):
            cliente_id = None
        else:
            # Debe ser int válido
            try:
                cliente_id = int(cliente_id)
            except (TypeError, ValueError):
                return jsonify({"ok": False, "msg": "cliente_id inválido"}), 400

            # Verifica que exista
            cur.execute("SELECT id FROM clientes WHERE id=%s", (cliente_id,))
            if not cur.fetchone():
                return jsonify({"ok": False, "msg": "Cliente no existe"}), 404

        # Aplica la actualización
        cur.execute("UPDATE pedidos SET cliente_id=%s WHERE id=%s", (cliente_id, pid))

    conn.commit()
    return jsonify({"ok": True})
# ---------------------------------------------------------
# Eliminar pedido
# ---------------------------------------------------------
@api_pedidos_bp.delete("/<int:pid>")
def eliminar_pedido(pid):
    conn = get_db()
    with conn.cursor() as cur:
        # Eliminar todas las líneas de pedido relacionadas
        cur.execute("DELETE FROM pedido_linea WHERE pedido_id=%s", (pid,))
        
        # Eliminar el pedido
        cur.execute("DELETE FROM pedidos WHERE id=%s", (pid,))

    conn.commit()
    return jsonify({"ok": True, "msg": "Pedido eliminado exitosamente"}), 200
