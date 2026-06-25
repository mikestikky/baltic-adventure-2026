# Baltic Adventure 2026 — Michael & Grace's Travel Guide

A single, self-contained travel guide for the July 8–19, 2026 Baltic trip
(Helsinki · Tallinn · Riga · Vilnius). Built as a static website so it works
**offline**, prints to a clean **PDF**, and is easy to edit.

## How to open / run

It's plain HTML — no build step, no server needed.

- **Just open it:** double-click `index.html` (or drag it into any browser). Works
  fully offline, including the search/filter and checkboxes.
- **Optional local server** (nicer URLs, identical result):
  ```
  cd BalticAdventure2026
  python -m http.server 8080
  ```
  then visit http://localhost:8080

Everything (fonts, data, styles, scripts) is local — take the folder on a phone,
USB stick, or in a cloud drive and it still works with no internet.

## Save as PDF (printable guide)

1. Open `index.html` in **Chrome** or **Edge**.
2. Click **🖨 Print / Save PDF** (top-right of the menu) — or press `Ctrl+P`.
3. Destination: **Save as PDF**. Recommended settings:
   - Layout: Portrait
   - Margins: Default
   - **Background graphics: ON** (so cards/colors render)
4. Save. The print stylesheet hides the nav/search, expands everything, and puts
   page breaks before each major section for a binder-style result.

## Editing the guide

`data.js` (the object `window.TRIP`) is what the site reads — it is **generated**
by `assemble.py`. To change content, edit the source and rebuild:

```
cd BalticAdventure2026
python assemble.py        # rebuilds data.js + data/trip.json
```

- **Facts, daily schedules, Michael/Grace/Together notes, packing** → edit the
  dictionaries near the top of `assemble.py`, then re-run it.
- **Photos** → edit the query list in `fetch_photos.py`, run `python fetch_photos.py`
  (pulls verified, credited Wikimedia Commons images into `data/photos.json`),
  then `python assemble.py` to fold them in.
- Quick one-off tweak with no Python? You can also edit `data.js` directly and
  reload — just know the next `assemble.py` run will overwrite it.

### Photos & maps
- Photos are real, license-clean **Wikimedia Commons** images (with credit shown).
  They load over the internet; offline they're hidden gracefully.
- Maps are **tap-to-load** (keeps the page fast on mobile/metered data). The
  "Open in Google Maps" and "Directions" links always work.

### Interactive bits (saved on the device, in the browser)
- Open-items: check one to mark it **resolved** — critical items then drop out of
  the red boxes and the master summary.
- Restaurant **Michael/Grace star scores**, the **budget actuals**, and all
  **checklists** persist in the browser's local storage.

Structure of `data.js`:

| Key | What it holds |
|-----|----------------|
| `meta` | Title, dates, route, theme |
| `flights` / `ticket` | Flight legs + ticket details |
| `hotels` | The four hotels (confirmations, costs, why, nearby) |
| `car` | Rental car booking + verify-list |
| `open_items` | Action checklist (priority-sorted) |
| `days` | Day-by-day itinerary (morning/afternoon/evening, stumble zone, food, backup, maps) |
| `transport` | Ferry / bus / car legs |
| `places` | Restaurants & cafés (searchable) |
| `castles` | Countryside & castle stops |
| `budget` / `budget_unknowns` | Known costs + honest unknowns |

### The JSON data file

`data/trip.json` is a pure-JSON mirror of the same data (the deliverable data
file). The website reads `data.js` (so it works from `file://` offline); the
JSON is for portability / re-use.

To regenerate `trip.json` after editing `data.js`:

```
cd BalticAdventure2026
python build_trip_json.py
```

## Files

```
BalticAdventure2026/
├── index.html          # the guide (open this)
├── styles.css          # concierge styling + print stylesheet
├── app.js              # render layer: photos, maps, schedules, scores, budget…
├── data.js             # GENERATED trip data (window.TRIP) — built by assemble.py
├── assemble.py         # ← edit facts/schedules/notes/packing here, then run it
├── fetch_photos.py     # pulls verified Wikimedia photos → data/photos.json
├── data/trip.json      # pure-JSON mirror of the data
├── data/photos.json    # verified photo URLs + credits
├── build_trip_json.py  # (legacy) regenerate trip.json from data.js
└── README.md
```

## Notes on accuracy

- **Confirmed** booking numbers and costs come straight from the tickets and
  confirmations. They are not invented.
- Anything labeled **"recommendation"** (most restaurants, cafés, attractions,
  driving notes) is a suggestion — verify hours/prices before relying on them.
- **Open items** are flagged in red/amber throughout and listed in their own
  section. The three critical ones: Grace's ticket, the rental-car return date,
  and the Hotel PACAI occupancy.

Wander well. ✦
