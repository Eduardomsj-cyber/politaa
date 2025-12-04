from flask import Blueprint, render_template, session, redirect, url_for

inv_pages_bp = Blueprint("inv_pages", __name__)

def login_required(view):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper

@inv_pages_bp.get("/inventario")
@login_required
def inventario_page():
    return render_template("pages/inventario.html", title="Inventario")
