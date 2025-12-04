# app/routes/pages_clientes.py
from flask import Blueprint, render_template, session, redirect, url_for

clientes_pages_bp = Blueprint("clientes_pages", __name__)

def login_required(view):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper

@clientes_pages_bp.get("/clientes")
@login_required
def clientes_page():
    return render_template("pages/clientes.html", title="Clientes")
