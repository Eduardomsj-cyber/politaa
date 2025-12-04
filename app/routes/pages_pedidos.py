from flask import Blueprint, render_template, session, redirect, url_for

pedidos_pages_bp = Blueprint("pedidos_pages", __name__)

def login_required(view):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper

@pedidos_pages_bp.get("/pedidos")
@login_required
def pedidos_page():
    return render_template("pages/pedidos.html", title="Pedidos")
