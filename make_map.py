"""make_map — generate assets/route_map.svg: a true-to-scale geographic map of the
Baltic trip (Finland/Estonia/Latvia/Lithuania outlines + route + day-trip stops +
real distances). Non-interactive. Used as the lightened cover background and as a
crisp labelled map in the Route section. Run: python make_map.py
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).parent
ASSETS = HERE / "assets"
MEAN_LAT = 57.0
COSL = math.cos(math.radians(MEAN_LAT))
KM_PER_DEG = 110.57  # ~km per degree latitude


def project(lon, lat):
    return (lon * COSL, -lat)  # equirectangular; uniform scale keeps distances true


# ---- cities & stops (lat, lon) ------------------------------------------
PTS = {
    "Helsinki": (60.169, 24.938, "major"),
    "Tallinn": (59.437, 24.754, "major"),
    "Riga": (56.946, 24.106, "major"),
    "Vilnius": (54.687, 25.280, "major"),
    "Sigulda · Turaida": (57.16, 24.85, "stop"),
    "Cēsis": (57.312, 25.275, "stop"),
    "Hill of Crosses": (56.015, 23.417, "stop"),
    "Trakai": (54.652, 24.934, "stop"),
}
DATES = {"Helsinki": "Jul 9–10", "Tallinn": "Jul 10–14", "Riga": "Jul 14–17", "Vilnius": "Jul 17–19"}

# route legs: (from, to, kind, distance label, label-offset)
LEGS = [
    ("Helsinki", "Tallinn", "ferry", "⛴ ferry · ~85 km"),
    ("Tallinn", "Riga", "bus", "🚌 bus · ~310 km"),
    ("Riga", "Hill of Crosses", "drive", "🚗 ~140 km"),
    ("Hill of Crosses", "Vilnius", "drive", "🚗 ~215 km"),
]
SPURS = [  # day-trip spurs (dashed, thinner)
    ("Riga", "Sigulda · Turaida", "≈50 km"),
    ("Sigulda · Turaida", "Cēsis", "≈40 km"),
    ("Vilnius", "Trakai", "≈28 km"),
]

# ---- load + project country polygons ------------------------------------
country_paths = []
all_xy = []
for iso in ["FIN", "EST", "LVA", "LTU"]:
    gj = json.loads((ASSETS / f"{iso}.geo.json").read_text(encoding="utf-8"))
    for feat in gj["features"]:
        geom = feat["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        d = ""
        for poly in polys:
            for ring in poly:
                # crop Finland's far north/east so the frame stays tight on the route band
                pts = [(lon, lat) for lon, lat in ring if lat < 61.6 and lon < 28.5]
                if len(pts) < 3:
                    continue
                xy = [project(lon, lat) for lon, lat in pts]
                all_xy += xy
                d += "M" + " L".join(f"{x:.3f},{y:.3f}" for x, y in xy) + "Z"
        if d:
            country_paths.append(d)

# project points; include them in bounds
proj = {name: project(lon, lat) for name, (lat, lon, _k) in PTS.items()}
all_xy += list(proj.values())

xs = [p[0] for p in all_xy]; ys = [p[1] for p in all_xy]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
padx = (maxx - minx) * 0.18 + 1.5
pady = (maxy - miny) * 0.06 + 0.4
minx -= padx; maxx += padx; miny -= pady; maxy += pady
W, H = maxx - minx, maxy - miny
SCALE = 760.0 / W            # fit width to 760 user units
VW, VH = W * SCALE, H * SCALE


def sx(x): return (x - minx) * SCALE
def sy(y): return (y - miny) * SCALE
def S(name): x, y = proj[name]; return (sx(x), sy(y))


# ---- build SVG ----------------------------------------------------------
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;")

parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW:.1f} {VH:.1f}" '
             f'class="trip-map" role="img" aria-label="Geographic map of the Baltic route with distances">')
parts.append('<rect x="0" y="0" width="100%" height="100%" fill="#eaf0f2"/>')  # sea
# country fills
cp = "".join(country_paths)
# rescale each path's coordinates: paths are in raw projected units → transform
parts.append(f'<g transform="translate({-minx*SCALE:.3f} {-miny*SCALE:.3f}) scale({SCALE:.4f})">')
parts.append(f'<path d="{cp}" fill="#dfe7d8" stroke="#b9c6ab" stroke-width="{0.6/SCALE:.3f}" stroke-linejoin="round"/>')
parts.append("</g>")

# ferry/bus/drive legs
KINDS = {"ferry": ("#3f5e57", "3 3"), "bus": ("#3f5e57", "0"), "drive": ("#a9802f", "0")}
for a, b, kind, label in LEGS:
    (x1, y1), (x2, y2) = S(a), S(b)
    color, dash = KINDS[kind]
    parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" '
                 f'stroke-width="2.4" stroke-dasharray="{dash}" stroke-linecap="round"/>')
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    parts.append(f'<text x="{mx+4:.1f}" y="{my:.1f}" class="m-dist">{esc(label)}</text>')
# spurs
for a, b, label in SPURS:
    (x1, y1), (x2, y2) = S(a), S(b)
    parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#a9802f" '
                 f'stroke-width="1.4" stroke-dasharray="2 2" stroke-linecap="round" opacity="0.8"/>')
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    parts.append(f'<text x="{mx+3:.1f}" y="{my-2:.1f}" class="m-dist sm">{esc(label)}</text>')

# flight hints
hx, hy = S("Helsinki"); vx, vy = S("Vilnius")
parts.append(f'<text x="{hx-6:.1f}" y="{hy-10:.1f}" class="m-air" text-anchor="end">✈ from Paris / SLC</text>')
parts.append(f'<text x="{vx+8:.1f}" y="{vy+4:.1f}" class="m-air">✈ to Amsterdam / SLC</text>')

# points + labels
for name, (lat, lon, kind) in PTS.items():
    x, y = S(name)
    r = 4.4 if kind == "major" else 2.8
    fill = "#a9802f" if kind == "major" else "#fffdf8"
    parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="#7a5a1f" stroke-width="1.4"/>')
    anchor = "start"; dx = 7
    if name in ("Riga", "Hill of Crosses", "Sigulda · Turaida", "Cēsis"):
        anchor = "end"; dx = -7
    cls = "m-city" if kind == "major" else "m-stop"
    parts.append(f'<text x="{x+dx:.1f}" y="{y+3.5:.1f}" class="{cls}" text-anchor="{anchor}">{esc(name)}</text>')
    if name in DATES:
        parts.append(f'<text x="{x+dx:.1f}" y="{y+13:.1f}" class="m-date" text-anchor="{anchor}">{DATES[name]}</text>')

# scale bar (100 km)
barpx = (100.0 / KM_PER_DEG) * SCALE
bx, by = 14, VH - 16
parts.append(f'<line x1="{bx}" y1="{by}" x2="{bx+barpx:.1f}" y2="{by}" stroke="#5c5448" stroke-width="2"/>')
parts.append(f'<line x1="{bx}" y1="{by-3}" x2="{bx}" y2="{by+3}" stroke="#5c5448" stroke-width="2"/>')
parts.append(f'<line x1="{bx+barpx:.1f}" y1="{by-3}" x2="{bx+barpx:.1f}" y2="{by+3}" stroke="#5c5448" stroke-width="2"/>')
parts.append(f'<text x="{bx:.1f}" y="{by-6:.1f}" class="m-scale">100 km</text>')

# styles
parts.append("""<style>
.trip-map text{font-family:Georgia,serif}
.m-city{font-weight:700;font-size:13px;fill:#2b2620}
.m-stop{font-style:italic;font-size:10.5px;fill:#4a4236}
.m-date{font-size:9px;fill:#6e8a82;font-family:system-ui,sans-serif}
.m-dist{font-size:9.5px;fill:#3f5e57;font-family:system-ui,sans-serif;font-weight:600}
.m-dist.sm{font-size:8px;fill:#8a6a2a}
.m-air{font-size:9px;fill:#9a9386;font-style:italic;font-family:system-ui,sans-serif}
.m-scale{font-size:8.5px;fill:#5c5448;font-family:system-ui,sans-serif}
</style>""")
parts.append("</svg>")

svg = "\n".join(parts)
(ASSETS / "route_map.svg").write_text(svg, encoding="utf-8")
print(f"Wrote assets/route_map.svg  viewBox 0 0 {VW:.0f} {VH:.0f}  ({len(svg)} bytes, {len(country_paths)} country paths)")
