"""
fetch_vsa.py — Récupère les métriques depuis l'API VSA et génère data/metrics.json
Décommentez dans update.yml quand vous avez les credentials API.
"""

import requests
import json
import os
from datetime import datetime

VSA_API_KEY = os.environ.get("VSA_API_KEY")
VSA_API_URL = os.environ.get("VSA_API_URL")  # ex: https://api.vsa.fr/v1

# ─── APPELS API ──────────────────────────────────────────────────────────────
# Adaptez selon la structure réelle de l'API VSA

headers = {"Authorization": f"Bearer {VSA_API_KEY}"}

def get(endpoint):
    res = requests.get(f"{VSA_API_URL}/{endpoint}", headers=headers, timeout=10)
    res.raise_for_status()
    return res.json()

try:
    ca_data    = get("metrics/ca")
    consult    = get("metrics/consultants")
    opps       = get("opportunities?status=active")
    bdays      = get("people/birthdays/current-month")

    # ── Adaptez le mapping selon la structure JSON de votre API ──
    metrics = {
        "ca_ytd":           ca_data["ytd_formatted"],          # ex: "1 284 k€"
        "ca_objectif":      ca_data["target_formatted"],       # ex: "2 400 k€"
        "ca_prog_pct":      ca_data["progress_pct"],           # ex: 53.5
        "ca_trend_pct":     ca_data["trend_vs_n1"],            # ex: "+18,4 %"
        "ca_trend_label":   ca_data["trend_label"],
        "ca_n1_mensuel":    ca_data["monthly_n1"],             # tableau 12 valeurs
        "ca_n_mensuel":     ca_data["monthly_current"],        # tableau 12 valeurs (null si futur)
        "consultants":      consult["active_count"],
        "sourcing":         consult["sourcing_count"],
        "fins_de_mission":  consult["ending_soon_count"],
        "taux_occupation":  consult["occupation_rate_formatted"],
        "anniversaires":    bdays["items"],
        "opportunites":     opps["items"]
    }

    os.makedirs("data", exist_ok=True)
    metrics["_generated_at"] = datetime.utcnow().isoformat() + "Z"

    with open("data/metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    print(f"✓ data/metrics.json généré depuis VSA API")

except Exception as e:
    print(f"✗ Erreur API VSA : {e}")
    print("  → Le fichier metrics.json existant sera conservé (fallback dashboard)")
    raise SystemExit(1)
