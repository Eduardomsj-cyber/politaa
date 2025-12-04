
# app/__init__.py  (así debe verse la parte de imports)
from flask import Flask
from .config import Config
from .db import init_app as init_db
from .routes.pages import pages_bp
from .routes.api_auth import auth_bp
from .routes.api_clientes import api_clientes_bp
from .routes.pages_clientes import clientes_pages_bp
from .routes.api_inventario import api_inv_bp          # <-- NUEVO
from .routes.pages_inventario import inv_pages_bp       # <-- NUEVO
from .routes.api_pedidos import api_pedidos_bp
from .routes.pages_pedidos import pedidos_pages_bp
from .routes.api_historial import api_hist_bp
from .routes.pages_historial import hist_pages_bp
from .routes.api_ingredientes import api_ing_bp
from .routes.pages_ingredientes import ing_pages_bp



def create_app():
    app = Flask(__name__, static_url_path="/static", static_folder="../static", template_folder="templates")
    app.config.from_object(Config)

    init_db(app)

    app.register_blueprint(pages_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_clientes_bp)    # <-- NUEVO
    app.register_blueprint(clientes_pages_bp)  # <-- NUEVO
    app.register_blueprint(api_inv_bp)    # <-- NUEVO
    app.register_blueprint(inv_pages_bp)  # <-- NUEVO
    app.register_blueprint(api_pedidos_bp)
    app.register_blueprint(pedidos_pages_bp)
    app.register_blueprint(api_hist_bp)
    app.register_blueprint(hist_pages_bp)
    app.register_blueprint(api_ing_bp)
    app.register_blueprint(ing_pages_bp)


    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app
