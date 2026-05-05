# backend/models.py
# All database read/write functions — keeps DB logic out of route files.

import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "database.db")

def _conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row   # columns accessible by name
    return c

def create_user(name, email, hashed_pw):
    """Insert user. Returns new id or None if email already exists."""
    try:
        c = _conn()
        cur = c.execute("INSERT INTO users (name,email,password) VALUES(?,?,?)",
                        (name, email, hashed_pw))
        c.commit()
        uid = cur.lastrowid
        c.close()
        return uid
    except sqlite3.IntegrityError:
        return None   # duplicate email

def get_user_by_email(email):
    c = _conn()
    row = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    c.close()
    return dict(row) if row else None

def get_user_by_id(uid):
    c = _conn()
    row = c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    c.close()
    return dict(row) if row else None
