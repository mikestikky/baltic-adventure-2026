"""fetch_photos — pull real, license-clean Wikimedia Commons photos for the guide.

For each (key, search query), queries the Commons API, picks the best landscape
JPEG, grabs a 1200px-wide thumbnail URL + attribution, verifies it returns an
image, and writes data/photos.json. Re-run to refresh. The photo map is also
inlined into data.js (window.TRIP.photos) by build_inline_photos().
"""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = "BalticGuide/1.0 (personal travel guide; contact mrobson@ataservices.com)"

# key -> search query. Order roughly by section.
QUERIES = {
    # cities
    "city_helsinki": "Helsinki Senate Square cathedral",
    "city_tallinn": "Tallinn Old Town panorama rooftops",
    "city_riga": "Riga Old Town panorama",
    "city_vilnius": "Vilnius Old Town panorama",
    # Tallinn walks
    "tallinn_st_catherine": "St Catherine's Passage Tallinn",
    "tallinn_town_hall": "Tallinn Town Hall Square Raekoja plats",
    "tallinn_viewpoint": "Tallinn Old Town view Kohtuotsa",
    "tallinn_pikk": "Pikk street Tallinn",
    # Riga walks
    "riga_alberta": "Alberta iela Riga art nouveau",
    "riga_blackheads": "House of the Blackheads Riga",
    # Vilnius walks
    "vilnius_pilies": "Pilies street Vilnius",
    "vilnius_uzupis": "Uzupis Vilnius",
    "vilnius_cathedral": "Vilnius Cathedral Square",
    "vilnius_gediminas": "Gediminas Tower Vilnius",
    # Helsinki
    "helsinki_market": "Helsinki Market Square Kauppatori",
    "helsinki_esplanadi": "Esplanadi park Helsinki",
    # castles / countryside
    "castle_turaida": "Turaida Castle",
    "castle_sigulda": "Sigulda Latvia",
    "castle_gauja": "Gauja National Park Latvia",
    "castle_cesis": "Cesis Castle Latvia",
    "castle_hillofcrosses": "Hill of Crosses Siauliai",
    "castle_trakai": "Trakai Island Castle",
    # hotels (the historic buildings; may be null)
    "hotel_telegraaf": "Vene 9 Tallinn",
    "hotel_grandpalace": "Pils iela 12 Riga",
    "hotel_pacai": "Pacai Palace Vilnius Didzioji",
    "hotel_lilla": "Pieni Roobertinkatu Helsinki",
    # a couple of notable food spots
    "rest_maiasmokk": "Maiasmokk Tallinn",
    "rest_oldehansa": "Olde Hansa Tallinn",
}

BAD = re.compile(r"(coat of arms|logo|icon|map|plan|diagram|seal|flag|"
                 r"\.svg|\.tif|panorama view from|locator|wappen)", re.I)


def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def pick_image(query):
    """Return dict(url, page, credit, license, filename) or None."""
    res = api({"action": "query", "list": "search", "srsearch": query,
               "srnamespace": 6, "srlimit": 12})
    hits = res.get("query", {}).get("search", [])
    titles = [h["title"] for h in hits if h["title"].lower().endswith((".jpg", ".jpeg", ".png"))
              and not BAD.search(h["title"])]
    if not titles:
        return None
    # fetch imageinfo for the candidates in one call
    info = api({"action": "query", "titles": "|".join(titles[:10]),
                "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
                "iiurlwidth": 1200})
    pages = info.get("query", {}).get("pages", {})
    # keep original title order
    order = {t: i for i, t in enumerate(titles)}
    cands = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if ii.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if w < 800:
            continue
        cands.append((order.get(p["title"], 99), p["title"], ii, w, h))
    if not cands:
        return None
    # prefer landscape (w>h), then search rank
    cands.sort(key=lambda c: (0 if c[3] > c[4] else 1, c[0]))
    _, title, ii, w, h = cands[0]
    ext = ii.get("extmetadata", {})
    credit = strip_html(ext.get("Artist", {}).get("value", "")) or "Wikimedia Commons"
    lic = ext.get("LicenseShortName", {}).get("value", "")
    return {
        "url": ii.get("thumburl") or ii.get("url"),
        "page": ii.get("descriptionurl", ""),
        "credit": credit[:80],
        "license": lic,
        "filename": title,
    }


def verify(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200 and r.headers.get("Content-Type", "").startswith("image")
    except Exception:
        return False


def main():
    only = sys.argv[1:] or list(QUERIES)
    out = {}
    for key in only:
        q = QUERIES[key]
        try:
            pic = pick_image(q)
        except Exception as e:
            pic = None
            print(f"  ! {key}: {e}", file=sys.stderr)
        if pic and verify(pic["url"]):
            out[key] = pic
            print(f"  OK {key:24s} {pic['filename'][:60]}")
        else:
            out[key] = None
            print(f"  -- {key:24s} (no verified image)")
    dest = Path(__file__).parent / "data" / "photos.json"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    got = sum(1 for v in out.values() if v)
    print(f"\nWrote {dest} — {got}/{len(out)} images verified.")


if __name__ == "__main__":
    main()
