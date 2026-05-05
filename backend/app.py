# backend/app.py

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import sqlite3, os

app = Flask(__name__)

# ── Config ────────────────────────────────────────────────────────
app.config["JWT_SECRET_KEY"] = "wifi-threat-secret-2024-change-in-prod"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

# ✅ Allow all (for now)
CORS(app, resources={r"/*": {"origins": "*"}})

jwt = JWTManager(app)

# ── Register routes ───────────────────────────────────────────────
from routes.auth import auth_bp
from routes.wifi import wifi_bp

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(wifi_bp, url_prefix="/wifi")

# ── Database init ─────────────────────────────────────────────────
def init_db():
    db = os.path.join(os.path.dirname(__file__), "database.db")
    conn = sqlite3.connect(db)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            name     TEXT,
            email    TEXT UNIQUE,
            password TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("✓ Database ready")

@app.route("/status")
def status():
    return {
        "status": "online",
        "message": "WiFi Threat Analyzer backend running"
    }

# ✅ IMPORTANT: always run DB init
init_db()

# 🚀 Run server (Railway compatible)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",   # VERY IMPORTANT
        port=port,        # FIXED (was wrong before)
        debug=False
    )   