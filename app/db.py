from flask import current_app, g
import pymysql, click, os

def get_db():
    if "db" not in g:
        g.db = pymysql.connect(
            host=current_app.config["DB_HOST"],
            port=current_app.config["DB_PORT"],
            user=current_app.config["DB_USER"],
            password=current_app.config["DB_PASSWORD"],
            database=current_app.config["DB_NAME"],
            charset="utf8mb4",
            autocommit=False,
            cursorclass=pymysql.cursors.DictCursor,
        )
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def execute_script_from_file(path):
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()
    conn = get_db()
    with conn.cursor() as cur:
        for stmt in [s.strip() for s in sql.split(";") if s.strip()]:
            cur.execute(stmt)
    conn.commit()

@click.command("init-db")
@click.option("--schema", default="schema.sql", help="Ruta al schema SQL")
def init_db_command(schema):
    schema_path = schema if os.path.isabs(schema) else os.path.join(current_app.root_path, "..", schema)
    click.echo(f"Inicializando DB con: {schema_path}")
    execute_script_from_file(schema_path)
    click.echo("DB inicializada.")

def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
