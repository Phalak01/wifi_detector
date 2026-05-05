# backend/routes/wifi.py
# Real WiFi scanning + threat analysis
#
# GET  /wifi/scan     — scan real nearby networks using OS commands
# POST /wifi/analyze  — detailed threat analysis for one network
# GET  /wifi/history  — last 10 scan sessions

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import subprocess, re, platform
from datetime import datetime

wifi_bp      = Blueprint("wifi", __name__)
scan_history = []   # stored in memory; replace with DB in production


# ═══════════════════════════════════════════════════════════════════
# THREAT SCORING ENGINE
# Rule-based scoring — every risk factor adds to the 0-100 score.
# In a full ML version you'd load a trained sklearn model here.
# ═══════════════════════════════════════════════════════════════════
def score_network(ssid, encryption, signal_pct, hidden):
    pts   = 0
    why   = []
    fixes = []
    s     = (ssid or "").lower()

    # 1. Encryption ─────────────────────────────────────────────────
    if encryption in ("OPEN","None","Open",""):
        pts += 50
        why.append("No encryption — all traffic visible to anyone nearby")
        fixes.append("Never use for banking, email or passwords")
    elif encryption == "WEP":
        pts += 35
        why.append("WEP is obsolete — crackable in under 60 seconds")
        fixes.append("Avoid — WEP gives almost no real protection")
    elif encryption == "WPA":
        pts += 20
        why.append("WPA (original) has known TKIP vulnerabilities")
        fixes.append("Use only for non-sensitive browsing")
    elif encryption == "WPA2":
        pts += 5
        fixes.append("WPA2 is acceptable — ensure router uses AES not TKIP")
    elif encryption == "WPA3":
        fixes.append("WPA3 is the current gold standard — good security")
    else:
        pts += 10
        why.append(f"Unknown encryption type: {encryption}")

    # 2. Suspicious SSID keywords (honeypot / evil-twin bait names) ─
    bait = ["free","public","guest","open","hack","test",
            "starbucks","airport","hotel","cafe","wifi","hotspot",
            "linksys","netgear","tp-link","dlink","default"]
    for w in bait:
        if w in s:
            pts += 20
            why.append(f"SSID contains '{w}' — common in honeypot/evil-twin attacks")
            fixes.append("Verify this network is legitimate before connecting")
            break

    # 3. Hidden SSID ─────────────────────────────────────────────────
    if hidden:
        pts += 15
        why.append("Hidden SSID — unusual for legitimate networks")
        fixes.append("Approach hidden networks with caution")

    # 4. Evil-twin signal anomaly ────────────────────────────────────
    if signal_pct > 85 and encryption in ("OPEN","None",""):
        pts += 15
        why.append("Very strong open network signal — classic Evil Twin pattern")
        fixes.append("DO NOT connect — matches an active Evil Twin attack")

    # 5. Double risk: open + suspicious name ─────────────────────────
    if encryption in ("OPEN","None","") and any(w in s for w in bait):
        pts += 10
        why.append("Open network + suspicious name = very high-risk combination")

    pts = min(pts, 100)

    if   pts >= 76: status, msg = "CRITICAL", "Extremely dangerous — do not connect"
    elif pts >= 51: status, msg = "HIGH",     "High risk — avoid sensitive activities"
    elif pts >= 26: status, msg = "MEDIUM",   "Moderate risk — use with caution"
    else:           status, msg = "SAFE",     "Appears safe — standard precautions apply"

    if not why:
        why.append("No major threat indicators detected")

    return {"score": pts, "status": status, "status_message": msg,
            "reasons": why, "recommendations": fixes}


# ═══════════════════════════════════════════════════════════════════
# OS-SPECIFIC REAL WIFI SCANNERS
# ═══════════════════════════════════════════════════════════════════

def _pct_to_dbm(pct):
    """Convert Windows signal % to approximate dBm."""
    return int((int(pct) / 100) * 60 - 90)

def _dbm_to_pct(dbm):
    return max(0, min(100, int((int(dbm) + 90) / 60 * 100)))

def scan_windows():
    """
    Windows: uses built-in 'netsh wlan show networks mode=bssid'
    No admin rights needed for this command.
    """
    try:
        out = subprocess.run(
            ["netsh","wlan","show","networks","mode=bssid"],
            capture_output=True, text=True, timeout=15,
            encoding="utf-8", errors="ignore"
        ).stdout

        networks = []
        # Each network block starts with "SSID N :"
        for block in re.split(r"\nSSID \d+", out):
            if "Authentication" not in block:
                continue
            net = {}

            # SSID name (first line of block after split)
            m = re.search(r":\s*(.+)", block.split("\n")[0])
            net["ssid"] = m.group(1).strip() if m else "HIDDEN_NETWORK"
            if not net["ssid"]:
                net["ssid"] = "HIDDEN_NETWORK"

            # Authentication → encryption label
            a = re.search(r"Authentication\s*:\s*(.+)", block)
            auth = a.group(1).strip() if a else "UNKNOWN"
            if   "WPA3" in auth:              net["encryption"] = "WPA3"
            elif "WPA2" in auth:              net["encryption"] = "WPA2"
            elif "WPA"  in auth:              net["encryption"] = "WPA"
            elif auth in ("Open","None",""):  net["encryption"] = "OPEN"
            else:                             net["encryption"] = auth

            # Signal %
            sig = re.search(r"Signal\s*:\s*(\d+)%", block)
            pct = int(sig.group(1)) if sig else 30
            net["signal_pct"] = pct
            net["signal"]     = _pct_to_dbm(pct)

            # Channel
            ch  = re.search(r"Channel\s*:\s*(\d+)", block)
            net["channel"] = int(ch.group(1)) if ch else 0

            # BSSID / MAC
            bss = re.search(r"BSSID \d+\s*:\s*([0-9A-Fa-f:]{17})", block)
            net["mac"] = bss.group(1).strip() if bss else "??:??:??:??:??:??"

            net["band"]   = "5GHz" if net["channel"] > 14 else "2.4GHz"
            net["hidden"] = (net["ssid"] == "HIDDEN_NETWORK")

            analysis = score_network(net["ssid"], net["encryption"],
                                     net["signal_pct"], net["hidden"])
            net.update({"threat": analysis["score"],
                        "status": analysis["status"],
                        "reasons": analysis["reasons"],
                        "recommendations": analysis["recommendations"],
                        "id": len(networks) + 1})
            networks.append(net)

        return networks
    except Exception as e:
        print(f"[Windows scan error] {e}")
        return []


def scan_mac():
    """macOS: uses /System/Library/.../airport -s"""
    try:
        airport = ("/System/Library/PrivateFrameworks/Apple80211.framework"
                   "/Versions/Current/Resources/airport")
        out = subprocess.run([airport,"-s"],
                             capture_output=True, text=True, timeout=15).stdout
        networks = []
        for i, line in enumerate(out.strip().split("\n")[1:]):
            parts = line.split()
            if len(parts) < 3:
                continue
            net = {}
            net["ssid"]       = parts[0] if parts[0] else "HIDDEN_NETWORK"
            net["mac"]        = parts[1] if len(parts) > 1 else "??"
            dbm               = int(parts[2]) if len(parts) > 2 else -70
            net["signal"]     = dbm
            net["signal_pct"] = _dbm_to_pct(dbm)
            net["channel"]    = int(re.sub(r"\D","", parts[3])) if len(parts) > 3 else 0
            net["encryption"] = ("WPA3" if "WPA3" in line else
                                 "WPA2" if "WPA2" in line else
                                 "OPEN" if "NONE" in line.upper() else "WPA2")
            net["band"]   = "5GHz" if net["channel"] > 14 else "2.4GHz"
            net["hidden"] = (net["ssid"] == "HIDDEN_NETWORK")
            a = score_network(net["ssid"], net["encryption"],
                              net["signal_pct"], net["hidden"])
            net.update({"threat": a["score"], "status": a["status"],
                        "reasons": a["reasons"], "recommendations": a["recommendations"],
                        "id": i + 1})
            networks.append(net)
        return networks
    except Exception as e:
        print(f"[Mac scan error] {e}")
        return []


def scan_linux():
    """Linux: uses nmcli (more reliable than iwlist, no sudo needed)."""
    try:
        out = subprocess.run(
            ["nmcli","-t","-f","SSID,BSSID,MODE,CHAN,FREQ,SIGNAL,SECURITY","dev","wifi","list"],
            capture_output=True, text=True, timeout=15
        ).stdout

        networks = []
        for i, line in enumerate(out.strip().split("\n")):
            # nmcli -t separates fields with ':'
            parts = line.split(":")
            if len(parts) < 7:
                continue
            net = {}
            net["ssid"]       = parts[0].strip() or "HIDDEN_NETWORK"
            net["mac"]        = parts[1].strip()
            net["channel"]    = int(parts[3]) if parts[3].isdigit() else 0
            pct               = int(parts[5]) if parts[5].isdigit() else 30
            net["signal_pct"] = pct
            net["signal"]     = _pct_to_dbm(pct)

            sec = parts[6].strip().upper()
            if   "WPA3" in sec: net["encryption"] = "WPA3"
            elif "WPA2" in sec: net["encryption"] = "WPA2"
            elif "WPA"  in sec: net["encryption"] = "WPA"
            elif sec in ("","--","NONE"): net["encryption"] = "OPEN"
            else:               net["encryption"] = "WPA2"

            net["band"]   = "5GHz" if net["channel"] > 14 else "2.4GHz"
            net["hidden"] = (net["ssid"] == "HIDDEN_NETWORK")

            a = score_network(net["ssid"], net["encryption"],
                              net["signal_pct"], net["hidden"])
            net.update({"threat": a["score"], "status": a["status"],
                        "reasons": a["reasons"], "recommendations": a["recommendations"],
                        "id": i + 1})
            networks.append(net)
        return networks
    except Exception as e:
        print(f"[Linux scan error] {e}")
        return []


def real_scan():
    """Detect OS and run the right scanner."""
    os_name = platform.system()
    if   os_name == "Windows": return scan_windows()
    elif os_name == "Darwin":  return scan_mac()
    elif os_name == "Linux":   return scan_linux()
    return []


# ═══════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@wifi_bp.route("/scan", methods=["GET"])
@jwt_required()
def scan():
    """GET /wifi/scan — returns real nearby networks. Requires JWT."""
    nets = real_scan()
    if not nets:
        return jsonify({
            "success": False,
            "error": ("No networks found. Check: "
                      "1) WiFi is ON, "
                      "2) On Windows run VS Code / terminal as Administrator, "
                      "3) On Linux install nmcli: sudo apt install network-manager"),
            "networks": []
        }), 500

    scan_history.append({
        "timestamp": datetime.now().isoformat(),
        "count":     len(nets),
        "networks":  nets
    })
    if len(scan_history) > 20:
        scan_history.pop(0)

    return jsonify({"success": True,
                    "count": len(nets),
                    "networks": nets,
                    "scanned_at": datetime.now().isoformat()})


@wifi_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    """POST /wifi/analyze — detailed threat analysis for one network."""
    d          = request.get_json() or {}
    ssid       = d.get("ssid","")
    encryption = d.get("encryption","UNKNOWN")
    signal     = int(d.get("signal", -70))
    hidden     = bool(d.get("hidden", False))
    signal_pct = _dbm_to_pct(signal)

    a = score_network(ssid, encryption, signal_pct, hidden)
    return jsonify({
        "success":         True,
        "ssid":            ssid,
        "encryption":      encryption,
        "signal_dbm":      signal,
        "signal_pct":      signal_pct,
        "risk":            a["score"],
        "status":          a["status"],
        "status_message":  a["status_message"],
        "reason":          " | ".join(a["reasons"]),
        "reasons":         a["reasons"],
        "recommendations": a["recommendations"],
        "analyzed_at":     datetime.now().isoformat()
    })


@wifi_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    """GET /wifi/history — last 10 scan sessions."""
    return jsonify({"success": True, "history": scan_history[-10:]})
