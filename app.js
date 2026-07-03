/* Baltic Adventure 2026 — render layer (v2). Reads window.TRIP (data.js) and
   fills all sections: photos, embedded maps, deep hotel pages, timed schedules,
   personal notes, interactive budget, rich restaurant cards, open-items flow.
   Vanilla JS, no build, works offline (embedded maps/photos need internet). */
(function () {
  "use strict";
  var T = window.TRIP;
  if (!T) { console.error("TRIP data missing"); return; }
  var P = T.photos || {};

  // -- helpers ----------------------------------------------------------
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c];
    });
  }
  function gmap(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }
  function gdir(q) { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q); }
  function mapLink(q, label) {
    return '<a href="' + gmap(q) + '" target="_blank" rel="noopener">' + esc(label || "Map") + "</a>";
  }
  function site(url, label) {
    if (!url) return esc(label || "");
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label || url) + "</a>";
  }
  // photo figure by key; '' if missing. onerror hides it (offline/broken-safe).
  function photo(key, cls) {
    var p = P[key];
    if (!p || !p.url) return "";
    var credit = esc(p.credit || "Wikimedia Commons") + (p.license ? " · " + esc(p.license) : "");
    var creditHtml = p.page ? '<a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + credit + "</a>" : credit;
    return '<figure class="ph ' + (cls || "") + '">' +
      '<img loading="lazy" src="' + esc(p.url) + '" alt="" ' +
      "onerror=\"this.closest('figure').style.display='none'\">" +
      '<figcaption>📷 ' + creditHtml + "</figcaption></figure>";
  }
  // Tap-to-load Google map (keeps the page fast/light on mobile + metered data).
  // The Open-in-Maps / Directions links are always available; the interactive
  // embed loads only when tapped. Needs internet.
  function mapEmbed(query, label) {
    return '<div class="mapbox no-print" data-mapq="' + esc(query) + '">' +
      '<button type="button" class="map-load">🗺️ Tap to load interactive map' +
      (label ? ' — <span>' + esc(label) + "</span>" : "") + "</button>" +
      '<div class="mapbox-links">' + mapLink(query, "📍 Open in Google Maps") +
      ' · <a href="' + gdir(query) + '" target="_blank" rel="noopener">🧭 Directions</a></div></div>';
  }
  function statusBadge(status) {
    var s = (status || "").toLowerCase(), cls = "b-ok", txt = status || "—";
    if (/wrong|fix|verify|open/.test(s)) cls = "b-warn";
    if (/critical/.test(s)) cls = "b-crit";
    return '<span class="badge ' + cls + '">' + esc(txt) + "</span>";
  }
  function money(eur, usd) {
    var parts = [];
    if (eur != null) parts.push("€" + Number(eur).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    if (usd != null) parts.push("$" + Number(usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    return parts.join(" / ") || "—";
  }
  // localStorage helpers
  var STORE = "baltic2026";
  function load(k, d) { try { return JSON.parse(localStorage.getItem(STORE + "." + k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(STORE + "." + k, JSON.stringify(v)); } catch (e) {} }

  // open-items resolution state (used by summary + open sections) -------
  var resolved = load("resolved", {});

  // -- SUMMARY ----------------------------------------------------------
  (function summary() {
    var f = T.flights, h = T.hotels, c = T.car, b = T.bus;
    var flightRows = f.map(function (x) {
      return "<li><b>" + esc(x.flight) + "</b> · " + esc(x.from) + " → " + esc(x.to) + " · " + esc(x.date_label) + " " + esc(x.depart) + "</li>";
    }).join("");
    var hotelRows = h.map(function (x) {
      return "<li><b>" + esc(x.city) + "</b> — " + site(x.website, x.name) + " · " + esc(x.checkin.slice(5)) + "→" + esc(x.checkout.slice(5)) + " (" + x.nights + "n) · " + esc(x.cost) + " " + statusBadge(x.status) + "</li>";
    }).join("");
    el("summary-cards").innerHTML =
      '<div class="card"><h4>✈ Flights</h4><p><small>Air France booking ref <b>' + esc(T.meta.booking_ref) + "</b></small></p><ul>" + flightRows + "</ul></div>" +
      '<div class="card"><h4>🏨 Hotels</h4><p><small>All four confirmed</small></p><ul>' + hotelRows + "</ul></div>" +
      '<div class="card"><h4>🚌 Coach — ' + site(b.website, b.operator) + '</h4><p>' + esc(b.leg) + " · " + esc(b.date_label) + "<br>" + esc(b.depart_time) + " " + esc(b.depart_location) + "<br>→ " + esc(b.arrive_time) + " " + esc(b.arrive_location) + " (" + esc(b.duration) + ")<br>Seats " + esc(b.seats) + " · " + esc(b.cost) + " " + statusBadge(b.status) + "</p></div>" +
      '<div class="card"><h4>🚗 Rental car</h4><p>' + site(c.website, c.vendor) + " · booking <b>" + esc(c.booking_number) + "</b><br>" + esc(c.vehicle) + "<br>Pickup " + esc(c.pickup.location) + " · " + esc(c.pickup.date.slice(5)) + " " + esc(c.pickup.time) + "<br>Drop-off " + esc(c.dropoff_current.location) + " · " + esc(c.dropoff_current.date.slice(5)) + " " + esc(c.dropoff_current.time) + "<br>" + esc(c.cost) + " " + statusBadge("Confirmed") + "</p></div>" +
      '<div class="card"><h4>🧭 Route &amp; rhythm</h4><p>' + esc(T.meta.route) + '</p><p><small>Eleven nights, twelve dates · ' + esc(T.meta.theme) + "</small></p></div>";
    renderMustFix();
  })();

  // -- OPEN ITEMS (with resolution) ------------------------------------
  function isResolved(i) { return !!resolved["open" + i]; }
  function renderMustFix() {
    var box = el("summary-mustfix");
    if (!box) return;
    var crit = T.open_items.map(function (o, i) { return { o: o, i: i }; })
      .filter(function (x) { return x.o.priority === "critical" && !isResolved(x.i); });
    if (!crit.length) {
      box.innerHTML = '<div class="alert amber"><h4>✓ All critical items resolved</h4><p>Nice — the three trip-breakers are checked off. Travel easy.</p></div>';
      return;
    }
    box.innerHTML = '<div class="alert"><h4>⚠ Must fix before departure</h4><ul>' +
      crit.map(function (x) { return "<li>" + esc(x.o.text) + "</li>"; }).join("") + "</ul></div>";
  }
  function renderOpen() {
    var crit = T.open_items.map(function (o, i) { return { o: o, i: i }; })
      .filter(function (x) { return x.o.priority === "critical" && !isResolved(x.i); });
    el("open-redbox").innerHTML = crit.length
      ? '<div class="alert"><h4>🔴 The three that can break the trip</h4><ul>' + crit.map(function (x) { return "<li>" + esc(x.o.text) + "</li>"; }).join("") + "</ul></div>"
      : '<div class="alert amber"><h4>✓ Trip-breakers cleared</h4><p>All critical items are checked off below.</p></div>';

    var order = { critical: 0, high: 1, medium: 2, low: 3 };
    var items = T.open_items.map(function (o, i) { return { o: o, i: i }; })
      .sort(function (a, b) {
        var ra = isResolved(a.i), rb = isResolved(b.i);
        if (ra !== rb) return ra ? 1 : -1; // resolved sink to bottom
        return order[a.o.priority] - order[b.o.priority];
      });
    el("open-list").innerHTML = '<ul class="checklist" id="open-checklist">' +
      items.map(function (x) {
        var done = isResolved(x.i);
        return '<li class="' + (done ? "done" : "") + '"><input type="checkbox" data-open="' + x.i + '"' + (done ? " checked" : "") + ">" +
          '<span class="prio ' + x.o.priority + '">' + x.o.priority + "</span>" +
          '<span class="txt">' + esc(x.o.text) + "</span></li>";
      }).join("") + "</ul>" +
      '<p><small>Check an item to mark it resolved — critical ones drop out of the red box above and out of the master summary.</small></p>';
    el("open-checklist").addEventListener("change", function (e) {
      var box = e.target.closest("input[data-open]"); if (!box) return;
      resolved["open" + box.getAttribute("data-open")] = box.checked;
      save("resolved", resolved);
      renderOpen(); renderMustFix();
    });
  }
  renderOpen();

  // -- DASHBOARD --------------------------------------------------------
  (function dashboard() {
    var rows = [];
    rows.push(["Flights", "Jul 8–9 / 19", "—", "Air France / Delta / KLM", T.meta.booking_ref, "SLC·CDG·HEL · VNO·AMS·SLC", "", "https://www.airfrance.com", T.ticket.total_cost + " (Michael)", "Confirmed", "Grace's ticket unconfirmed", null]);
    T.hotels.forEach(function (x) { rows.push(["Hotel", x.checkin.slice(5) + "→" + x.checkout.slice(5), x.city, x.name, x.confirmation, x.address, x.phone, x.website, x.cost, x.status, x.notes, x.address + " " + x.city]); });
    var c = T.car, bus = T.bus;
    rows.push(["Coach", bus.date.slice(5), "Tallinn→Riga", bus.operator, "Seats " + bus.seats.split("(")[0].trim(), bus.depart_location + " → " + bus.arrive_location, "", bus.website, bus.cost, bus.status, bus.depart_time + " → " + bus.arrive_time + " (" + bus.duration + ")", bus.depart_location]);
    rows.push(["Rental car", c.pickup.date.slice(5) + "→" + c.dropoff_current.date.slice(5), "Riga→Vilnius", c.vendor, c.booking_number, c.pickup.location + " → " + c.dropoff_current.location, "", c.website, c.cost, "Confirmed", "Jul 14 3:00 PM → Jul 19 6:00 AM", c.pickup.location]);
    var head = ["Category", "Date", "City", "Vendor", "Conf #", "Address", "Phone", "Website", "Cost", "Status", "Notes"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var tbody = rows.map(function (r) {
      var addrCell = r[11] ? esc(r[5]) + "<br>" + mapLink(r[11], "📍 Map") : esc(r[5]);
      return "<tr><td><b>" + esc(r[0]) + "</b></td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td>" +
        "<td>" + site(r[7], r[3]) + "</td><td>" + esc(r[4]) + "</td><td>" + addrCell + "</td>" +
        "<td>" + (r[6] ? '<a href="tel:' + esc(r[6].replace(/\s/g, "")) + '">' + esc(r[6]) + "</a>" : "—") + "</td>" +
        "<td>" + (r[7] ? site(r[7], "site") : "—") + "</td><td>" + esc(r[8]) + "</td><td>" + statusBadge(r[9]) + "</td>" +
        "<td><small>" + esc(r[10]) + "</small></td></tr>";
    }).join("");
    el("dashboard-table").innerHTML = '<div class="table-wrap"><table>' + thead + tbody + "</table></div>";
  })();

  // -- ROUTE CITY CARDS + overview map ---------------------------------
  (function routeCards() {
    var segs = [
      ["Jul 8–9 · Fly", "SLC → Paris CDG → Helsinki", "Two flights, one long day. Land Helsinki 4:40 PM."],
      ["Jul 10 · Ferry", "Helsinki → Tallinn", "Tallink, ~2 hrs across the Gulf of Finland."],
      ["Jul 14 · Bus", "Tallinn → Riga", "Lux Express coach, ~4.5 hrs south."],
      ["Jul 16 · Car", "Riga → Sigulda · Turaida · Cēsis → Riga", "Countryside day-trip, sleep in Riga again."],
      ["Jul 17 · Car", "Riga → Hill of Crosses → Vilnius", "The big transfer; one iconic stop."],
      ["Jul 18 · Car", "Vilnius → Trakai → Vilnius", "Island castle day trip, ~30 min each way."],
      ["Jul 19 · Fly", "Vilnius → Amsterdam → SLC", "Early start (7:50 AM). Home 1:08 PM."]
    ];
    el("route-cards").innerHTML = segs.map(function (s) {
      return '<div class="card tight"><div class="section-eyebrow">' + esc(s[0]) + '</div><h4 style="margin:.2rem 0">' + esc(s[1]) + "</h4><p><small>" + esc(s[2]) + "</small></p></div>";
    }).join("");
    if (el("route-overview-map")) el("route-overview-map").innerHTML = storyMap();
  })();

  // -- STORY MAP (self-contained SVG: countries · cities · excursions) ---
  function storyMap() {
    // pixel coords ~ lon/lat projected (west→east = x, north→south = y)
    var cities = [
      { name: "Helsinki", x: 344, y: 105, sub: "Jul 9 · arrive", lx: 12, anc: "start" },
      { name: "Tallinn",  x: 325, y: 181, sub: "Jul 10–14 · 4 nights", lx: 12, anc: "start" },
      { name: "Riga",     x: 261, y: 442, sub: "Jul 14–17 · 3 nights", lx: -12, anc: "end" },
      { name: "Vilnius",  x: 378, y: 679, sub: "Jul 17–19 · 2 nights", lx: 12, anc: "start" }
    ];
    var excur = [
      { name: "Sigulda · Turaida", x: 335, y: 420, lx: 12, anc: "start" },
      { name: "Cēsis", x: 377, y: 400, lx: 12, anc: "start" },
      { name: "Hill of Crosses", x: 182, y: 549, lx: -10, anc: "end" },
      { name: "Trakai", x: 343, y: 690, lx: -10, anc: "end" }
    ];
    // "possible" optional day-trips (hollow rings) — one iconic option per city
    var poss = [
      { name: "Porvoo", x: 416, y: 84, lx: 8, anc: "start" },
      { name: "Lahemaa NP", x: 432, y: 176, lx: 8, anc: "start" },
      { name: "Rundāle Palace", x: 252, y: 499, lx: -8, anc: "end" },
      { name: "Kernavė", x: 332, y: 658, lx: -8, anc: "end" }
    ];
    var countries = [
      { t: "FINLAND", x: 360, y: 58 }, { t: "ESTONIA", x: 432, y: 248 },
      { t: "LATVIA", x: 460, y: 468 }, { t: "LITHUANIA", x: 432, y: 640 }
    ];
    var seas = [
      { t: "Gulf of Finland", x: 172, y: 150 }, { t: "Baltic", x: 90, y: 358 },
      { t: "Sea", x: 90, y: 376 }, { t: "Gulf of Riga", x: 148, y: 470 }
    ];
    function node(n, cls, r) {
      var tx = n.x + n.lx;
      return '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '" class="' + cls + '"/>' +
        '<text x="' + tx + '" y="' + (n.y - 1) + '" text-anchor="' + n.anc + '" class="lbl-' + cls + '">' + esc(n.name) + "</text>" +
        (n.sub ? '<text x="' + tx + '" y="' + (n.y + 13) + '" text-anchor="' + n.anc + '" class="lbl-sub">' + esc(n.sub) + "</text>" : "");
    }
    return '<svg viewBox="0 0 560 780" width="100%" preserveAspectRatio="xMidYMid meet" ' +
      'style="max-width:540px;display:block;margin:0 auto;height:auto;background:#faf8f2;border-radius:12px" ' +
      'role="img" aria-label="Route map: Helsinki, Tallinn, Riga, Vilnius with planned and possible day-trips">' +
      '<style>' +
      '.lbl-city{font:700 15px system-ui,sans-serif;fill:#2c2a26}' +
      '.lbl-exc{font:600 12px system-ui,sans-serif;fill:#8a5a12}' +
      '.lbl-poss{font:italic 11px system-ui,sans-serif;fill:#a5824a}' +
      '.lbl-sub{font:400 11px system-ui,sans-serif;fill:#8a8578}' +
      '.exc{fill:#d99a2b;stroke:#fff;stroke-width:1.5}' +
      '.poss{fill:#faf8f2;stroke:#d99a2b;stroke-width:1.8}' +
      '.city{fill:#b5532a;stroke:#fff;stroke-width:2}' +
      '</style>' +
      '<text x="280" y="32" text-anchor="middle" style="font:700 16px Georgia,serif;fill:#2c2a26">The Journey — north to south</text>' +
      countries.map(function (c) { return '<text x="' + c.x + '" y="' + c.y + '" text-anchor="middle" style="font:700 16px system-ui,sans-serif;fill:#cabfa8;letter-spacing:4px">' + c.t + "</text>"; }).join("") +
      seas.map(function (s) { return '<text x="' + s.x + '" y="' + s.y + '" text-anchor="middle" style="font:italic 12px Georgia,serif;fill:#8fa9c2">' + s.t + "</text>"; }).join("") +
      // legs
      '<path d="M344,105 L325,181" fill="none" stroke="#3b6ea5" stroke-width="3.5" stroke-dasharray="2 6" stroke-linecap="round"/>' +
      '<path d="M325,181 L261,442" fill="none" stroke="#b5532a" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M261,442 L182,549 L378,679" fill="none" stroke="#b5532a" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M261,442 L335,420 M261,442 L377,400 M378,679 L343,690" fill="none" stroke="#d99a2b" stroke-width="1.6" stroke-dasharray="1 4" stroke-linecap="round"/>' +
      // leg mode labels
      '<text x="318" y="145" text-anchor="end" style="font:600 12px system-ui;fill:#3b6ea5">⛴ Ferry · Jul 10 · to book</text>' +
      '<text x="286" y="318" text-anchor="end" style="font:600 12px system-ui;fill:#b5532a">🚌 Coach · Jul 14</text>' +
      '<text x="214" y="600" text-anchor="end" style="font:600 12px system-ui;fill:#b5532a">🚗 Car · Jul 16–19</text>' +
      poss.map(function (n) { return node(n, "poss", 4); }).join("") +
      excur.map(function (n) { return node(n, "exc", 4.5); }).join("") +
      cities.map(function (n) { return node(n, "city", 7); }).join("") +
      // legend
      '<g transform="translate(28,724)" style="font:400 10.5px system-ui;fill:#6b6a63">' +
      '<circle cx="6" cy="-3" r="6" fill="#b5532a" stroke="#fff" stroke-width="1.5"/><text x="17" y="1">City / overnight</text>' +
      '<circle cx="120" cy="-3" r="4" fill="#d99a2b" stroke="#fff" stroke-width="1.5"/><text x="130" y="1">Day-trip</text>' +
      '<circle cx="190" cy="-3" r="4" fill="#faf8f2" stroke="#d99a2b" stroke-width="1.8"/><text x="200" y="1">Possible</text>' +
      '<line x1="2" y1="15" x2="26" y2="15" stroke="#3b6ea5" stroke-width="3" stroke-dasharray="2 5"/><text x="32" y="18">Ferry</text>' +
      '<line x1="84" y1="15" x2="108" y2="15" stroke="#b5532a" stroke-width="3.5"/><text x="114" y="18">Coach / car (road)</text>' +
      "</g>" +
      "</svg>";
  }

  // -- CITY PANEL (food + day-trips woven into the day you arrive) -------
  var CASTLE_BASE = {
    "Turaida Castle": "Riga", "Sigulda": "Riga", "Gauja National Park": "Riga", "Cēsis": "Riga",
    "Trakai Castle": "Vilnius", "Hill of Crosses": "Vilnius"
  };
  // optional day-trips — surfaced as "also possible" with a photo when available
  var POSSIBLE_TRIPS = {
    "Helsinki": [{ name: "Porvoo", photo_key: "trip_porvoo", drive: "~50 min from Helsinki", why: "Finland's storybook second-oldest town — red-ochre riverside warehouses and cobbled lanes." }],
    "Tallinn": [{ name: "Lahemaa National Park", photo_key: "trip_lahemaa", drive: "~1 hr from Tallinn", why: "Estonia's largest national park — bog boardwalks, manor houses, and a wild Baltic coast." }],
    "Riga": [{ name: "Rundāle Palace", photo_key: "trip_rundale", drive: "~1 hr from Riga", why: "The 'Baltic Versailles' — a rococo palace and formal gardens south of Riga." }],
    "Vilnius": [{ name: "Kernavė", photo_key: "trip_kernave", drive: "~40 min from Vilnius", why: "UNESCO hill-fort mounds on the Neris — Lithuania's ancient first capital." }]
  };
  function clip(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function cityPanel(city) {
    var pls = (T.places || []).filter(function (p) { return p.city === city; });
    var cs = (T.castles || []).filter(function (c) { return CASTLE_BASE[c.name] === city; });
    var pos = POSSIBLE_TRIPS[city] || [];
    if (!pls.length && !cs.length && !pos.length) return "";
    var food = pls.map(function (p) {
      var name = p.website ? site(p.website, p.name) : "<b>" + esc(p.name) + "</b>";
      var res = /yes|recommend|eve/i.test(p.reserve || "") ? '<span class="cp-badge cp-res">reserve</span>' : "";
      var meta = esc([p.type, p.tag].filter(Boolean).join(" / ")) + (p.cost_band ? " · " + esc(p.cost_band) : "");
      var desc = clip(p.signature || p.why, 92);
      return '<div class="cp-chip"><div class="cp-row">' + name + res + '</div><div class="cp-meta">' + meta + "</div>" + (desc ? "<p>" + esc(desc) + "</p>" : "") + "</div>";
    }).join("");
    var trips = cs.map(function (c) {
      var thumb = c.photo_key ? photo(c.photo_key, "cp-thumb") : "";
      var when = c.timing ? '<span class="cp-badge cp-day">' + esc(clip(c.timing.split("·")[0].split(",")[0], 16)) + "</span>" : "";
      var meta = esc([c.drive, c.duration].filter(Boolean).join(" · "));
      return '<div class="cp-chip cp-castle">' + thumb + '<div class="cp-row"><b>' + esc(c.name) + "</b>" + when + '</div><div class="cp-meta">' + meta + "</div>" + (c.why ? "<p>" + esc(clip(c.why, 96)) + "</p>" : "") + "</div>";
    }).join("");
    var possibles = pos.map(function (t) {
      var thumb = t.photo_key ? photo(t.photo_key, "cp-thumb") : "";
      return '<div class="cp-chip cp-poss">' + thumb + '<div class="cp-row"><b>' + esc(t.name) + '</b><span class="cp-badge cp-maybe">possible</span></div><div class="cp-meta">' + esc(t.drive || "") + "</div>" + (t.why ? "<p>" + esc(clip(t.why, 100)) + "</p>" : "") + "</div>";
    }).join("");
    return '<div class="city-panel">' +
      '<div class="cp-head">🧭 In ' + esc(city) + "</div>" +
      (food ? '<div class="cp-sect"><h5>🍽 Eat &amp; drink</h5><div class="cp-grid">' + food + "</div></div>" : "") +
      (trips ? '<div class="cp-sect"><h5>🏰 Day-trips from ' + esc(city) + '</h5><div class="cp-grid">' + trips + "</div></div>" : "") +
      (possibles ? '<div class="cp-sect"><h5>✦ Also possible</h5><div class="cp-grid">' + possibles + "</div></div>" : "") +
      "</div>";
  }
  var CP_STYLE = '<style>' +
    '.city-panel{background:#fbf9f3;border:1px solid #e7e1d3;border-left:3px solid #b5532a;border-radius:10px;padding:12px 14px;margin-top:14px}' +
    '.cp-head{font-weight:700;font-size:15px;margin-bottom:8px;color:#2c2a26}' +
    '.cp-sect{margin-top:8px}' +
    '.cp-sect h5{margin:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#8a5a12}' +
    '.cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '@media(max-width:560px){.cp-grid{grid-template-columns:1fr}}' +
    '.cp-chip{background:#fff;border:1px solid #ece6d8;border-radius:8px;padding:8px 10px}' +
    '.cp-castle{border-left:3px solid #d99a2b}' +
    '.cp-row{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:13px}' +
    '.cp-meta{font-size:11px;color:#8a8578;margin:1px 0 4px}' +
    '.cp-chip p{margin:0;font-size:12px;line-height:1.35;color:#4a473f}' +
    '.cp-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap}' +
    '.cp-res{background:#fbeee0;color:#a5551a}' +
    '.cp-day{background:#fdf2d6;color:#8a6410}' +
    '.cp-poss{border-left:3px solid #cbbfa8}' +
    '.cp-maybe{background:#eef0e8;color:#6e7355}' +
    '.cp-chip .ph.cp-thumb{margin:0 0 6px}' +
    '.cp-chip .ph.cp-thumb img{width:100%;height:92px;object-fit:cover;border-radius:6px;display:block}' +
    '.cp-chip .ph.cp-thumb figcaption{font-size:9px;color:#b3ad9f;margin-top:2px;line-height:1.2}' +
    '</style>';

  // -- DAY BY DAY -------------------------------------------------------
  (function days() {
    var seenCity = {};
    var html = T.days.map(function (d) {
      // city hero photo on the first day we reach a new city
      var cityName = (d.city || "").split("→").pop().trim().split(" ")[0];
      var firstInCity = cityName && !seenCity[cityName];
      if (firstInCity) seenCity[cityName] = 1;
      var ck = T.city_photos && T.city_photos[cityName];
      var hero = (firstInCity && ck) ? photo(ck, "hero") : "";
      var cityRef = firstInCity ? cityPanel(cityName) : "";

      var slots = "";
      [["Morning", d.morning], ["Afternoon", d.afternoon], ["Evening", d.evening]].forEach(function (s) {
        if (s[1]) slots += '<div class="slot"><h5>' + s[0] + "</h5><p>" + esc(s[1]) + "</p></div>";
      });
      var sched = "";
      if (d.schedule && d.schedule.length) {
        sched = '<details class="sched" open><summary>Suggested rhythm (flexible)</summary><table class="sched-tbl"><tbody>' +
          d.schedule.map(function (r) { return "<tr><td class='t'>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
          "</tbody></table></details>";
      }
      var notes = "";
      if (d.notes) {
        if (d.notes.michael) notes += '<div class="callout c-m"><b>Michael</b> ' + esc(d.notes.michael) + "</div>";
        if (d.notes.grace) notes += '<div class="callout c-g"><b>Grace</b> ' + esc(d.notes.grace) + "</div>";
        if (d.notes.together) notes += '<div class="callout c-t"><b>Together</b> ' + esc(d.notes.together) + "</div>";
      }
      var maps = (d.maps && d.maps.length) ? '<div class="maplinks">' + d.maps.map(function (m) { return mapLink(m, m); }).join("") + "</div>" : "";
      var reminders = (d.reminders && d.reminders.length) ? '<div class="note-line"><b>Reminders:</b> ' + d.reminders.map(esc).join(" · ") + "</div>" : "";

      return '<div class="day">' +
        '<div class="day-head"><span class="day-n">Day ' + d.n + '</span><span class="day-date">' + esc(d.date_label) + '</span><span class="day-city">' + esc(d.city) + "</span></div>" +
        '<div class="day-body">' + hero +
          '<div class="day-theme">' + esc(d.theme) + "</div>" +
          '<div class="meta-row"><span class="meta-pill"><b>Sleep:</b> ' + esc(d.sleep) + '</span><span class="meta-pill"><b>Transport:</b> ' + esc(d.transport) + "</span></div>" +
          sched +
          '<div class="slots">' + slots + "</div>" +
          notes +
          (d.reservation ? '<div class="note-line"><b>Reservation:</b> ' + esc(d.reservation) + "</div>" : "") +
          (d.stumble ? '<div class="stumble"><h5>✦ Stumble zone</h5><p>' + esc(d.stumble) + "</p></div>" : "") +
          (d.food ? '<div class="note-line"><b>Food &amp; café:</b> ' + esc(d.food) + "</div>" : "") +
          (d.backup ? '<div class="note-line"><b>Backup / rain:</b> ' + esc(d.backup) + "</div>" : "") +
          (d.dont_overplan ? '<div class="dont">🌿 Do not over-plan this day.</div>' : "") +
          reminders + maps + cityRef +
        "</div></div>";
    }).join("");
    el("days").innerHTML = CP_STYLE + html;
  })();

  // -- HOTELS (deep pages) ---------------------------------------------
  (function hotels() {
    var html = T.hotels.map(function (h) {
      var mapsQ = h.name + " " + h.city;
      var actions = '<div class="actions">' +
        (h.website ? '<a class="act" href="' + esc(h.website) + '" target="_blank" rel="noopener">🌐 Website</a>' : "") +
        '<a class="act" href="' + gmap(mapsQ) + '" target="_blank" rel="noopener">📍 Maps</a>' +
        '<a class="act" href="' + gdir(mapsQ) + '" target="_blank" rel="noopener">🧭 Directions</a>' +
        (h.phone ? '<a class="act" href="tel:' + esc(h.phone.replace(/\s/g, "")) + '">📞 Call</a>' : "") +
        (h.email ? '<a class="act" href="mailto:' + esc(h.email) + '">✉ Email</a>' : "") +
        '</div>';
      var facts = [
        ["History", h.history], ["Style", h.style], ["Restaurant", h.restaurant], ["Bar", h.bar],
        ["Spa / wellness", h.spa], ["Breakfast", h.breakfast], ["Check-in tips", h.checkin_tips],
        ["Parking", h.parking], ["Taxi", h.taxi_note], ["Best evening walk", h.best_evening_walk],
        ["Nearby hidden", h.nearby_hidden]
      ].filter(function (r) { return r[1]; }).map(function (r) {
        return '<div class="fact"><span class="fl">' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span></div>";
      }).join("");
      var booking = [
        ["Dates", h.checkin + " → " + h.checkout + " (" + h.nights + " night" + (h.nights > 1 ? "s" : "") + ")"],
        ["Room / rate", [h.room, h.rate].filter(Boolean).join(" · ") || "—"],
        ["Confirmation", h.confirmation + (h.extra_ref ? " · " + h.extra_ref : "")],
        ["Cost", h.cost], ["Address", esc(h.address)],
        ["Phone", h.phone || "—"], ["Email", h.email || "—"]
      ].map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"; }).join("");

      return '<div class="hotel" id="hotel-' + h.id + '">' +
        '<div class="hotel-head"><div class="hotel-city">' + esc(h.city) + " · " + esc(h.purpose) + "</div><h3>" + site(h.website, h.name) + "</h3>" + statusBadge(h.status) + "</div>" +
        photo(h.photo, "hero") +
        '<div class="hotel-body">' +
          '<div class="why">' + esc(h.why) + "</div>" + actions +
          '<div class="facts">' + facts + "</div>" +
          '<details class="booking"><summary>Booking details</summary><dl class="kv">' + booking + "</dl>" +
          (h.notes ? '<div class="note-line"><b>Note:</b> ' + esc(h.notes) + "</div>" : "") +
          '<div class="note-line"><b>Nearby:</b> ' + esc(h.essentials) + "</div></details>" +
          mapEmbed(mapsQ, "Hotel location & surroundings") +
        "</div></div>";
    }).join("");
    el("hotel-cards").innerHTML = html;
  })();

  // -- FLIGHTS + TRANSPORT + CAR ---------------------------------------
  (function flightsTable() {
    var head = ["Leg", "Date", "Flight", "Route", "Time", "Seat", "Bag", "Status"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var body = T.flights.map(function (x) {
      return "<tr><td><b>" + esc(x.leg) + "</b></td><td>" + esc(x.date_label) + "</td><td>" + esc(x.flight) + "<br><small>op. " + esc(x.operated_by) + "</small></td><td>" + esc(x.from) + " → " + esc(x.to) + "</td><td>" + esc(x.depart) + " → " + esc(x.arrive) + "</td><td>" + esc(x.seat || "—") + "</td><td>" + esc(x.baggage) + "</td><td>" + statusBadge(x.status) + "</td></tr>";
    }).join("");
    el("flights-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + "</table></div>" +
      '<p><small><b>Ticket:</b> ' + esc(T.ticket.passenger_on_ticket) + " · #" + esc(T.ticket.ticket_number) + " · " + esc(T.ticket.total_cost) + ". <b>Open:</b> " + esc(T.ticket.open_item) + "</small></p>";
  })();
  (function transportTable() {
    var head = ["Leg", "Date", "Mode", "Book with", "Target", "Notes"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var body = T.transport.map(function (x) {
      return "<tr><td><b>" + esc(x.leg) + "</b></td><td>" + esc(x.date.slice(5)) + "</td><td>" + esc(x.mode) + "</td><td>" + (x.website ? site(x.website, x.vendor) : esc(x.vendor)) + "</td><td>" + esc(x.target) + "</td><td><small>" + esc(x.notes) + "</small></td></tr>";
    }).join("");
    el("transport-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + "</table></div>";
  })();
  (function carCard() {
    var c = T.car;
    el("car-card").innerHTML = '<div class="alert"><h4>🚗 Rental car — ' + site(c.website, c.vendor) + " · booking " + esc(c.booking_number) + "</h4>" +
      "<p>" + esc(c.vehicle) + " · " + esc(c.transmission) + " · " + c.seats + " seats · " + c.luggage + " bags · A/C. Driver: " + esc(c.driver) + ".</p>" +
      "<p><b>Pickup:</b> " + esc(c.pickup.location) + " · " + esc(c.pickup.date) + " " + esc(c.pickup.time) + "<br><b>Drop-off (booked):</b> " + esc(c.dropoff_current.location) + " · " + esc(c.dropoff_current.date) + " " + esc(c.dropoff_current.time) + ' <span class="badge b-crit">WRONG</span><br><b>Should be:</b> ' + esc(c.dropoff_should_be) + "</p>" +
      "<p><b>Verify before travel:</b></p><ul>" + c.open_items.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul><p><small><b>Cost:</b> " + esc(c.cost_estimate) + "</small></p></div>" +
      mapEmbed("Riga Airport to Vilnius Airport", "RIX pickup → VNO return");
  })();

  // -- WALKS: inject landmark photo strips ------------------------------
  (function walks() {
    var strips = {
      "walk-tallinn-photos": ["tallinn_st_catherine", "tallinn_town_hall", "tallinn_viewpoint", "tallinn_pikk"],
      "walk-riga-photos": ["riga_alberta", "riga_blackheads", "city_riga"],
      "walk-vilnius-photos": ["vilnius_pilies", "vilnius_uzupis", "vilnius_cathedral", "vilnius_gediminas"]
    };
    Object.keys(strips).forEach(function (id) {
      var node = el(id); if (!node) return;
      node.innerHTML = '<div class="photo-strip">' + strips[id].map(function (k) { return photo(k); }).join("") + "</div>";
    });
    // walking map embeds
    [["walk-tallinn-map", "Tallinn Old Town"], ["walk-riga-map", "Riga Old Town Alberta iela"], ["walk-vilnius-map", "Vilnius Old Town Pilies street"]].forEach(function (p) {
      if (el(p[0])) el(p[0]).innerHTML = mapEmbed(p[1], "Walking area");
    });
  })();

  // -- FOOD: rich cards, searchable + editable scores -------------------
  (function food() {
    var cities = ["All"].concat(T.places.map(function (p) { return p.city; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var chipsEl = el("food-chips"), searchEl = el("food-search"), out = el("food-table");
    chipsEl.innerHTML = cities.map(function (cty, i) { return '<span class="chip' + (i === 0 ? " active" : "") + '" data-city="' + esc(cty) + '">' + esc(cty) + "</span>"; }).join("");
    var activeCity = "All";
    var scores = load("scores", {});

    function tagBadge(t) { return t === "hotel" ? '<span class="badge b-hotel">In hotel</span>' : (t === "rec" ? '<span class="badge b-rec">Recommendation</span>' : ""); }
    function stars(name, who) {
      var key = name + "|" + who, val = scores[key] || 0, out = '<span class="stars" data-key="' + esc(key) + '" title="' + who + "'s score\">";
      for (var i = 1; i <= 5; i++) out += '<span class="star' + (i <= val ? " on" : "") + '" data-v="' + i + '">★</span>';
      return out + "</span>";
    }
    function card(p) {
      var name = p.website ? site(p.website, p.name) : esc(p.name);
      var resv = p.reservation_url ? '<a class="act" href="' + esc(p.reservation_url) + '" target="_blank" rel="noopener">📖 Reserve</a>' : "";
      var meta = [];
      if (p.cost_band) meta.push('<span class="pill-cost">' + esc(p.cost_band) + "</span>");
      if (p.dress) meta.push('<span class="pill-x">' + esc(p.dress) + "</span>");
      if (p.reserve) meta.push('<span class="pill-x">' + esc(p.reserve === "No" ? "Walk-in" : "Reserve: " + p.reserve) + "</span>");
      return '<div class="food-card">' + photo(p.photo) +
        '<div class="fc-body"><div class="fc-head"><h4>' + name + "</h4> " + tagBadge(p.tag) + "</div>" +
        '<div class="fc-meta">' + esc(p.city) + " · " + esc(p.type) + "</div>" +
        '<p class="fc-why">' + esc(p.signature || p.why) + "</p>" +
        (meta.length ? '<div class="fc-pills">' + meta.join("") + "</div>" : "") +
        (p.after_walk ? '<p class="fc-after"><b>After:</b> ' + esc(p.after_walk) + "</p>" : "") +
        '<div class="fc-actions"><a class="act" href="' + gmap(p.name + " " + p.city) + '" target="_blank" rel="noopener">📍 Map</a>' + resv + "</div>" +
        '<div class="fc-scores no-print"><span>Michael ' + stars(p.name, "Michael") + "</span><span>Grace " + stars(p.name, "Grace") + "</span></div>" +
        "</div></div>";
    }
    function render() {
      var q = (searchEl.value || "").toLowerCase().trim();
      var list = T.places.filter(function (p) {
        if (activeCity !== "All" && p.city !== activeCity) return false;
        if (!q) return true;
        return (p.name + " " + p.type + " " + (p.signature || p.why) + " " + p.city + " " + (p.notes || "")).toLowerCase().indexOf(q) >= 0;
      });
      out.innerHTML = '<p class="muted-count no-print">' + list.length + " place" + (list.length === 1 ? "" : "s") + '</p><div class="food-grid">' +
        (list.map(card).join("") || "<p>No matches.</p>") + "</div>";
    }
    chipsEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      activeCity = chip.getAttribute("data-city");
      Array.prototype.forEach.call(chipsEl.children, function (c) { c.classList.toggle("active", c === chip); });
      render();
    });
    searchEl.addEventListener("input", render);
    out.addEventListener("click", function (e) {
      var star = e.target.closest(".star"); if (!star) return;
      var wrap = star.closest(".stars"), key = wrap.getAttribute("data-key"), v = +star.getAttribute("data-v");
      scores[key] = (scores[key] === v) ? 0 : v; save("scores", scores);
      Array.prototype.forEach.call(wrap.children, function (s, i) { s.classList.toggle("on", (i + 1) <= scores[key]); });
    });
    render();
  })();

  // -- CASTLES (photo + map) -------------------------------------------
  (function castles() {
    el("castle-cards").innerHTML = T.castles.map(function (c) {
      var recCls = /^KEEP/.test(c.rec) ? "b-ok" : (/^OPTIONAL/.test(c.rec) ? "b-warn" : "b-info");
      return '<div class="card castle">' + photo(c.photo_key, "hero") +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem"><h3 style="margin:.3rem 0">' + esc(c.name) + '</h3><span class="badge ' + recCls + '">' + esc(c.rec) + "</span></div>" +
        "<p><small>" + esc(c.region) + "</small></p>" +
        '<div class="why">' + esc(c.why) + "</div>" +
        '<div class="note-line"><b>Drive:</b> ' + esc(c.drive) + " · <b>Parking:</b> " + esc(c.parking) + "</div>" +
        '<div class="note-line"><b>Best timing:</b> ' + esc(c.timing) + " · <b>Stay:</b> " + esc(c.duration) + "</div>" +
        (c.photo_tip ? '<div class="note-line"><b>Photo:</b> ' + esc(c.photo_tip) + "</div>" : "") +
        mapEmbed(c.name, c.region) + "</div>";
    }).join("");
  })();

  // -- BUDGET (interactive Budget/Actual/Remaining) --------------------
  (function budget() {
    var actuals = load("actuals", {});
    function num(v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; }
    function planUSD(b) {
      if (b.amount_usd != null) return b.amount_usd;
      if (b.amount_eur != null) return Math.round(b.amount_eur * 1.10); // ~EUR→USD for a rough common unit
      return null;
    }
    function render() {
      var head = ["Item", "Budget (≈USD)", "Actual (USD)", "Remaining", "Status"];
      var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
      var tBudget = 0, tActual = 0;
      var body = T.budget.map(function (b, i) {
        var plan = planUSD(b); if (plan) tBudget += plan;
        var act = actuals[i] != null ? actuals[i] : "";
        var actNum = num(act); if (actNum != null) tActual += actNum;
        var rem = (plan != null && actNum != null) ? plan - actNum : null;
        var remCls = rem == null ? "" : (rem < 0 ? "neg" : "pos");
        return "<tr><td><b>" + esc(b.item) + "</b><br><small>" + esc(b.note) + "</small></td>" +
          "<td>" + (plan != null ? "$" + plan.toLocaleString() : "—") + (b.amount_eur != null ? "<br><small>€" + b.amount_eur.toLocaleString() + "</small>" : "") + "</td>" +
          '<td><input class="actual-in no-print" data-i="' + i + '" inputmode="decimal" value="' + esc(act) + '" placeholder="—"><span class="print-only">' + esc(act || "—") + "</span></td>" +
          '<td class="' + remCls + '">' + (rem != null ? (rem < 0 ? "-$" + Math.abs(rem).toLocaleString() : "$" + rem.toLocaleString()) : "—") + "</td>" +
          "<td>" + statusBadge(b.status) + "</td></tr>";
      }).join("");
      var foot = "<tr class='tot'><td><b>Totals</b></td><td><b>$" + tBudget.toLocaleString() + "</b></td><td><b>$" + tActual.toLocaleString() + "</b></td><td><b>" + (tBudget - tActual >= 0 ? "$" + (tBudget - tActual).toLocaleString() : "-$" + Math.abs(tBudget - tActual).toLocaleString()) + "</b></td><td></td></tr>";
      el("budget-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + foot + "</table></div>" +
        '<p><small>Enter actual spend as you go — totals update live and persist on this device. "Budget" converts EUR hotel costs at ≈1.10 for a rough common USD unit.</small></p>';
      Array.prototype.forEach.call(document.querySelectorAll(".actual-in"), function (inp) {
        inp.addEventListener("change", function () { actuals[inp.getAttribute("data-i")] = inp.value; save("actuals", actuals); render(); });
      });
    }
    render();
    el("budget-unknowns").innerHTML = '<div class="alert amber"><h4>Unknowns remaining</h4><ul>' + T.budget_unknowns.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul></div>";
  })();

  // -- PACKING ----------------------------------------------------------
  (function packing() {
    var pk = T.packing; if (!pk || !el("packing-content")) return;
    function checks(arr, prefix) {
      return '<ul class="checklist">' + arr.map(function (t, i) { return '<li><input type="checkbox" data-pk="' + prefix + i + '"><span class="txt">' + esc(t) + "</span></li>"; }).join("") + "</ul>";
    }
    el("packing-content").innerHTML =
      '<p class="lede">' + esc(pk.intro) + "</p>" +
      '<div class="card"><h4>👟 Shoes — read this first</h4><p>' + esc(pk.shoes) + "</p></div>" +
      '<div class="grid cols-2">' +
        '<div class="card"><h4>Both of you</h4>' + checks(pk.shared, "sh") + "</div>" +
        '<div class="card"><h4>For Grace</h4>' + checks(pk.grace, "gr") + "</div>" +
        '<div class="card"><h4>For Michael</h4>' + checks(pk.michael, "mi") + "</div>" +
        '<div class="card"><h4>Leave at home</h4><ul>' + pk.leave.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" +
      "</div>";
  })();

  // -- BEFORE-DEPARTURE checklist (from open items) --------------------
  (function beforeList() {
    var ul = document.querySelector('.checklist[data-auto="before"]'); if (!ul) return;
    ul.innerHTML = T.open_items.map(function (o, i) { return '<li><input type="checkbox" data-k="bd' + i + '"><span class="txt">' + esc(o.text) + "</span></li>"; }).join("");
  })();

  // -- generic checkbox persistence (packing + checklists) -------------
  (function checkboxes() {
    var saved = load("checks", {});
    Array.prototype.forEach.call(document.querySelectorAll('.checklist input[type=checkbox]:not([data-open])'), function (box) {
      var k = box.getAttribute("data-k") || box.getAttribute("data-pk"); if (!k) return;
      if (saved[k]) { box.checked = true; box.closest("li").classList.add("done"); }
      box.addEventListener("change", function () {
        box.closest("li").classList.toggle("done", box.checked);
        saved[k] = box.checked; save("checks", saved);
      });
    });
  })();

  // -- tap-to-load maps (delegated) ------------------------------------
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".map-load"); if (!btn) return;
    var box = btn.closest(".mapbox"), q = box.getAttribute("data-mapq");
    var src = "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
    var f = document.createElement("iframe");
    f.setAttribute("loading", "lazy");
    f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    f.src = src;
    btn.replaceWith(f);
  });

  console.log("Baltic Adventure guide v2 rendered ✦");
})();
