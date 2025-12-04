from flask import Blueprint, render_template, session, redirect, url_for

ing_pages_bp = Blueprint("ing_pages", __name__)

def login_required(view):
    def wrapper(*a, **k):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*a, **k)
    wrapper.__name__ = view.__name__
    return wrapper

@ing_pages_bp.get("/ingredientes")
@login_required
def ingredientes_page():
    return render_template("pages/ingredientes.html", title="Ingredientes")
