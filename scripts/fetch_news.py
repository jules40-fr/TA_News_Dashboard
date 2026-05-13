"""
fetch_news.py — Récupère les flux RSS industriels et génère data/news.json
Exécuté par GitHub Actions chaque matin.
"""

import feedparser
import json
import os
from datetime import datetime

# ─── FLUX RSS À SURVEILLER ────────────────────────────────────────────────────
# Ajoutez ou retirez des flux selon vos besoins
FEEDS = [
    {"sector": "INDUSTRIE",   "url": "https://www.usinenouvelle.com/rss/toute-l-actualite.rss", "items": 3},
    {"sector": "NUCLÉAIRE",   "url": "https://www.asn.fr/rss.xml",                              "items": 2},
    {"sector": "DÉFENSE",     "url": "https://www.opex360.com/feed/",                           "items": 2},
    # {"sector": "OIL & GAS", "url": "https://votre-flux-oil-gas.fr/rss",                       "items": 2},
    # {"sector": "PHARMA",    "url": "https://votre-flux-pharma.fr/rss",                        "items": 2},
]
# ─────────────────────────────────────────────────────────────────────────────

news_items = []

for feed in FEEDS:
    try:
        parsed = feedparser.parse(feed["url"])
        for entry in parsed.entries[:feed["items"]]:
            title = entry.get("title", "").strip()
            if title:
                news_items.append({
                    "sector": feed["sector"],
                    "text": title,
                    "link": entry.get("link", ""),
                    "date": entry.get("published", "")
                })
        print(f"✓ {feed['sector']} — {min(len(parsed.entries), feed['items'])} articles")
    except Exception as e:
        print(f"✗ {feed['sector']} — erreur : {e}")

# Fallback si aucun flux n'a fonctionné
if not news_items:
    news_items = [
        {"sector": "INDUSTRIE", "text": "Données RSS temporairement indisponibles — actualisation prévue prochainement."}
    ]

# Écriture du fichier
os.makedirs("data", exist_ok=True)
output = {
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "count": len(news_items),
    "items": news_items
}

with open("data/news.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✓ data/news.json généré — {len(news_items)} articles")
