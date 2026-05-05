# backend/routes/auth.py
# POST /auth/register  — create account
# POST /auth/login     — get JWT token
# GET  /auth/me        — get current user (requires token)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from models import create_user, get_user_by_email, get_user_by_id

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    d = request.get_json() or {}
    name     = d.get("name","").strip()
    email    = d.get("email","").strip().lower()
    password = d.get("password","")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if "@" not in email:
        return jsonify({"error": "Invalid email"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    uid    = create_user(name, email, hashed)
    if uid is None:
        return jsonify({"error": "Email already registered"}), 409

    return jsonify({"message": "Account created",
                    "user": {"id": uid, "name": name, "email": email}}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    d = request.get_json() or {}
    email    = d.get("email","").strip().lower()
    password = d.get("password","")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user["id"]))
    return jsonify({"message": "Login successful",
                    "token": token,
                    "user": {"id": user["id"],
                             "name": user["name"],
                             "email": user["email"]}}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_user_by_id(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": {"id": user["id"],
                             "name": user["name"],
                             "email": user["email"]}}), 200
