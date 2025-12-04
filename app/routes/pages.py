from flask import Blueprint, render_template, session, redirect, url_for

pages_bp = Blueprint("pages", __name__)

def login_required(view):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper

@pages_bp.get("/")
@login_required
def index():
    return render_template("pages/index.html", title="Inicio")

@pages_bp.get("/login")
def login():
    if "user" in session:
        return redirect(url_for("pages.index"))
    return render_template("pages/login.html", title="Login")
