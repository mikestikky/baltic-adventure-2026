"""assemble — merge researched facts, verified photos, timed schedules, personal
notes, and the packing chapter into data.js (the source of truth) + data/trip.json.

Run after editing this file or fetch_photos.py. Regenerates data.js as:
    window.TRIP = { ...full object... };
Keeps the guide a single offline-loadable file. Idempotent.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent


def load_trip():
    src = (HERE / "data.js").read_text(encoding="utf-8")
    src = re.sub(r"/\*.*?\*/", "", src, count=1, flags=re.S)
    src = src.split("window.TRIP", 1)[1].split("=", 1)[1]
    src = "\n".join(ln for ln in src.splitlines() if not ln.lstrip().startswith("//"))
    src = src.strip().rstrip(";").strip()
    src = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):", r'\1"\2"\3:', src)
    return json.loads(src)


TRIP = load_trip()
PHOTOS = json.load(open(HERE / "data" / "photos.json", encoding="utf-8"))

# ---- researched hotel deep-facts (from web research, verified) -----------
HOTELS_EXTRA = {
    "lilla": {
        "history": "Built in 1909 by architect Selim A. Lindqvist as an electricity substation (completed in its present form in 1931), the building powered Helsinki for decades, then housed the city police until 2012. It reopened as Hotel Lilla Roberts in 2015, in the heart of the Design District.",
        "style": "1920s–30s Art Deco — dark tones, geometric motifs, brass and gold — inside a former power station, with modern Nordic touches.",
        "restaurant": "Krog Roba — casual Nordic dining in the old police-station premises (weekend brunch ~12:30–15:00).",
        "bar": "Lilla e — an intimate cocktail bar known for inventive, off-menu drinks.",
        "spa": None,
        "breakfast": "Daily buffet with Finnish touches — pancakes, local berries, fresh-baked bread — in the restaurant.",
        "checkin_tips": "Check-in from 15:00, out by 12:00. Ask for a quieter courtyard-facing room and request the Art Deco design-feature rooms.",
        "parking": "No large in-house garage; staff direct you to nearby public garages in Kaartinkaupunki/Erottaja (pay, no booking). On-street is metered and limited.",
        "taxi_note": "Taxis pull up on Pieni Roobertinkatu directly outside, or reception calls one; Erottaja taxi rank is a 3–5 min walk.",
        "best_evening_walk": "From the door, east to Korkeavuorenkatu, north to Kasarmitori square, then to the Esplanadi promenade — a short Design-District loop back via Erottajankatu.",
        "nearby_hidden": "Design boutiques and galleries along Pieni Roobertinkatu and Fredrikinkatu; the leafy Kasarmitori square a couple of minutes north.",
        "photo": "hotel_lilla",
    },
    "telegraaf": {
        "history": "Set in an 1878 building that was once Tallinn's central telegraph exchange (hence the name), restored and opened as Hotel Telegraaf in 2007. Now an 82-room Marriott Autograph Collection property arranged around a courtyard, keeping its vaulted ceilings and period architecture.",
        "style": "Restored 19th-century building blending classical elegance with contemporary boutique design.",
        "restaurant": "Restaurant Tchaikovsky — upscale, Michelin-listed French cuisine with a Russian accent, under a glazed pavilion.",
        "bar": "The Tchaikovsky lobby bar — wines and cocktails in an elegant room.",
        "spa": "Elemis Telegraaf Spa — indoor pool, hot tub, sauna, steam bath, and treatments.",
        "breakfast": "Grand buffet (included) in Tchaikovsky, with an 'Estonian corner' of local dishes; go earlier for a quieter, fuller buffet.",
        "checkin_tips": "Check-in ~15:00–16:00, out by 12:00. Mention Marriott Bonvoy for possible upgrades; ask for a courtyard-side room for quiet.",
        "parking": "Private valet ~€30/day — important, because Vene is inside the restricted Old Town where independent parking is tightly limited. Let the hotel take the car.",
        "taxi_note": "Old Town vehicle access is restricted; taxis/Bolt usually meet guests at the edge of the pedestrian zone near Viru Gate. Reception arranges it.",
        "best_evening_walk": "From Vene 9, north past St. Catherine's Passage, cut to Müürivahe, then to Town Hall Square (~2–3 min) and loop back via Pikk.",
        "nearby_hidden": "St. Catherine's Passage (Katariina käik), a medieval lane of artisan workshops just off Vene; the Dominican Monastery a minute away.",
        "photo": "hotel_telegraaf",
    },
    "grandpalace": {
        "history": "A landmark 1877 building that began as a bank — the chandelier-lit lobby was once its banking hall — on Pils iela in the heart of Riga's Old Town. Today a 56-room five-star boutique, the only Latvian member of Small Luxury Hotels of the World, with interiors styled by Andrew Martin.",
        "style": "Restored 1877 historicist bank building with contemporary boutique interiors over a classical shell.",
        "restaurant": "Seasons Restaurant — MICHELIN-Guide fine dining with menus inspired by iconic artworks; breakfast in the Orangerie conservatory.",
        "bar": "Pils Bar — a clubby, trophy-and-art-filled room whose bartenders have served here 25+ years.",
        "spa": "Wellness rather than full spa: a private-use sauna, 24-hour gym, and treatments on request.",
        "breakfast": "Served in the light-filled Orangerie hall, with eggs cooked to order — go before the morning rush.",
        "checkin_tips": "Check-in from 14:00, out by 12:00. Only 56 rooms — request a quieter upper-floor or courtyard room, and have the concierge pre-arrange Old Town parking.",
        "parking": "No large garage at the door; the hotel arranges nearby garage parking (~€30/day, book ahead). Pils iela is in the restricted Old Town zone — coordinate drop-off with reception.",
        "taxi_note": "Because of Old Town traffic limits, taxis/Bolt pick up at the nearest permitted street edge; reception calls a cab and points you to the spot.",
        "best_evening_walk": "From the door, to Riga Castle and the Daugava riverfront, then back through Mazā Pils iela past the 'Three Brothers' to Dome Square and Riga Cathedral.",
        "nearby_hidden": "The 'Three Brothers' (Trīs brāļi), Riga's oldest houses, a minute away; the quiet gardens around Riga Castle just down the street.",
        "photo": "hotel_grandpalace",
    },
    "pacai": {
        "history": "Set in the Baroque Pac Palace on Didžioji (1677, on 15th-century foundations) — once the grandest aristocratic residence in the Grand Duchy of Lithuania, home of the Pac family and decorated by Italian masters Perti and Palloni. Fully restored and reopened as the 104-room Hotel PACAI in 2018 (a Design Hotels member), preserving original frescoes alongside bold contemporary design.",
        "style": "17th-century Baroque palace restored with bold contemporary, Scandinavian-modern interiors.",
        "restaurant": "Nineteen18 — fine-dining tasting menus (Michelin-recognized); the former stables house the 14Horses all-day brasserie.",
        "bar": "The palace bar serves cocktails in the historic setting alongside 14Horses.",
        "spa": "A spa offering treatments plus relaxation and beauty packages within the hotel.",
        "breakfast": "Served in the 14Horses brasserie in the converted stables — a design-forward space; go a touch earlier on busy mornings.",
        "checkin_tips": "Check-in from 15:00, out by 12:00. Ask for a room showing original frescoes or Baroque detail, and confirm valet parking in advance.",
        "parking": "Courtyard valet parking (~€75/day) or limited street parking; Didžioji is in the restricted Old Town, so valet is simplest.",
        "taxi_note": "Taxis/Bolt reach the Didžioji frontage or nearby Town Hall Square (Rotušės aikštė), an easy pickup point a minute away.",
        "best_evening_walk": "From the door, south past the Town Hall, up Aušros Vartų to the Gates of Dawn chapel, then back north along Didžioji toward the Cathedral.",
        "nearby_hidden": "St. Casimir's Church and the Baroque side lanes off Didžioji; artsy Literatų street (its wall of literary plaques) toward Užupis.",
        "photo": "hotel_pacai",
    },
}

# ---- researched restaurant/café detail (by name) -------------------------
REST_EXTRA = {
    "Rataskaevu 16": ("Hearty Estonian — braised elk, oven-baked salmon, free pumpkin bread; the famous chocolate cake", "€€", "Smart casual", "https://www.rataskaevu16.ee/", "Wander up to Toompea and the Kohtuotsa platform for rooftops over the Old Town."),
    "Olde Hansa": ("A Hanseatic medieval feast — bear stew in wild-berry sauce, elk, boar; candlelit hall, live period music", "€€€", "Smart casual", "https://www.oldehansa.ee/", "Step out onto Town Hall Square and the medieval lanes around it."),
    "Lore Bistroo": ("Wood-fired modern bistro plates, family-style sharing; Michelin Bib Gourmand, harbour-side at Noblessner", "€€", "Casual", "https://www.lorebistroo.ee/en/", "Stroll the Noblessner seaside promenade, then toward Kalamaja."),
    "Café Maiasmokk": ("Estonia's oldest café (1864) — hand-painted Kalev marzipan, pastries, a century-old interior", "€", "Casual", "https://kohvikmaiasmokk.ee/en/", "Browse Pikk Street's merchant houses and the Great Guild Hall steps away."),
    "Pierre Chocolaterie": ("Handmade chocolates and hot chocolate in the cobbled Master's Courtyard (Meistrite Hoov)", "€", "Casual", None, "Linger in the artisan courtyard, then follow Vene to the Dominican Monastery."),
    "Kehrwieder (Saiakang)": ("Cosy Town Hall Square café — cakes, coffee, and big mugs of hot chocolate", "€", "Casual", None, "Circle Raekoja plats and duck into the medieval side streets."),
    "Fotografiska rooftop": ("Leaf-to-root seasonal plates with Old Town rooftop views above the photo gallery", "€€€", "Smart casual", "https://tallinn.fotografiska.com/en/restaurants/fotografiska-restaurant", "Explore the creative Telliskivi quarter and its street art below."),
    "Rozengrāls": ("Medieval dining in a vaulted 1293 wine cellar — old-recipe dishes, honey mead, candlelight", "€€", "Smart casual", "https://rozengrals.lv/en/", "Wind through the lanes to Town Hall Square and the House of the Black Heads."),
    "Riga Black Magic": ("A mystical apothecary café built around Riga Black Balsam — in hot chocolate, cocktails, and chocolates", "€€", "Casual", "https://www.blackmagic.lv/", "Walk Kaļķu iela toward the Freedom Monument and the canal park."),
    "3 Pavāru Restorāns": ("'Three Chefs' — contemporary Latvian tasting menus, open-kitchen theatre; Michelin-listed", "€€€", "Smart casual", "https://www.3pavari.lv/en/", "Follow the Jacob's Barracks arcade to the Swedish Gate and old city wall."),
    "Folkklubs Ala Pagrabs": ("Folk-club cellar — 30+ Latvian craft beers, house moonshine, hearty fare, live folk music", "€", "Casual", "https://folkklubs-ala-pagrabs.tablein.com/en", "Cross to the riverside park and views over the Daugava."),
    "Milda": ("Cosy Baltic home-cooking — grey peas with bacon, pelmeni, cepelinai; Michelin Bib Gourmand", "€€", "Casual", "https://restoransmilda.lv/", "Amble to St. Peter's Church and the medieval heart of the Old Town."),
    "Art Café Sienna": ("Elegant Art Nouveau-style café — cakes, breakfasts, coffee near the National Opera", "€", "Casual", None, "Stroll Bastejkalns park and the canal, then up Alberta iela for the finest façades."),
    "Džiaugsmas": ("Locally-sourced Lithuanian fine dining ('joy') by chef Praškevičius; Michelin-starred tasting menus", "€€€", "Smart casual", "https://dziaugsmas.lt/", "Wander the Old Town lanes toward the Gates of Dawn and St. Anne's."),
    "Ertlio Namas": ("Researched historical Lithuanian cuisine in a period house — slow 4–6 course tastings", "€€€", "Smart casual", "https://ertlionamas.lt/en", "Climb Gediminas' Tower for the view, then down to Cathedral Square."),
    "Lokys": ("Old Town's oldest restaurant (1972) in a 15th-c. house — game and the signature beaver stew, vaulted cellars", "€€", "Smart casual", "https://lokys.lt/en/", "Lose yourself in the Stiklių glassblowers' lanes toward Town Hall Square."),
    "Grey": ("Modern European cooking known for striking grey-hued dishes, on Pilies Street", "€€", "Smart casual", "https://www.restoranasgrey.lt/en/", "Walk Pilies Street up to Cathedral Square."),
    "Eskedar Coffee Bar": ("Ethiopian specialty coffee roasted locally — signature espresso and a traditional coffee ceremony", "€", "Casual", "https://eskedarcoffee.com/", "Sip and stroll Pilies Street's craft stalls toward the university."),
    "Savotta": ("Genuine Finnish fare by Senate Square — reindeer roast, lake fish, elk; logging-camp décor", "€€€", "Smart casual", "https://ravintolasavotta.fi/en/", "Step onto Senate Square and the cathedral's white steps just outside."),
    "Old Market Hall (Vanha Kauppahalli)": ("Historic 1889 waterfront hall — salmon soup, archipelago bread, coffee stalls", "€", "Casual", None, "Browse the open-air Market Square and the harbour ferries outside."),
    "Löyly": ("Seaside public sauna with a seasonal Nordic restaurant and Baltic-front terrace", "€€", "Casual", "https://www.loylyhelsinki.fi/en", "Take the seafront promenade along Hernesaari back toward the city."),
}

# match looser names present in TRIP['places']
REST_ALIASES = {
    "Kehrwieder (Saiakang)": "Kehrwieder (Saiakang)",
    "Old Market Hall (Vanha Kauppahalli)": "Old Market Hall (Vanha Kauppahalli)",
}

# place name -> photo key (only those we have real photos for)
PLACE_PHOTOS = {
    "Café Maiasmokk": "rest_maiasmokk",
    "Olde Hansa": "rest_oldehansa",
    "Old Market Hall (Vanha Kauppahalli)": "helsinki_market",
    "Riga Black Magic": "riga_blackheads",
}

# ---- castle filename -> photo key (fetched) + refined why ----------------
# name -> (photo key, refined why, photo tip)
CASTLE_EXTRA = {
    "Turaida Castle": ("castle_turaida", "Red-brick 13th-century bishop's castle with a tower over the Gauja valley, in the Turaida reserve.", "Climb the main tower for the river-valley view."),
    "Sigulda": ("castle_sigulda", "Gateway town to the Gauja valley — a neo-Gothic New Castle beside the ruined medieval Livonian Order castle.", "Cable-car views across the valley."),
    "Gauja National Park": ("castle_gauja", "Latvia's largest national park — a forested river valley of sandstone cliffs, caves, and castles.", "River overlooks through the trees."),
    "Cēsis": ("castle_cesis", "One of Latvia's best-preserved medieval castles, with candle-lantern tower tours.", "Castle ruins by candlelight."),
    "Hill of Crosses": ("castle_hillofcrosses", "A pilgrimage mound bristling with well over 100,000 crosses — haunting symbol of Lithuanian faith.", "A wide shot of the cross-covered mounds."),
    "Trakai Castle": ("castle_trakai", "A fairy-tale red-brick Gothic castle on an island in Lake Galvė, seat of the Grand Dukes.", "The castle across the water from the footbridge."),
}

# city name -> hero photo key
CITY_PHOTOS = {"Helsinki": "city_helsinki", "Tallinn": "city_tallinn", "Riga": "city_riga", "Vilnius": "city_vilnius"}

# ---- timed schedules + personal notes, per day ---------------------------
# notes: (Michael, Grace, Together) — any can be None
DAY_EXTRAS = {
    0: {"schedule": [["Afternoon", "Arrive SLC airport with a comfortable buffer"],
                     ["3:35 PM", "Depart SLC → Paris (AF3551)"],
                     ["Evening", "Dinner aboard; try to sleep — Helsinki is +9 hours"]],
        "michael": "Don't work the whole flight. The trip starts now — close the laptop after one glass of wine.",
        "grace": None,
        "together": "Set your watches to Helsinki time the moment you board. The trip begins when you decide it does."},
    1: {"schedule": [["12:35 PM", "Depart Paris → Helsinki (AF1070, seat 15A)"],
                     ["4:40 PM", "Land Helsinki"],
                     ["5:15 PM", "Taxi/tram to Hotel Lilla Roberts; check in, shower, reset"],
                     ["6:45 PM", "Slow wander — Iso Roobertinkatu to the Esplanadi promenade"],
                     ["7:45 PM", "Easy dinner near the hotel (Savotta, or Krog Roba in-house)"],
                     ["9:30 PM", "Nightcap at Lilla e, then sleep — it's still light out, ignore it"]],
        "michael": "Resist the urge to 'see Helsinki' tonight. You've been traveling 24 hours; one gentle loop and a good dinner is the whole assignment.",
        "grace": "The light barely sets in July here — don't let it trick you into staying up. A short walk, then rest.",
        "together": "Tonight is for landing softly, not sightseeing. Let Helsinki be a gentle on-ramp."},
    2: {"schedule": [["8:30 AM", "Breakfast at the hotel; relaxed checkout"],
                     ["10:00 AM", "Last look at Market Square / Old Market Hall"],
                     ["11:30 AM", "To the West Terminal for the Tallink ferry"],
                     ["12:30 PM", "Ferry to Tallinn (~2 hrs) — coffee on deck"],
                     ["3:00 PM", "Arrive; to Hotel Telegraaf on Vene, check in"],
                     ["5:00 PM", "First Old Town drift — Town Hall Square, Pikk, Vene"],
                     ["8:00 PM", "Dinner (Rataskaevu 16 — book ahead), nightcap at the Telegraaf bar"]],
        "michael": "Book the ferry a few days out, not the morning of. Get a window seat on the way over — the approach to Tallinn's spires is the first 'wow.'",
        "grace": "St. Catherine's Passage at dusk on the first night is pure magic — make sure tonight's wander goes through it.",
        "together": "You're trading a modern Nordic capital for a medieval one in two hours. Let the change of texture land."},
    3: {"schedule": [["9:00 AM", "Coffee & marzipan at Café Maiasmokk"],
                     ["9:45 AM", "Wander Vene and Pikk with no agenda"],
                     ["11:00 AM", "Master's Courtyard — Pierre Chocolaterie; hidden lanes"],
                     ["12:30 PM", "Lunch wherever you land"],
                     ["2:30 PM", "Cellar cafés; an unhurried Old Town hour"],
                     ["4:00 PM", "Rest at the hotel (this is allowed)"],
                     ["6:30 PM", "Aperitivo — Schlössle fireplace lounge as non-guests, or the Telegraaf bar"],
                     ["8:00 PM", "Dinner, then St. Catherine's Passage after dark"]],
        "michael": "Skip the hotel breakfast this morning. Walk five minutes to Maiasmokk instead — you'll get a better feel for Tallinn than sitting in the dining room.",
        "grace": "This is a good afternoon to linger over a hot chocolate and a book in a cellar café. Don't rush to the next thing.",
        "together": "Today has no checklist on purpose. The magic of Tallinn comes from turning down the street you didn't plan to walk."},
    4: {"schedule": [["9:30 AM", "Up to Toompea — Kohtuotsa & Patkuli viewpoints"],
                     ["10:30 AM", "Danish King's Garden and the towers"],
                     ["11:30 AM", "Kiek in de Kök / a stretch of the town wall"],
                     ["1:00 PM", "Lunch; wander into any Medieval Days stalls"],
                     ["3:30 PM", "Quiet hour — coffee or the hotel"],
                     ["6:00 PM", "Drinks; a last look from the viewpoints in evening light"],
                     ["8:00 PM", "Dinner — Olde Hansa for the full medieval night, or modern contrast"]],
        "michael": "Medieval Days is winding down (Jul 10–12) — treat any costumed lane you cross as a bonus, not a thing to hunt down.",
        "grace": "Catch the Kohtuotsa viewpoint in the soft evening light, not the midday crowd. The red roofs glow.",
        "together": "Walls and towers by day, candlelight by night. Don't over-fill it — leave room to just sit on the wall and look."},
    5: {"schedule": [["9:30 AM", "Coffee in Telliskivi Creative City; Kalamaja's wooden streets"],
                     ["11:00 AM", "Balti Jaam market; design shops, street art"],
                     ["1:00 PM", "Lunch in Telliskivi"],
                     ["2:30 PM", "Choose one: Seaplane Harbour, or Kadriorg Park & Palace"],
                     ["5:00 PM", "Fotografiska — gallery then the rooftop"],
                     ["7:30 PM", "Last Tallinn dinner; quiet final Old Town night"]],
        "michael": "Pick ONE big thing this afternoon — Seaplane Harbour or Kadriorg, not both. The point today is texture, not mileage.",
        "grace": "Kalamaja's pastel wooden houses are the prettiest unhurried morning of the trip — bring the camera and dawdle.",
        "together": "Today is the modern counterpoint to four medieval days. A drink on the Fotografiska roof at golden hour is the bookend."},
    6: {"schedule": [["8:30 AM", "Breakfast; checkout from Telegraaf"],
                     ["10:00 AM", "To Tallinn Bus Station for Lux Express"],
                     ["10:30 AM", "Coach to Riga (~4.5 hrs) — wifi, hot drinks, watch the forests"],
                     ["3:30 PM", "Arrive Riga; taxi to Grand Palace Hotel, settle in"],
                     ["5:30 PM", "Loose Old Town drift; Riga Black Magic for the balsam ritual"],
                     ["8:00 PM", "Easy dinner, nightcap at the Pils Bar"]],
        "michael": "Book Lux Express ahead and pick the comfort seats. Don't plan a hard evening — you'll arrive a little road-worn.",
        "grace": None,
        "together": "Riga reveals itself slowly from the bus station inward. Let the first cellar door you pass pull you in."},
    7: {"schedule": [["9:00 AM", "Breakfast in the Orangerie"],
                     ["10:00 AM", "Art Nouveau morning — Alberta iela, then Elizabetes iela; look UP"],
                     ["11:30 AM", "Coffee at Art Café Sienna among the period rooms"],
                     ["1:00 PM", "Lunch; drift back toward Old Town"],
                     ["3:00 PM", "Old Town cellars; House of the Black Heads; hidden vaulted bars"],
                     ["5:00 PM", "Rest before dinner"],
                     ["7:30 PM", "Rozengrāls — the candlelit medieval cellar (reserve this)"],
                     ["9:30 PM", "A slow walk home through the lit lanes"]],
        "michael": "Reserve Rozengrāls and nothing else. Riga's whole gift today is the unplanned room you stumble into between the two booked moments.",
        "grace": "Alberta iela is the most beautiful street of the trip. Walk it slowly, twice. This is your jaw-drop morning.",
        "together": "Two textures, one day: extravagant facades above, candlelit cellars below. This is the peak 'unplanned beauty' city — let it ambush you."},
    8: {"schedule": [["9:30 AM", "Slow Riga morning; coffee"],
                     ["11:15 AM", "Taxi to Riga Airport (RIX)"],
                     ["12:00 PM", "Pick up the car — inspect, photograph, confirm cross-border + automatic in writing"],
                     ["1:00 PM", "Drive to the Gauja valley"],
                     ["2:00 PM", "Turaida Castle — climb the tower for the river view"],
                     ["3:30 PM", "Sigulda overlook (Cēsis only if you're full of energy)"],
                     ["6:00 PM", "Back to Riga; park per the hotel's guidance"],
                     ["7:30 PM", "Final Riga dinner, your pick"]],
        "michael": "Noon pickup means ONE castle done well, not three rushed. Turaida + a Sigulda overlook is plenty. Photograph the car before you drive off.",
        "grace": "Turaida's red tower over the green Gauja valley is the countryside version of 'stumbling into beauty.' Linger at the top.",
        "together": "Don't make this a marathon. One castle, one overlook, home for a good dinner. The car's real day is tomorrow."},
    9: {"schedule": [["8:30 AM", "Breakfast; checkout from the Grand Palace"],
                     ["9:30 AM", "Drive south toward the Lithuanian border"],
                     ["12:00 PM", "Hill of Crosses near Šiauliai — 30–45 min, quietly"],
                     ["12:45 PM", "Lunch on the road"],
                     ["3:30 PM", "Arrive Vilnius; check into Hotel PACAI, drop bags"],
                     ["5:00 PM", "First wander — Pilies Street, courtyards off Didžioji"],
                     ["8:00 PM", "Easy first-night dinner (Lokys, or a Pilies spot)"]],
        "michael": "It's a long driving day — make Hill of Crosses the single stop and don't add a second. Arrive Vilnius with energy to wander, not wrung out.",
        "grace": "The Hill of Crosses is strange and moving — give it real quiet, not a quick photo. Then let Vilnius's hidden courtyards lift the mood.",
        "together": "Vilnius hides its magic behind archways. Push open the courtyard gates off Pilies and Didžioji and see what's inside."},
    10: {"schedule": [["8:30 AM", "Early drive to Trakai (~30 min) to beat the crowds"],
                      ["9:30 AM", "Trakai Island Castle on Lake Galvė; kibinai lakeside"],
                      ["12:30 PM", "Back to Vilnius; lunch"],
                      ["2:30 PM", "Užupis — the bridge, the constitution wall, the galleries"],
                      ["4:00 PM", "Courtyards off Pilies; Cathedral Square"],
                      ["5:00 PM", "Decide & handle the car return (tonight at VNO is the safe play)"],
                      ["7:30 PM", "Final dinner (Džiaugsmas / Ertlio Namas / Grey); pack tonight"]],
        "michael": "Return the car this evening at VNO and taxi tomorrow — it removes all dawn risk before a 7:50 AM flight. Worth the small hassle tonight.",
        "grace": "Užupis is the trip's last 'stumble' — cross the little bridge, find the constitution on the wall, sit by the river with a glass of something.",
        "together": "Last full day. Castle in the morning, artists' republic in the afternoon, a long dinner. Then pack — the flight is brutally early."},
    11: {"schedule": [["5:00 AM", "Wake; final room sweep for chargers"],
                      ["5:30 AM", "Taxi / be at Vilnius Airport (VNO)"],
                      ["7:50 AM", "Depart VNO → Amsterdam (KL2844)"],
                      ["10:50 AM", "Amsterdam → Salt Lake City (KL6027)"],
                      ["1:08 PM", "Land SLC — home"]],
        "michael": "If the car isn't already returned, that's the one thing that can derail the morning. Otherwise: passports, bags, taxi, coffee, done.",
        "grace": None,
        "together": "Don't rush the goodbye. One last coffee, then the long, easy way home. You did the stumble trip right."},
}

# ---- packing chapter -----------------------------------------------------
PACKING = {
    "intro": "July in the Baltics is mild and very long-lit (sun up ~4:30 AM, down ~10:30 PM). Highs 19–24 °C / 66–75 °F, cool evenings 12–14 °C, with passing showers. You'll walk a lot of cobblestones. Pack light, in layers, for warm days and cool candlelit nights.",
    "shared": [
        "Light rain jacket / packable umbrella (showers come and go)",
        "Layers — a warm sweater or two for cool evenings",
        "EU power adapters (Type C/F, 230 V) + a multi-USB charger",
        "Battery pack for long wandering days",
        "Passports (valid 6+ months) + printed copies; both flight tickets saved offline",
        "This guide saved offline / printed; offline Google Maps for FI/EE/LV/LT",
        "Small daypack for the car days and castle climbs",
        "Reusable water bottle",
        "Basic meds: pain relief, blister plasters, motion-sickness (for the ferry), any prescriptions in original packaging",
        "Cards + a little euro cash for small cafés and markets",
        "Sunglasses (the light is long) and a light scarf",
    ],
    "shoes": "Genuinely comfortable, broken-in walking shoes are the single most important item — Old Town cobblestones are unforgiving. Plus one slightly nicer pair for the dressier dinners (Tchaikovsky, Seasons, Rozengrāls, Nineteen18 lean smart-casual).",
    "grace": [
        "A dressier outfit or two for the grand-hotel dinners and the candlelit cellars",
        "A wrap/pashmina for cool evenings and the ferry deck",
        "Comfortable flats for cobblestones; one elegant pair for dinner",
        "Sunhat for the open castle grounds (Turaida, Trakai)",
    ],
    "michael": [
        "A smart-casual layer (blazer or nice sweater) for the upscale dinners",
        "Driving comfort — the Riga→Vilnius day is ~4.5 hrs at the wheel",
        "Phone mount or plan for car navigation; download offline maps before pickup",
        "Copies of the car booking, licence, and insurance for the pickup desk",
    ],
    "leave": [
        "Heavy coats — July doesn't need them",
        "Voltage converters — modern US electronics handle 230 V; you only need the plug adapter",
        "Too many shoes — two pairs each is plenty",
        "A rigid plan — leave room to stumble",
    ],
}

# ============================ MERGE ======================================
for h in TRIP["hotels"]:
    h.update(HOTELS_EXTRA[h["id"]])

for p in TRIP["places"]:
    key = p["name"]
    if key in REST_EXTRA:
        sig, cost, dress, url, after = REST_EXTRA[key]
        p["signature"], p["cost_band"], p["dress"], p["reservation_url"], p["after_walk"] = sig, cost, dress, url, after
    if key in PLACE_PHOTOS:
        p["photo"] = PLACE_PHOTOS[key]

for c in TRIP["castles"]:
    if c["name"] in CASTLE_EXTRA:
        c["photo_key"], c["why"], c["photo_tip"] = CASTLE_EXTRA[c["name"]]

for d in TRIP["days"]:
    ex = DAY_EXTRAS.get(d["n"])
    if ex:
        d["schedule"] = ex["schedule"]
        d["notes"] = {"michael": ex.get("michael"), "grace": ex.get("grace"), "together": ex.get("together")}

TRIP["photos"] = PHOTOS
TRIP["city_photos"] = CITY_PHOTOS
TRIP["packing"] = PACKING

# ---- write data.js + trip.json ------------------------------------------
header = (
    "/*\n"
    "  Baltic Adventure 2026 — canonical trip data (GENERATED by assemble.py).\n"
    "  window.TRIP drives the whole guide and loads offline from file://.\n"
    "  To change content: edit assemble.py (facts/schedules/notes/packing) or\n"
    "  fetch_photos.py (images), then run `python assemble.py`. Confirmed booking\n"
    "  numbers/costs are real; anything labeled a recommendation is a suggestion.\n"
    "*/\n"
)
js = header + "window.TRIP = " + json.dumps(TRIP, indent=2, ensure_ascii=False) + ";\n"
(HERE / "data.js").write_text(js, encoding="utf-8")
json.dump(TRIP, open(HERE / "data" / "trip.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"Assembled: {len(TRIP['hotels'])} hotels, {len(TRIP['places'])} places, "
      f"{len(TRIP['castles'])} castles, {len(TRIP['days'])} days, "
      f"{sum(1 for v in PHOTOS.values() if v)} photos, packing + schedules + notes merged.")
