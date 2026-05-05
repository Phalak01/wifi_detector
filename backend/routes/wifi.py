from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import subprocess, re, platform
from datetime import datetime
import os

wifi_bp = Blueprint("wifi", __name__)
scan_history = []


# ===========================
# THREAT SCORING ENGINE
# ===========================
def score_network(ssid, encryption, signal_pct, hidden):
    pts = 0
    why = []
    fixes = []
    s = (ssid or "").lower()

    if encryption in ("OPEN", "None", "Open", ""):
        pts += 50
        why.append("No encryption — unsafe")
    elif encryption == "WEP":
        pts += 35
        why.append("WEP is weak")
    elif encryption == "WPA":
        pts += 20
    elif encryption == "WPA2":
        pts += 5
    elif encryption == "WPA3":
        pts += 0
    else:
        pts += 10

    bait = ["free", "public", "guest", "wifi"]
    for w in bait:
        if w in s:
            pts += 20
            break

    if hidden:
        pts += 15

    pts = min(pts, 100)

    if pts >= 76:
        status = "CRITICAL"
    elif pts >= 51:
        status = "HIGH"
    elif pts >= 26:
        status = "MEDIUM"
    else:
        status = "SAFE"

    return {
        "score": pts,
        "status": status,
        "reasons": why,
        "recommendations": fixes
    }


# ===========================
# DEMO MODE (FOR DEPLOYMENT)
# ===========================
def demo_scan():
    return [
        {
            "ssid": "Airport_Free_WiFi",
            "encryption": "OPEN",
            "signal_pct": 90,
            "signal": -40,
            "channel": 6,
            "band": "2.4GHz",
            "hidden": False,
            "mac": "AA:BB:CC:DD:EE:11",
            "threat": 85,
            "status": "CRITICAL",
            "reasons": ["Open network", "Public hotspot"],
            "recommendations": ["Avoid sensitive usage"],
            "id": 1
        },
        {
            "ssid": "Home_WiFi",
            "encryption": "WPA2",
            "signal_pct": 70,
            "signal": -60,
            "channel": 11,
            "band": "2.4GHz",
            "hidden": False,
            "mac": "11:22:33:44:55:66",
            "threat": 20,
            "status": "SAFE",
            "reasons": ["Secure encryption"],
            "recommendations": [],
            "id": 2
        }
    ]


# ===========================
# REAL SCAN (LOCAL ONLY)
# ===========================
def scan_windows():
    try:
        out = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            capture_output=True,
            text=True
        ).stdout

        networks = []
        for i, block in enumerate(re.split(r"\nSSID \d+", out)):
            if "Authentication" not in block:
                continue

            net = {}

            m = re.search(r":\s*(.+)", block.split("\n")[0])
            net["ssid"] = m.group(1).strip() if m else "HIDDEN"

            a = re.search(r"Authentication\s*:\s*(.+)", block)
            net["encryption"] = a.group(1) if a else "OPEN"

            sig = re.search(r"Signal\s*:\s*(\d+)%", block)
            pct = int(sig.group(1)) if sig else 50

            net["signal_pct"] = pct
            net["signal"] = -60
            net["channel"] = 6
            net["band"] = "2.4GHz"
            net["hidden"] = False
            net["mac"] = "??"

            analysis = score_network(
                net["ssid"],
                net["encryption"],
                pct,
                False
            )

            net.update({
                "threat": analysis["score"],
                "status": analysis["status"],
                "reasons": analysis["reasons"],
                "recommendations": analysis["recommendations"],
                "id": i + 1
            })

            networks.append(net)

        return networks

    except Exception as e:
        print("Scan error:", e)
        return []


# ===========================
# SCAN SWITCH (IMPORTANT)
# ===========================
def real_scan():
    # 🚀 DEPLOYED (Railway / Cloud) → DEMO
    if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("ENV") == "production":
        return demo_scan()

    # 💻 LOCAL → REAL SCAN
    if platform.system() == "Windows":
        return scan_windows()

    return []


# ===========================
# ROUTES
# ===========================
@wifi_bp.route("/scan", methods=["GET"])
@jwt_required()
def scan():
    nets = real_scan()

    return jsonify({
        "success": True,
        "count": len(nets),
        "networks": nets,
        "scanned_at": datetime.now().isoformat()
    })


@wifi_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    data = request.get_json() or {}

    result = score_network(
        data.get("ssid", ""),
        data.get("encryption", ""),
        50,
        False
    )

    return jsonify({
        "success": True,
        "analysis": result,
        "time": datetime.now().isoformat()
    })


@wifi_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    return jsonify({
        "success": True,
        "history": scan_history
    })