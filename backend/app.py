# backend/app.py
# ─────────────────────────────────────────────────────────────────
# Main Flask entry point.
# Run this file to start the backend:  python app.py
# ─────────────────────────────────────────────────────────────────

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import sqlite3, os

app = Flask(__name__)

# ── Config ────────────────────────────────────────────────────────
app.config["JWT_SECRET_KEY"]          = "wifi-threat-secret-2024-change-in-prod"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False   # no expiry for dev

# ── Allow React dev server (port 5173) to call this backend ───────
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173",
                                          "http://127.0.0.1:5173"]}})
jwt = JWTManager(app)

# ── Register route blueprints ─────────────────────────────────────
from routes.auth import auth_bp
from routes.wifi import wifi_bp
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(wifi_bp, url_prefix="/wifi")

# ── Create SQLite DB + tables on first run ────────────────────────
def init_db():
    db = os.path.join(os.path.dirname(__file__), "database.db")
    conn = sqlite3.connect(db)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            name     TEXT    NOT NULL,
            email    TEXT    NOT NULL UNIQUE,
            password TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    print("✓ Database ready (database.db)")

@app.route("/status")
def status():
    return {"status": "online", "message": "WiFi Threat Analyzer backend running"}

if __name__ == "__main__":
    init_db()
    print("\n" + "="*52)
    print("  WiFi Threat Analyzer — Backend API")
    print("  URL : http://localhost:5000")
    print("  Docs: GET /status to verify")
    print("="*52 + "\n")
    app.run(debug=True, port=5000)
