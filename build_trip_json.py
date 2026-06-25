"""build_trip_json — regenerate data/trip.json from data.js (the source of truth).

data.js holds window.TRIP as a JS object literal (so the site works offline from
file://). This strips the JS wrapper/comments and writes a validated pure-JSON
mirror to data/trip.json. Run after editing data.js.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
src = (HERE / "data.js").read_text(encoding="utf-8")

# drop the leading /* ... */ block comment
src = re.sub(r"/\*.*?\*/", "", src, count=1, flags=re.S)
# take everything after `window.TRIP =`
src = src.split("window.TRIP", 1)[1].split("=", 1)[1]
# remove comment-only lines (first non-space chars are //)
src = "\n".join(ln for ln in src.splitlines() if not ln.lstrip().startswith("//"))
src = src.strip().rstrip(";").strip()
# quote unquoted object keys (preceded by { or ,)
src = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):", r'\1"\2"\3:', src)

data = json.loads(src)  # validates
out = HERE / "data" / "trip.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Wrote {out} — {len(data['days'])} days, {len(data['hotels'])} hotels, "
      f"{len(data['places'])} places, {len(data['open_items'])} open items.")
