from flask import Blueprint, render_template, session, redirect, url_for

hist_pages_bp = Blueprint("hist_pages", __name__)

def login_required(view):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("pages.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper

@hist_pages_bp.get("/historial")
@login_required
def historial_page():
    return render_template("pages/historial.html", title="Historial")
