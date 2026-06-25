/* Baltic Adventure 2026 — render layer. Reads window.TRIP (data.js) and fills
   the data-driven sections. Pure vanilla JS, no build step, works offline. */
(function () {
  "use strict";
  var T = window.TRIP;
  if (!T) { console.error("TRIP data missing"); return; }

  // -- helpers ----------------------------------------------------------
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c];
    });
  }
  function gmap(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }
  function mapLink(query, label) {
    return '<a href="' + gmap(query) + '" target="_blank" rel="noopener">' + esc(label || "Map") + "</a>";
  }
  function site(url, label) {
    if (!url) return esc(label || "");
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label || url) + "</a>";
  }
  function money(eur, usd) {
    var parts = [];
    if (eur != null) parts.push("€" + Number(eur).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    if (usd != null) parts.push("$" + Number(usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    return parts.join(" / ") || "—";
  }
  function statusBadge(status) {
    var s = (status || "").toLowerCase();
    var cls = "b-ok", txt = status || "—";
    if (/wrong|fix|verify|open/.test(s)) cls = "b-warn";
    if (/critical/.test(s)) cls = "b-crit";
    return '<span class="badge ' + cls + '">' + esc(txt) + "</span>";
  }

  // -- SUMMARY ----------------------------------------------------------
  (function summary() {
    var f = T.flights, h = T.hotels, c = T.car;
    var flightRows = f.map(function (x) {
      return "<li><b>" + esc(x.flight) + "</b> · " + esc(x.from) + " → " + esc(x.to) +
        " · " + esc(x.date_label) + " " + esc(x.depart) + "</li>";
    }).join("");
    var hotelRows = h.map(function (x) {
      return "<li><b>" + esc(x.city) + "</b> — " + site(x.website, x.name) +
        " · " + esc(x.checkin.slice(5)) + "→" + esc(x.checkout.slice(5)) +
        " (" + x.nights + "n) · " + esc(x.cost) + "</li>";
    }).join("");

    el("summary-cards").innerHTML =
      '<div class="card"><h4>✈ Flights</h4><p><small>Air France booking ref <b>' + esc(T.meta.booking_ref) +
        "</b></small></p><ul>" + flightRows + "</ul></div>" +
      '<div class="card"><h4>🏨 Hotels</h4><ul>' + hotelRows + "</ul></div>" +
      '<div class="card"><h4>🚗 Rental car</h4><p>' + site(c.website, c.vendor) + " · booking <b>" + esc(c.booking_number) +
        "</b><br>" + esc(c.vehicle) + "<br>Pickup " + esc(c.pickup.location) + " · " + esc(c.pickup.date.slice(5)) +
        " " + esc(c.pickup.time) + '<br><span class="badge b-crit">Return date must be fixed → Jul 19</span></p></div>' +
      '<div class="card"><h4>🧭 Route</h4><p>' + esc(T.meta.route) + '</p><p><small>' + esc(T.meta.theme) +
        "</small></p></div>";

    // must-fix box (critical open items)
    var crit = T.open_items.filter(function (o) { return o.priority === "critical"; });
    el("summary-mustfix").innerHTML =
      '<div class="alert"><h4>⚠ Must fix before departure</h4><ul>' +
      crit.map(function (o) { return "<li>" + esc(o.text) + "</li>"; }).join("") +
      "</ul></div>";
  })();

  // -- DASHBOARD --------------------------------------------------------
  (function dashboard() {
    var rows = [];
    // flights (single grouped row)
    rows.push(["Flights", "Jul 8–9 / 19", "—", "Air France / Delta / KLM",
      T.meta.booking_ref, "SLC·CDG·HEL · VNO·AMS·SLC", "", "airfrance.com",
      T.ticket.total_cost + " (Michael)", "Confirmed", "Grace's ticket unconfirmed", null]);

    T.hotels.forEach(function (x) {
      rows.push(["Hotel", x.checkin.slice(5) + "→" + x.checkout.slice(5), x.city, x.name,
        x.confirmation, x.address, x.phone, x.website, x.cost, x.status, x.notes,
        x.address + " " + x.city]);
    });

    var c = T.car;
    rows.push(["Rental car", c.pickup.date.slice(5) + "→ (fix to Jul 19)", "Riga→Vilnius", c.vendor,
      c.booking_number, c.pickup.location + " → " + c.dropoff_current.location, "", c.website,
      c.cost_estimate, c.status, "Return date Jul 21 is WRONG", c.pickup.location]);

    var head = ["Category", "Date", "City", "Vendor", "Conf #", "Address", "Phone", "Website", "Cost", "Status", "Notes"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var tbody = rows.map(function (r) {
      var addr = r[5], mapq = r[11];
      var addrCell = mapq ? esc(addr) + "<br>" + mapLink(mapq, "📍 Map") : esc(addr);
      return "<tr>" +
        "<td><b>" + esc(r[0]) + "</b></td>" +
        "<td>" + esc(r[1]) + "</td>" +
        "<td>" + esc(r[2]) + "</td>" +
        "<td>" + site(r[7], r[3]) + "</td>" +
        "<td>" + esc(r[4]) + "</td>" +
        "<td>" + addrCell + "</td>" +
        "<td>" + (r[6] ? '<a href="tel:' + esc(r[6].replace(/\s/g, "")) + '">' + esc(r[6]) + "</a>" : "—") + "</td>" +
        "<td>" + (r[7] ? site(r[7], "site") : "—") + "</td>" +
        "<td>" + esc(r[8]) + "</td>" +
        "<td>" + statusBadge(r[9]) + "</td>" +
        "<td><small>" + esc(r[10]) + "</small></td>" +
        "</tr>";
    }).join("");
    el("dashboard-table").innerHTML = '<div class="table-wrap"><table>' + thead + tbody + "</table></div>";
  })();

  // -- OPEN ITEMS -------------------------------------------------------
  (function openItems() {
    var crit = T.open_items.filter(function (o) { return o.priority === "critical"; });
    el("open-redbox").innerHTML =
      '<div class="alert"><h4>🔴 The three that can break the trip</h4><ul>' +
      crit.map(function (o) { return "<li>" + esc(o.text) + "</li>"; }).join("") +
      "</ul></div>";

    var order = { critical: 0, high: 1, medium: 2, low: 3 };
    var items = T.open_items.slice().sort(function (a, b) { return order[a.priority] - order[b.priority]; });
    el("open-list").innerHTML =
      '<ul class="checklist" id="open-checklist">' +
      items.map(function (o, i) {
        return '<li><input type="checkbox" data-k="open' + i + '">' +
          '<span class="prio ' + o.priority + '">' + o.priority + "</span>" +
          '<span class="txt">' + esc(o.text) + "</span></li>";
      }).join("") + "</ul>";
  })();

  // -- ROUTE CITY CARDS -------------------------------------------------
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
      return '<div class="card tight"><div class="section-eyebrow">' + esc(s[0]) +
        '</div><h4 style="margin:.2rem 0">' + esc(s[1]) + "</h4><p><small>" + esc(s[2]) + "</small></p></div>";
    }).join("");
  })();

  // -- DAY BY DAY -------------------------------------------------------
  (function days() {
    var html = T.days.map(function (d) {
      var slots = "";
      [["Morning", d.morning], ["Afternoon", d.afternoon], ["Evening", d.evening]].forEach(function (s) {
        if (s[1]) slots += '<div class="slot"><h5>' + s[0] + "</h5><p>" + esc(s[1]) + "</p></div>";
      });
      var maps = (d.maps && d.maps.length)
        ? '<div class="maplinks">' + d.maps.map(function (m) { return mapLink(m, m); }).join("") + "</div>"
        : "";
      var reminders = (d.reminders && d.reminders.length)
        ? '<div class="note-line"><b>Reminders:</b> ' + d.reminders.map(esc).join(" · ") + "</div>"
        : "";
      return '<div class="day">' +
        '<div class="day-head">' +
          '<span class="day-n">Day ' + d.n + "</span>" +
          '<span class="day-date">' + esc(d.date_label) + "</span>" +
          '<span class="day-city">' + esc(d.city) + "</span>" +
        "</div>" +
        '<div class="day-body">' +
          '<div class="day-theme">' + esc(d.theme) + "</div>" +
          '<div class="meta-row">' +
            '<span class="meta-pill"><b>Sleep:</b> ' + esc(d.sleep) + "</span>" +
            '<span class="meta-pill"><b>Transport:</b> ' + esc(d.transport) + "</span>" +
          "</div>" +
          '<div class="slots">' + slots + "</div>" +
          (d.reservation ? '<div class="note-line"><b>Reservation:</b> ' + esc(d.reservation) + "</div>" : "") +
          (d.stumble ? '<div class="stumble"><h5>✦ Stumble zone</h5><p>' + esc(d.stumble) + "</p></div>" : "") +
          (d.food ? '<div class="note-line"><b>Food &amp; café:</b> ' + esc(d.food) + "</div>" : "") +
          (d.backup ? '<div class="note-line"><b>Backup / rain:</b> ' + esc(d.backup) + "</div>" : "") +
          (d.dont_overplan ? '<div class="dont">🌿 Do not over-plan this day.</div>' : "") +
          reminders +
          maps +
        "</div></div>";
    }).join("");
    el("days").innerHTML = html;
  })();

  // -- HOTELS -----------------------------------------------------------
  (function hotels() {
    var html = T.hotels.map(function (h) {
      var rows = [
        ["Dates", h.checkin + " → " + h.checkout + " (" + h.nights + " night" + (h.nights > 1 ? "s" : "") + ")"],
        ["Room / rate", [h.room, h.rate].filter(Boolean).join(" · ") || "—"],
        ["Confirmation", h.confirmation + (h.extra_ref ? " · " + h.extra_ref : "")],
        ["Cost", h.cost],
        ["Address", esc(h.address) + " &nbsp; " + mapLink(h.address + " " + h.city, "📍 Map")],
        ["Phone", h.phone ? '<a href="tel:' + h.phone.replace(/\s/g, "") + '">' + esc(h.phone) + "</a>" : "—"],
        ["Email", h.email ? '<a href="mailto:' + esc(h.email) + '">' + esc(h.email) + "</a>" : "—"]
      ];
      var kv = rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"; }).join("");
      return '<div class="hotel">' +
        '<div class="hotel-head"><div class="hotel-city">' + esc(h.city) + " · " + esc(h.purpose) + "</div>" +
          "<h3>" + site(h.website, h.name) + "</h3>" + statusBadge(h.status) + "</div>" +
        '<div class="hotel-body">' +
          '<div class="why">' + esc(h.why) + "</div>" +
          '<dl class="kv">' + kv + "</dl>" +
          '<div class="note-line"><b>Nearby coffee/breakfast:</b> ' + esc(h.nearby_coffee) + "</div>" +
          '<div class="note-line"><b>Stumble streets:</b> ' + esc(h.nearby_stumble) + "</div>" +
          '<div class="note-line"><b>Pharmacy / grocery / ATM:</b> ' + esc(h.essentials) + "</div>" +
          (h.notes ? '<div class="note-line"><b>Note:</b> ' + esc(h.notes) + "</div>" : "") +
        "</div></div>";
    }).join("");
    el("hotel-cards").innerHTML = html;
  })();

  // -- FLIGHTS TABLE ----------------------------------------------------
  (function flightsTable() {
    var head = ["Leg", "Date", "Flight", "Route", "Time", "Seat", "Bag", "Status"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var body = T.flights.map(function (x) {
      return "<tr><td><b>" + esc(x.leg) + "</b></td><td>" + esc(x.date_label) + "</td>" +
        "<td>" + esc(x.flight) + "<br><small>op. " + esc(x.operated_by) + "</small></td>" +
        "<td>" + esc(x.from) + " → " + esc(x.to) + "</td>" +
        "<td>" + esc(x.depart) + " → " + esc(x.arrive) + "</td>" +
        "<td>" + esc(x.seat || "—") + "</td>" +
        "<td>" + esc(x.baggage) + "</td>" +
        "<td>" + statusBadge(x.status) + "</td></tr>";
    }).join("");
    el("flights-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + "</table></div>" +
      '<p><small><b>Ticket:</b> ' + esc(T.ticket.passenger_on_ticket) + " · #" + esc(T.ticket.ticket_number) +
      " · " + esc(T.ticket.total_cost) + ". <b>Open:</b> " + esc(T.ticket.open_item) + "</small></p>";
  })();

  // -- TRANSPORT LEGS ---------------------------------------------------
  (function transportTable() {
    var head = ["Leg", "Date", "Mode", "Book with", "Target time", "Notes"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var body = T.transport.map(function (x) {
      return "<tr><td><b>" + esc(x.leg) + "</b></td><td>" + esc(x.date.slice(5)) + "</td>" +
        "<td>" + esc(x.mode) + "</td>" +
        "<td>" + (x.website ? site(x.website, x.vendor) : esc(x.vendor)) + "</td>" +
        "<td>" + esc(x.target) + "</td>" +
        "<td><small>" + esc(x.notes) + "</small></td></tr>";
    }).join("");
    el("transport-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + "</table></div>";
  })();

  // -- CAR CARD ---------------------------------------------------------
  (function carCard() {
    var c = T.car;
    el("car-card").innerHTML =
      '<div class="alert"><h4>🚗 Rental car — ' + site(c.website, c.vendor) + " · booking " + esc(c.booking_number) + "</h4>" +
      "<p>" + esc(c.vehicle) + " · " + esc(c.transmission) + " · " + c.seats + " seats · " + c.luggage + " bags · A/C. Driver: " + esc(c.driver) + ".</p>" +
      "<p><b>Pickup:</b> " + esc(c.pickup.location) + " · " + esc(c.pickup.date) + " " + esc(c.pickup.time) + "<br>" +
      "<b>Drop-off (booked):</b> " + esc(c.dropoff_current.location) + " · " + esc(c.dropoff_current.date) + " " + esc(c.dropoff_current.time) +
      ' &nbsp;<span class="badge b-crit">WRONG</span><br>' +
      "<b>Drop-off (should be):</b> " + esc(c.dropoff_should_be) + "</p>" +
      "<p><b>Verify before travel:</b></p><ul>" +
      c.open_items.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") +
      "</ul><p><small><b>Cost:</b> " + esc(c.cost_estimate) + "</small></p></div>";
  })();

  // -- FOOD (searchable) ------------------------------------------------
  (function food() {
    var cities = ["All"].concat(T.places.map(function (p) { return p.city; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var chipsEl = el("food-chips");
    chipsEl.innerHTML = cities.map(function (cty, i) {
      return '<span class="chip' + (i === 0 ? " active" : "") + '" data-city="' + esc(cty) + '">' + esc(cty) + "</span>";
    }).join("");
    var searchEl = el("food-search");
    var tableEl = el("food-table");
    var activeCity = "All";

    function tagBadge(t) {
      if (t === "hotel") return '<span class="badge b-hotel">In hotel</span>';
      if (t === "rec") return '<span class="badge b-rec">Recommendation</span>';
      return "";
    }
    function render() {
      var q = (searchEl.value || "").toLowerCase().trim();
      var rows = T.places.filter(function (p) {
        if (activeCity !== "All" && p.city !== activeCity) return false;
        if (!q) return true;
        return (p.name + " " + p.type + " " + p.why + " " + p.city + " " + p.notes).toLowerCase().indexOf(q) >= 0;
      });
      var head = ["Place", "City", "Type", "Why it fits", "Reserve?", "Map"];
      var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
      var body = rows.map(function (p) {
        var name = p.website ? site(p.website, p.name) : esc(p.name);
        return "<tr><td><b>" + name + "</b> " + tagBadge(p.tag) + "</td>" +
          "<td>" + esc(p.city) + "</td>" +
          "<td>" + esc(p.type) + "</td>" +
          "<td>" + esc(p.why) + (p.notes ? ' <small style="color:#5c5448">(' + esc(p.notes) + ")</small>" : "") + "</td>" +
          "<td>" + esc(p.reserve) + "</td>" +
          "<td>" + mapLink(p.name + " " + p.city, "📍") + "</td></tr>";
      }).join("");
      tableEl.innerHTML = '<p class="muted-count no-print">' + rows.length + " place" + (rows.length === 1 ? "" : "s") + " shown</p>" +
        '<div class="table-wrap"><table>' + thead + (body || '<tr><td colspan="6">No matches.</td></tr>') + "</table></div>";
    }
    chipsEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      activeCity = chip.getAttribute("data-city");
      Array.prototype.forEach.call(chipsEl.children, function (c) { c.classList.toggle("active", c === chip); });
      render();
    });
    searchEl.addEventListener("input", render);
    render();
  })();

  // -- CASTLES ----------------------------------------------------------
  (function castles() {
    el("castle-cards").innerHTML = T.castles.map(function (c) {
      var recCls = /^KEEP/.test(c.rec) ? "b-ok" : (/^OPTIONAL/.test(c.rec) ? "b-warn" : "b-info");
      return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem">' +
        "<h3 style=\"margin:.1rem 0\">" + esc(c.name) + "</h3>" +
        '<span class="badge ' + recCls + '">' + esc(c.rec) + "</span></div>" +
        '<p><small>' + esc(c.region) + "</small></p>" +
        '<div class="why">' + esc(c.why) + "</div>" +
        '<div class="note-line"><b>Drive:</b> ' + esc(c.drive) + " · <b>Parking:</b> " + esc(c.parking) + "</div>" +
        '<div class="note-line"><b>Best timing:</b> ' + esc(c.timing) + " · <b>Stay:</b> " + esc(c.duration) + "</div>" +
        '<div class="note-line"><b>Photo:</b> ' + esc(c.photo) + "</div>" +
        '<div class="maplinks">' + mapLink(c.name, "Open in Maps") + "</div>" +
        "</div>";
    }).join("");
  })();

  // -- BUDGET -----------------------------------------------------------
  (function budget() {
    var head = ["Item", "Amount", "Status", "Note"];
    var thead = "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var eurSum = 0, usdSum = 0;
    var body = T.budget.map(function (b) {
      if (b.amount_eur != null) eurSum += b.amount_eur;
      if (b.amount_usd != null) usdSum += b.amount_usd;
      return "<tr><td><b>" + esc(b.item) + "</b></td>" +
        "<td>" + money(b.amount_eur, b.amount_usd) + "</td>" +
        "<td>" + statusBadge(b.status) + "</td>" +
        "<td><small>" + esc(b.note) + "</small></td></tr>";
    }).join("");
    var foot = "<tr><td><b>Subtotal (confirmed hotels + known)</b></td><td><b>" +
      money(eurSum, usdSum) + "</b></td><td colspan='2'><small>Hotels total ≈ €" +
      (T.hotels.reduce(function (s, h) { var m = (h.cost.match(/[\d,]+\.\d\d/) || [])[0]; return s + (m ? parseFloat(m.replace(/,/g, "")) : 0); }, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 }) +
      ". USD/EUR not summed across currencies.</small></td></tr>";
    el("budget-table").innerHTML = '<div class="table-wrap"><table>' + thead + body + foot + "</table></div>";

    el("budget-unknowns").innerHTML =
      '<div class="alert amber"><h4>Unknowns remaining</h4><ul>' +
      T.budget_unknowns.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") +
      "</ul></div>";
  })();

  // -- BEFORE-DEPARTURE checklist (from open items) ---------------------
  (function beforeList() {
    var ul = document.querySelector('.checklist[data-auto="before"]');
    if (!ul) return;
    ul.innerHTML = T.open_items.map(function (o, i) {
      return '<li><input type="checkbox" data-k="bd' + i + '"><span class="txt">' + esc(o.text) + "</span></li>";
    }).join("");
  })();

  // -- checkbox behavior: strike-through + persist locally --------------
  (function checkboxes() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("baltic2026.checks") || "{}"); } catch (e) {}
    function persist() { try { localStorage.setItem("baltic2026.checks", JSON.stringify(saved)); } catch (e) {} }
    Array.prototype.forEach.call(document.querySelectorAll(".checklist input[type=checkbox]"), function (box) {
      var k = box.getAttribute("data-k");
      if (k && saved[k]) { box.checked = true; box.closest("li").classList.add("done"); }
      box.addEventListener("change", function () {
        box.closest("li").classList.toggle("done", box.checked);
        if (k) { saved[k] = box.checked; persist(); }
      });
    });
  })();

  console.log("Baltic Adventure guide rendered ✦");
})();
