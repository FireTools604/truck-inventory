/* Truck Inventory Check – AFD. Proof of concept.
   Plain JavaScript, no libraries. Spec: docs/SPEC.md */
(function(){
  "use strict";

  // Bump on every change to app code, together with the ?v= on both tags in index.html,
  // so the tablet loads the new files instead of cached ones.
  var APP_VERSION = "2026-11-18b";

  // ?data=full loads the full-size test data (8 cabinets). Default is the short set for quick runs.
  var DATA_URL = /[?&]data=full(&|$)/.test(location.search) ? "data/trucks-full.json" : "data/trucks.json";
  var KEY_ACTIVE = "afd-truck-check-active";   // check in progress
  var KEY_LOG = "afd-truck-check-log";         // completed checks
  var CSV_COLS = ["check_id","date","apparatus","name","ff_number","cabinet","item","expected_qty","found","status","failed_subchecks","note"];
  var LEVELS = [25, 50, 75, 100];

  var app = document.getElementById("app");
  var master = null;           // contents of data/trucks.json
  var active = null;           // check in progress
  var log = [];                // completed checks, oldest first
  var view = { screen: "start", cab: null };
  var startSel = null;         // apparatus picked on the start screen
  var clockTimer = null;
  var openSubs = {};           // "cabinet|item" -> true when a finished sub-check list has been reopened (screen only, not saved)

  // ---------- storage ----------
  function load(key, fallback){
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  }
  function store(key, val){
    try {
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch(e){
      document.getElementById("storageWarn").hidden = false;
      return false;
    }
  }
  function saveActive(){ return store(KEY_ACTIVE, active); }
  function saveLog(){ return store(KEY_LOG, log); }

  // ---------- helpers ----------
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c];
    });
  }
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function ymd(d, sep){ sep = sep == null ? "-" : sep; return d.getFullYear() + sep + pad(d.getMonth()+1) + sep + pad(d.getDate()); }
  function hm(d, sep){ sep = sep == null ? ":" : sep; return pad(d.getHours()) + sep + pad(d.getMinutes()); }
  function fmtWhen(iso){
    var d = new Date(iso);
    return d.toLocaleDateString("en-CA", { weekday:"short", day:"numeric", month:"short", year:"numeric" }) + ", " + hm(d);
  }
  function plural(n, one, many){ return n + " " + (n === 1 ? one : (many || one + "s")); }

  var toastEl = document.getElementById("toast"), toastT;
  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function(){ toastEl.classList.remove("show"); }, 2400);
  }

  // Two-tap confirm for anything destructive. Returns true on the second tap.
  function armed(btn){
    if (btn.dataset.armed === "1") return true;
    var label = btn.textContent;
    btn.dataset.armed = "1";
    btn.classList.add("armed");
    btn.textContent = btn.dataset.confirm || "Tap again to confirm";
    setTimeout(function(){
      if (!btn.isConnected) return;
      btn.dataset.armed = "";
      btn.classList.remove("armed");
      btn.textContent = label;
    }, 3000);
    return false;
  }

  // ---------- check model ----------
  function cabinets(){ return active ? active.apparatus.cabinets : []; }
  function cabById(id){
    var list = cabinets();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function result(check, cabId){
    if (!check.results[cabId]) check.results[cabId] = { openedAt: null, completedAt: null, items: {}, extras: [] };
    return check.results[cabId];
  }
  // Item types: "count" (crew counts them, Low below min), "level" (25/50/75/100 %, Low at or below restockAt),
  // "plain" (Present/Missing). "legacy" = consumable:true from checks saved before phase 3 (Present/Missing/Low).
  function kind(it){
    if (it.type === "count" || it.type === "level") return it.type;
    return it.consumable ? "legacy" : "plain";
  }
  function countStatus(it, n){ return n <= 0 ? "Missing" : (it.min != null && n < it.min ? "Low" : "Present"); }
  function levelStatus(it, pct){ return it.restockAt != null && pct <= it.restockAt ? "Low" : "Present"; }
  function foundText(it, r){
    if (!r || r.found == null || r.found === "") return "";
    return kind(it) === "level" ? r.found + "%" : String(r.found);
  }
  function lowText(it, r){
    var k = kind(it);
    if (k === "count") return "Found " + r.found + ", min " + it.min + " (full " + it.qty + ")";
    if (k === "level") return r.found + "%, restock at " + it.restockAt + "%";
    return "Low (expected " + it.qty + ")";
  }
  function needsSubs(r){ return r && (r.status === "Present" || r.status === "Low"); }
  function itemDone(item, r){
    if (!r || !r.status) return false;
    if (!needsSubs(r)) return true;
    for (var i = 0; i < item.subchecks.length; i++){
      if (!r.sub || !r.sub[item.subchecks[i].id]) return false;
    }
    return true;
  }
  function progress(check, cab){
    var res = check.results[cab.id], done = 0;
    cab.items.forEach(function(it){ if (res && itemDone(it, res.items[it.id])) done++; });
    return { done: done, total: cab.items.length };
  }
  function cabState(check, cab){
    var res = check.results[cab.id];
    if (res && res.completedAt) return "done";
    if (res && (res.openedAt || Object.keys(res.items).length || res.extras.length)) return "progress";
    return "new";
  }
  function failedSubs(item, r){
    if (!needsSubs(r) || !r.sub) return [];
    return item.subchecks.filter(function(s){ return r.sub[s.id] === "fail"; }).map(function(s){ return s.label; });
  }

  // Summary lists for a check (active or from the log).
  function summarize(check){
    var out = { notChecked: [], outstanding: [], extra: [], low: [] };
    check.apparatus.cabinets.forEach(function(cab){
      var res = check.results[cab.id] || { items: {}, extras: [] };
      var state = cabState(check, cab);
      if (state !== "done"){
        var p = progress(check, cab);
        out.notChecked.push({ cab: cab, text: state === "new" ? "Not started" : "In progress, " + p.done + " of " + p.total + " items" });
      }
      var o = [], l = [];
      cab.items.forEach(function(it){
        var r = res.items[it.id];
        if (!r || !r.status) return;
        if (r.status === "Missing") o.push({ name: it.name, what: "Missing (expected " + it.qty + ")", note: r.note });
        var f = failedSubs(it, r);
        if (f.length) o.push({ name: it.name, what: "Failed: " + f.join(", "), note: r.note });
        if (r.status === "Low") l.push({ name: it.name, what: lowText(it, r), note: r.note });
      });
      var x = res.extras.map(function(e){ return { name: e.desc, what: "Qty " + e.qty, note: e.note }; });
      if (o.length) out.outstanding.push({ cab: cab, rows: o });
      if (l.length) out.low.push({ cab: cab, rows: l });
      if (x.length) out.extra.push({ cab: cab, rows: x });
    });
    return out;
  }
  function count(groups){ return groups.reduce(function(n, g){ return n + g.rows.length; }, 0); }

  // ---------- navigation ----------
  function go(screen, cab, replace){
    view = { screen: screen, cab: cab || null };
    try { history[replace ? "replaceState" : "pushState"](view, ""); } catch(e){}
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener("popstate", function(e){
    view = e.state && e.state.screen ? e.state : { screen: "start", cab: null };
    render();
  });

  function render(){
    clearInterval(clockTimer);
    if (!active && /^(scanner|cabinet|summary)$/.test(view.screen)) view = { screen: "start", cab: null };
    if (view.screen === "cabinet" && !cabById(view.cab)) view = { screen: "scanner", cab: null };
    ({ start: renderStart, scanner: renderScanner, cabinet: renderCabinet, summary: renderSummary, log: renderLog }[view.screen] || renderStart)();
  }

  function bar(title, sub, left, right){
    return '<header class="bar">' + (left || "") +
      '<div class="bar-title">' + title + (sub ? "<small>" + sub + "</small>" : "") + "</div>" +
      (right ? '<div class="bar-right">' + right + "</div>" : "") + "</header>";
  }
  function checkSub(){ return esc(active.name) + " · FF# " + esc(active.ff) + " · started " + hm(new Date(active.startedAt)); }

  // ---------- Start ----------
  function renderStart(){
    var h = '<div class="page">' + bar("Truck Inventory Check", "Agassiz Fire Department") + '<div class="body">';

    if (active){
      var done = cabinets().filter(function(c){ return cabState(active, c) === "done"; }).length;
      h += '<section class="panel resume"><h2>Check in progress</h2>' +
        "<p><b>" + esc(active.apparatus.id) + "</b> – " + esc(active.name) + " (FF# " + esc(active.ff) + ")<br>" +
        "Started " + esc(fmtWhen(active.startedAt)) + ". " + done + " of " + cabinets().length + " cabinets done.</p>" +
        '<div class="btn-row"><button class="primary" data-act="resume">Resume check</button>' +
        '<button class="danger" data-act="discard" data-confirm="Tap again to discard">Discard check</button></div></section>';
    } else {
      h += '<section class="panel"><h2>Apparatus</h2><div class="app-grid">';
      master.apparatus.forEach(function(a){
        var ready = a.cabinets && a.cabinets.length;
        h += '<button class="app-btn' + (startSel === a.id ? " sel" : "") + '" data-act="pick-app" data-id="' + esc(a.id) + '"' + (ready ? "" : " disabled") + ">" +
          esc(a.id) + "<small>" + (ready ? plural(a.cabinets.length, "cabinet") : "No list yet") + "</small></button>";
      });
      h += "</div></section>" +
        '<section class="panel"><h2>Crew member</h2>' +
        '<div class="row2"><div class="field"><label for="fName">Name</label><input id="fName" autocomplete="off" autocapitalize="words"></div>' +
        '<div class="field"><label for="fFF">FF#</label><input id="fFF" autocomplete="off" inputmode="numeric"></div></div>' +
        '<div class="when" id="when"></div></section>' +
        '<button class="primary wide" id="startBtn" data-act="start" disabled>Start check</button>';
    }

    h += '<button class="wide" data-act="to-log">Check log (' + log.length + ")</button>";
    if (master.note) h += '<p class="hint">' + esc(master.note) + "</p>";
    h += '<p class="hint">App version ' + esc(APP_VERSION) + (master.version ? " · data " + esc(master.version) : "") + "</p>";
    h += "</div></div>";
    app.innerHTML = h;

    if (!active){
      var when = document.getElementById("when");
      var tick = function(){ when.textContent = "Date and time: " + fmtWhen(new Date().toISOString()); };
      tick(); clockTimer = setInterval(tick, 15000);
      updateStartBtn();
    }
  }
  function updateStartBtn(){
    var b = document.getElementById("startBtn");
    if (!b) return;
    var n = document.getElementById("fName").value.trim(), f = document.getElementById("fFF").value.trim();
    b.disabled = !(startSel && n && f);
  }
  function startCheck(){
    var name = document.getElementById("fName").value.trim();
    var ff = document.getElementById("fFF").value.trim();
    var a = null;
    master.apparatus.forEach(function(x){ if (x.id === startSel) a = x; });
    if (!a || !name || !ff) return;
    var now = new Date();
    var id = a.id + "-" + ymd(now, "") + "-" + hm(now, "");
    var taken = log.some(function(c){ return c.id === id; });
    if (taken) id += "-" + pad(now.getSeconds());
    active = {
      id: id,
      apparatus: JSON.parse(JSON.stringify(a)),   // snapshot so a master list change mid-check can't break it
      masterVersion: master.version || "",
      name: name, ff: ff,
      startedAt: now.toISOString(), completedAt: null,
      results: {}
    };
    startSel = null;
    saveActive();
    go("scanner", null, true);
  }

  // ---------- Scanner (cabinet list) ----------
  function renderScanner(){
    var list = cabinets();
    var done = list.filter(function(c){ return cabState(active, c) === "done"; }).length;
    var h = '<div class="page">' +
      bar(esc(active.apparatus.id) + " check", checkSub(), '<button class="bar-btn" data-act="to-start">Menu</button>', done + " / " + list.length + " done") +
      '<div class="body">' +
      '<div class="prompt"><div>Pick a cabinet<small>Tap a cabinet to check it. Scanning cabinet labels comes in phase 4.</small></div></div>' +
      '<div class="cab-list">';
    list.forEach(function(c){
      var st = cabState(active, c), p = progress(active, c);
      var pill = st === "done" ? "Done" : st === "progress" ? "In progress" : "Not started";
      h += '<button class="cab-row st-' + st + '" data-act="open-cab" data-id="' + esc(c.id) + '">' +
        '<span class="code">' + esc(c.code) + '</span><span class="nm">' + esc(c.name) +
        "<small>" + p.done + " of " + plural(p.total, "item") + " checked</small></span>" +
        '<span class="pill">' + pill + "</span></button>";
    });
    h += "</div>" +
      '<button class="wide danger" data-act="discard" data-confirm="Tap again to discard this check">Discard check</button>' +
      "</div>" +
      '<div class="foot"><button class="primary" data-act="review">Finish and review</button></div></div>';
    app.innerHTML = h;
  }

  function openCab(id){
    var res = result(active, id);
    if (!res.openedAt){ res.openedAt = new Date().toISOString(); saveActive(); }
    go("cabinet", id);
  }

  // ---------- Cabinet ----------
  function renderCabinet(){
    var cab = cabById(view.cab), res = result(active, cab.id);
    var photos = cab.photos || [];
    var h = '<div class="cab-screen">' +
      bar("<b>" + esc(cab.code) + "</b> · " + esc(cab.name), esc(active.apparatus.id) + " · " + esc(cab.id),
        '<button class="bar-btn" data-act="cab-back">‹ Cabinets</button>', '<span id="cabProg"></span>') +
      '<section class="photos"><div class="strip" id="strip">';
    if (!photos.length) h += '<figure><span class="missing">No photos for this cabinet yet</span></figure>';
    photos.forEach(function(p, i){
      h += '<figure><img src="' + esc(p.src) + '" alt="' + esc(cab.code + " " + (p.caption || "")) + '" draggable="false">' +
        "<figcaption>" + esc(p.caption || "Photo") + " · " + (i + 1) + "/" + photos.length + "</figcaption></figure>";
    });
    h += '</div><div class="dots" id="dots">' + (photos.length > 1 ? photos.map(function(_, i){ return '<span class="' + (i ? "" : "on") + '"></span>'; }).join("") : "") + "</div></section>" +
      '<section class="list" id="list">';
    cab.items.forEach(function(it, i){ h += itemCard(it, i, res.items[it.id]); });
    h += "</section>" +
      '<div class="foot"><button class="primary" id="cabDone" data-act="cab-complete">Cabinet complete</button></div></div>';
    app.innerHTML = h;

    var strip = document.getElementById("strip"), dots = document.getElementById("dots").children;
    strip.addEventListener("scroll", function(){
      var i = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
      for (var k = 0; k < dots.length; k++) dots[k].className = k === i ? "on" : "";
    }, { passive: true });
    Array.prototype.forEach.call(strip.querySelectorAll("img"), function(img){
      img.addEventListener("error", function(){
        var s = document.createElement("span"); s.className = "missing"; s.textContent = "Photo not found";
        img.replaceWith(s);
      });
    });
    updateCabFooter();
  }

  function noteBtn(r){ return '<button class="note-btn' + (r.note ? " has" : "") + '" data-act="note">Note</button>'; }

  function qtyText(it){
    var k = kind(it);
    if (k === "count") return "Full " + esc(it.qty) + " · min " + esc(it.min);
    if (k === "level") return (it.qty > 1 ? "Qty " + esc(it.qty) + " · " : "") + "Restock at " + esc(it.restockAt) + "%";
    return "Qty " + esc(it.qty);
  }

  // Warning line under a count or level item. Empty unless Low or Missing.
  function stockLine(it, r){
    var t = "";
    if (r && r.status === "Missing") t = kind(it) === "count" ? "None found – missing" : "Missing";
    else if (r && r.status === "Low") t = kind(it) === "count" ? "Below minimum of " + it.min + " – restock" : "At or below " + it.restockAt + "% – restock";
    return '<div class="stock' + (t ? " st-" + r.status : "") + '">' + esc(t) + "</div>";
  }

  function itemCard(it, i, r){
    r = r || {};
    var k = kind(it);
    var h = '<div class="item' + (itemDone(it, r) ? "" : " todo") + '" id="it-' + i + '" data-i="' + i + '">' +
      '<div class="item-head"><div class="item-name">' + esc(it.name) + "</div>" +
      '<div class="item-qty">' + qtyText(it) + "</div></div>";

    if (k === "count"){
      h += '<div class="count-row">' +
        '<button class="step" data-act="count-step" data-d="-1" aria-label="One less">−</button>' +
        '<input class="count-in' + (r.status ? " st-" + r.status : "") + '" type="number" inputmode="numeric" min="0" max="999" data-count' +
        ' value="' + (r.found != null ? esc(r.found) : "") + '" placeholder="Count" aria-label="Count found">' +
        '<button class="step" data-act="count-step" data-d="1" aria-label="One more">+</button>' +
        '<button class="full-btn' + (r.found === it.qty ? " on" : "") + '" data-act="count-full">All ' + esc(it.qty) + "</button>" +
        noteBtn(r) + "</div>" + stockLine(it, r);
    } else if (k === "level"){
      h += '<div class="seg level">';
      LEVELS.forEach(function(p){
        var on = r.status && r.status !== "Missing" && r.found === p;
        h += '<button data-act="level" data-v="' + p + '"' + (on ? ' class="on-' + r.status + '"' : "") + ">" + p + "%</button>";
      });
      h += '<button data-act="level" data-v="Missing"' + (r.status === "Missing" ? ' class="on-Missing"' : "") + ">Missing</button>" +
        noteBtn(r) + "</div>" + stockLine(it, r);
    } else {
      var opts = ["Present", "Missing"].concat(k === "legacy" ? ["Low"] : []);
      h += '<div class="seg">';
      opts.forEach(function(o){
        h += '<button data-act="status" data-v="' + o + '"' + (r.status === o ? ' class="on-' + o + '"' : "") + ">" + o + "</button>";
      });
      h += noteBtn(r) + "</div>";
    }

    h += subsHtml(it, r);
    if (r.note || r.noteOpen) h += '<textarea class="note" data-note rows="2" maxlength="200" placeholder="Note">' + esc(r.note || "") + "</textarea>";
    return h + "</div>";
  }

  // Sub-checks collapse to one line once all are marked. Show/Hide reopens them.
  function subsHtml(it, r){
    if (!needsSubs(r) || !it.subchecks.length) return "";
    var n = it.subchecks.length, all = true;
    it.subchecks.forEach(function(s){ if (!r.sub || !r.sub[s.id]) all = false; });
    if (all && !openSubs[view.cab + "|" + it.id]){
      var f = failedSubs(it, r);
      var txt = f.length ? f.length + " of " + plural(n, "sub-check") + " failed: " + f.join(", ")
        : (n === 1 ? "Sub-check passed" : "All " + n + " sub-checks passed");
      return '<div class="subs-done' + (f.length ? " has-fail" : "") + '"><span>' + esc(txt) + "</span>" +
        '<button data-act="subs-toggle">Show</button></div>';
    }
    var h = '<div class="subs">';
    it.subchecks.forEach(function(s){
      var v = r.sub && r.sub[s.id];
      h += '<div class="sub' + (v ? "" : " todo") + '"><span>' + esc(s.label) + '</span><div class="seg">' +
        '<button data-act="sub" data-sub="' + esc(s.id) + '" data-v="pass"' + (v === "pass" ? ' class="on-pass"' : "") + ">Pass</button>" +
        '<button data-act="sub" data-sub="' + esc(s.id) + '" data-v="fail"' + (v === "fail" ? ' class="on-fail"' : "") + ">Fail</button>" +
        "</div></div>";
    });
    if (all) h += '<button class="link subs-hide" data-act="subs-toggle">Hide sub-checks</button>';
    return h + "</div>";
  }

  // Set a count. Status follows the count: 0 is Missing, below min is Low.
  function setCount(x, n){
    if (n == null || isNaN(n)){ x.r.found = null; x.r.status = ""; return; }
    n = Math.max(0, Math.min(999, Math.floor(n)));
    x.r.found = n;
    x.r.status = countStatus(x.it, n);
  }

  // Update a count card in place while typing, so the keyboard stays open.
  function lightUpdate(x){
    var card = document.getElementById("it-" + x.i);
    card.classList.toggle("todo", !itemDone(x.it, x.r));
    var inp = card.querySelector(".count-in");
    inp.className = "count-in" + (x.r.status ? " st-" + x.r.status : "");
    card.querySelector(".full-btn").classList.toggle("on", x.r.found === x.it.qty);
    card.querySelector(".stock").outerHTML = stockLine(x.it, x.r);
  }

  function currentCab(){ return cabById(view.cab); }

  function refreshCard(i){
    var cab = currentCab(), it = cab.items[i];
    var el = document.getElementById("it-" + i);
    var tmp = document.createElement("div");
    tmp.innerHTML = itemCard(it, i, result(active, cab.id).items[it.id]);
    el.replaceWith(tmp.firstChild);
  }

  function updateCabFooter(){
    var cab = currentCab(), p = progress(active, cab), res = result(active, cab.id);
    // A finished cabinet that loses a status (e.g. Missing changed to Present with sub-checks open) goes back to in progress.
    if (res.completedAt && p.done < p.total){ res.completedAt = null; saveActive(); }
    document.getElementById("cabProg").textContent = p.done + " / " + p.total;
    var b = document.getElementById("cabDone"), left = p.total - p.done;
    b.classList.toggle("disabled", left > 0);
    b.textContent = left > 0 ? "Cabinet complete (" + left + " left)" : (res.completedAt ? "Done – back to cabinets" : "Cabinet complete");
  }

  function itemResult(btn){
    var card = btn.closest(".item"), i = +card.dataset.i, cab = currentCab(), it = cab.items[i];
    var res = result(active, cab.id);
    if (!res.items[it.id]) res.items[it.id] = { status: "", sub: {}, note: "" };
    return { i: i, it: it, r: res.items[it.id] };
  }

  function completeCab(){
    var cab = currentCab(), p = progress(active, cab), res = result(active, cab.id);
    if (p.done < p.total){
      var first = document.querySelector(".item.todo");
      if (first){
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        first.classList.remove("flash"); void first.offsetWidth; first.classList.add("flash");
      }
      toast(plural(p.total - p.done, "item") + " still need a status");
      return;
    }
    if (!res.completedAt) res.completedAt = new Date().toISOString();
    saveActive();
    toast(cab.code + " done");
    go("scanner", null);
  }

  // ---------- Truck summary ----------
  function sumSection(cls, title, groups, emptyText){
    var n = count(groups);
    var h = '<section class="panel sum ' + cls + '"><h2>' + title + '<span class="n">' + n + "</span></h2>";
    if (!n) return h + '<div class="none">' + emptyText + "</div></section>";
    groups.forEach(function(g){
      h += '<div class="sum-group"><h3>' + esc(g.cab.code) + " · " + esc(g.cab.name) + "</h3>";
      g.rows.forEach(function(r){
        h += '<div class="sum-line"><span>' + esc(r.name) + (r.note ? "<small>" + esc(r.note) + "</small>" : "") + '</span><span class="what">' + esc(r.what) + "</span></div>";
      });
      h += "</div>";
    });
    return h + "</section>";
  }

  function renderSummary(){
    var s = summarize(active);
    var h = '<div class="page">' +
      bar(esc(active.apparatus.id) + " check – review", checkSub(), '<button class="bar-btn" data-act="to-scanner">‹ Cabinets</button>') +
      '<div class="body">';
    if (s.notChecked.length){
      h += '<section class="panel sum nc"><h2>Not checked<span class="n">' + s.notChecked.length + "</span></h2>";
      s.notChecked.forEach(function(n){
        h += '<div class="sum-line"><span><b>' + esc(n.cab.code) + "</b> · " + esc(n.cab.name) + '</span><span class="what">' + esc(n.text) + "</span></div>";
      });
      h += "</section>";
    }
    // Extra items are off for now. The section only shows for older checks that recorded some.
    h += sumSection("out", "Outstanding", s.outstanding, "No missing items or failed sub-checks.") +
      (count(s.extra) ? sumSection("ext", "Extra", s.extra, "") : "") +
      sumSection("low", "Low stock", s.low, "Nothing below its restock point.") +
      "</div>" +
      '<div class="foot"><button data-act="to-scanner">Back to cabinets</button>' +
      '<button class="primary" data-act="complete-check" data-confirm="' +
      (s.notChecked.length ? "Tap again – " + plural(s.notChecked.length, "cabinet") + " not checked" : "Tap again to save") +
      '">Complete check</button></div></div>';
    app.innerHTML = h;
  }

  function completeCheck(){
    active.completedAt = new Date().toISOString();
    log.push(active);
    if (!saveLog()){ log.pop(); active.completedAt = null; toast("Couldn't save the check. Storage full or blocked."); return; }
    active = null;
    store(KEY_ACTIVE, null);
    go("log", null, true);
    toast("Check saved. Export the CSV.");
  }

  // ---------- Log ----------
  function renderLog(){
    var h = '<div class="page">' + bar("Check log", "Stored on this tablet only", '<button class="bar-btn" data-act="to-start">‹ Start</button>', plural(log.length, "check")) +
      '<div class="body"><section class="panel"><h2>Completed checks</h2>';
    if (!log.length) h += '<div class="none">No completed checks on this tablet.</div>';
    log.slice().reverse().forEach(function(c){
      var s = summarize(c), o = count(s.outstanding), x = count(s.extra), l = count(s.low);
      h += '<div class="log-item"><div class="top"><span>' + esc(c.apparatus.id) + "</span><span>" + esc(fmtWhen(c.completedAt)) + "</span></div>" +
        '<div class="who">' + esc(c.name) + " · FF# " + esc(c.ff) + " · " + esc(c.id) + "</div>" +
        '<div class="chips">' +
        (s.notChecked.length ? '<span class="chip amber">' + plural(s.notChecked.length, "cabinet") + " not checked</span>" : "") +
        '<span class="chip' + (o ? " red" : "") + '">' + o + " outstanding</span>" +
        (x ? '<span class="chip blue">' + x + " extra</span>" : "") +
        '<span class="chip' + (l ? " amber" : "") + '">' + l + " low</span></div></div>";
    });
    h += "</section>" +
      '<button class="primary wide" data-act="export"' + (log.length ? "" : " disabled") + ">Export CSV</button>" +
      '<p class="hint">Downloads every check on this tablet as one file to the Downloads folder. Clearing Chrome\'s site data wipes this log.</p>' +
      "</div></div>";
    app.innerHTML = h;
  }

  function csvCell(v){
    v = String(v == null ? "" : v);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function buildCsv(checks){
    var rows = [CSV_COLS];
    checks.forEach(function(c){
      var date = ymd(new Date(c.startedAt));
      var base = [c.id, date, c.apparatus.id, c.name, c.ff];
      c.apparatus.cabinets.forEach(function(cab){
        var res = c.results[cab.id] || { items: {}, extras: [] };
        cab.items.forEach(function(it){
          var r = res.items[it.id];
          var status = r && r.status ? r.status : "Not checked";
          rows.push(base.concat([cab.id, it.name, it.qty, foundText(it, r), status, failedSubs(it, r).join("; "), r ? r.note : ""]));
        });
        // Only older checks have extras. Quantity found goes in the found column.
        res.extras.forEach(function(e){
          rows.push(base.concat([cab.id, e.desc, "", e.qty, "Extra", "", e.note]));
        });
      });
    });
    return rows.map(function(r){ return r.map(csvCell).join(","); }).join("\r\n") + "\r\n";
  }
  function exportCsv(){
    if (!log.length) return;
    var now = new Date();
    var name = "truck-inventory-log-" + ymd(now, "") + "-" + hm(now, "") + ".csv";
    try {
      var blob = new Blob(["﻿" + buildCsv(log)], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
      toast("Saved " + name);
    } catch(e){
      toast("Export failed: " + e.message);
    }
  }

  // ---------- events ----------
  var actions = {
    "pick-app": function(b){ startSel = b.dataset.id; renderStartSelection(); },
    "start": startCheck,
    "resume": function(){ go("scanner"); },
    "discard": function(b){
      if (!armed(b)) return;
      active = null; store(KEY_ACTIVE, null);
      go("start", null, true); toast("Check discarded");
    },
    "to-log": function(){ go("log"); },
    "to-start": function(){ go("start"); },
    "to-scanner": function(){ go("scanner"); },
    "open-cab": function(b){ openCab(b.dataset.id); },
    "review": function(){ go("summary"); },
    "cab-back": function(){ go("scanner"); },
    "cab-complete": completeCab,
    "status": function(b){
      var x = itemResult(b);
      x.r.status = b.dataset.v;
      saveActive(); refreshCard(x.i); updateCabFooter();
    },
    "sub": function(b){
      var x = itemResult(b);
      x.r.sub = x.r.sub || {};
      x.r.sub[b.dataset.sub] = b.dataset.v;
      saveActive(); refreshCard(x.i); updateCabFooter();
    },
    "note": function(b){
      var x = itemResult(b);
      var ta = b.closest(".item").querySelector("textarea.note");
      if (ta){ ta.focus(); return; }
      x.r.noteOpen = true;
      refreshCard(x.i);
      var nt = document.querySelector("#it-" + x.i + " textarea.note");
      if (nt) nt.focus();
    },
    "level": function(b){
      var x = itemResult(b);
      if (b.dataset.v === "Missing"){ x.r.status = "Missing"; x.r.found = null; }
      else { x.r.found = +b.dataset.v; x.r.status = levelStatus(x.it, x.r.found); }
      saveActive(); refreshCard(x.i); updateCabFooter();
    },
    "count-step": function(b){
      var x = itemResult(b), d = +b.dataset.d;
      // First tap counts down from full (−) or sets full (+).
      setCount(x, x.r.found == null ? (d < 0 ? x.it.qty - 1 : x.it.qty) : x.r.found + d);
      saveActive(); refreshCard(x.i); updateCabFooter();
    },
    "count-full": function(b){
      var x = itemResult(b);
      setCount(x, x.it.qty);
      saveActive(); refreshCard(x.i); updateCabFooter();
    },
    "subs-toggle": function(b){
      var x = itemResult(b), key = view.cab + "|" + x.it.id;
      openSubs[key] = !openSubs[key];
      refreshCard(x.i);
    },
    "complete-check": function(b){ if (armed(b)) completeCheck(); },
    "export": exportCsv
  };

  function renderStartSelection(){
    Array.prototype.forEach.call(app.querySelectorAll(".app-btn"), function(b){ b.classList.toggle("sel", b.dataset.id === startSel); });
    updateStartBtn();
    var n = document.getElementById("fName");
    if (n && !n.value) n.focus();
  }

  app.addEventListener("click", function(e){
    var b = e.target.closest("[data-act]");
    if (!b || b.disabled || !app.contains(b)) return;
    var fn = actions[b.dataset.act];
    if (fn) fn(b, e);
  });

  app.addEventListener("input", function(e){
    var t = e.target;
    if (t.id === "fName" || t.id === "fFF"){ updateStartBtn(); return; }
    if (t.matches("[data-count]")){
      var c = itemResult(t);
      setCount(c, t.value.trim() === "" ? null : parseInt(t.value, 10));
      saveActive(); lightUpdate(c); updateCabFooter();
      return;
    }
    if (t.matches("textarea.note")){
      var x = itemResult(t);
      x.r.note = t.value;
      saveActive();
      var nb = t.closest(".item").querySelector(".note-btn");
      if (nb) nb.classList.toggle("has", !!t.value.trim());
    }
  });

  app.addEventListener("keydown", function(e){
    if (e.key !== "Enter") return;
    if ((e.target.id === "fName" || e.target.id === "fFF") && !document.getElementById("startBtn").disabled){ e.preventDefault(); startCheck(); }
    if (e.target.matches("[data-count]")){ e.preventDefault(); e.target.blur(); }
  });

  // After typing a count: if the saved number differs from what's shown (e.g. "-3" saved as 0), show the saved one.
  // Only the input's value changes, so a tap on another button in the card isn't lost.
  app.addEventListener("change", function(e){
    if (!e.target.matches("[data-count]")) return;
    var x = itemResult(e.target), shown = x.r.found == null ? "" : String(x.r.found);
    if (e.target.value !== shown) e.target.value = shown;
  });

  // ---------- boot ----------
  log = load(KEY_LOG, []) || [];
  active = load(KEY_ACTIVE, null);

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){
      master = d;
      view = active ? { screen: "scanner", cab: null } : { screen: "start", cab: null };
      try { history.replaceState(view, ""); } catch(e){}
      render();
    })
    .catch(function(err){
      app.innerHTML = '<p class="error"><b>Couldn\'t load the truck list (' + esc(DATA_URL) + ").</b><br>" + esc(err.message) +
        "<br><br>Check the tablet is online and reload. If testing on a computer, serve the folder over http (opening the file directly won't work).</p>";
    });
})();
