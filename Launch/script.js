(function(){
  /* ---------- Details to fill in later. Leave a value empty to keep the placeholder. ---------- */
  var CONFIG = {
    registerUrl: "",   // e.g. "https://your-signup-link.example"
    venue: "",         // e.g. "Lake Taupō"
    price: ""          // e.g. "$180"
  };
  var TARGET = { y: 2027, m: 1, d: 20 };   // first day of camp
  var LAST   = { y: 2027, m: 1, d: 23 };   // last day of camp

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var $ = function(id){ return document.getElementById(id); };

  /* ---------- NZ-time countdown ---------- */
  function nzInstant(y, m, d){
    var guess = Date.UTC(y, m - 1, d, 0, 0, 0);
    try {
      var fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Pacific/Auckland", hourCycle: "h23",
        year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
      });
      var offsetAt = function(t){
        var p = {};
        fmt.formatToParts(new Date(t)).forEach(function(x){ p[x.type] = x.value; });
        return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t;
      };
      var t = guess - offsetAt(guess);
      return guess - offsetAt(t);
    } catch (e) {
      return guess - 13 * 3600000;   // NZ daylight time fallback
    }
  }
  var START = nzInstant(TARGET.y, TARGET.m, TARGET.d);
  var END = nzInstant(LAST.y, LAST.m, LAST.d + 1);

  /* ---------- found tracker (total = number of pips in the HTML) ---------- */
  var TOTAL = $("pips").children.length, found = {}, nFound = 0;
  function mark(id){
    if (found[id]) return;
    found[id] = true; nFound++;
    var pips = $("pips").children;
    for (var i = 0; i < pips.length; i++) pips[i].classList.toggle("on", i < nFound);
    if (nFound === TOTAL){
      $("foundTxt").textContent = "All found. See you there.";
      $("found").classList.add("done");
      $("spotP").textContent = "You found it all. Now save your spot.";
    } else {
      $("foundTxt").textContent = "Found " + nFound + " of " + TOTAL;
    }
  }
  $("foundTxt").textContent = "Found 0 of " + TOTAL;

  /* ---------- splitting text into letters ---------- */
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function splitLetters(el){
    var text = el.textContent, words = text.split(" "), i = 0;
    el.textContent = "";
    words.forEach(function(word, wi){
      var w = document.createElement("span"); w.className = "w";
      Array.from(word).forEach(function(ch){
        var c = document.createElement("span"); c.className = "c"; c.textContent = ch;
        c.style.setProperty("--i", i++);
        c.style.setProperty("--dx", rnd(-46, 46).toFixed(0) + "px");
        c.style.setProperty("--dy", rnd(-110, -30).toFixed(0) + "px");
        c.style.setProperty("--r", rnd(-30, 30).toFixed(0) + "deg");
        w.appendChild(c);
      });
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }
  document.querySelectorAll("[data-split]").forEach(splitLetters);

  /* ---------- one reveal controller for hover, tap and keyboard ---------- */
  function makeReveal(el, id, onChange){
    var hover = false, pin = false, focus = false, last = null;
    function apply(){
      var open = hover || pin || focus;
      el.classList.toggle("is-open", open);
      el.setAttribute("aria-pressed", pin ? "true" : "false");
      if (open) mark(id);
      if (open !== last){ last = open; if (onChange) onChange(open); }
    }
    el.addEventListener("pointerenter", function(e){ if (e.pointerType === "touch") return; hover = true; apply(); });
    el.addEventListener("pointerleave", function(){ hover = false; apply(); });
    el.addEventListener("focus", function(){ if (el.matches(":focus-visible")){ focus = true; apply(); } });
    el.addEventListener("blur", function(){ focus = false; apply(); });
    el.addEventListener("click", function(){ pin = !pin; apply(); });
  }

  function scramble(el, finalText, dur){
    if (reduce.matches){ el.textContent = finalText; return; }
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&", t0 = performance.now();
    if (el._raf) cancelAnimationFrame(el._raf);
    (function step(t){
      var p = Math.min(1, (t - t0) / dur), out = "";
      for (var i = 0; i < finalText.length; i++){
        var ch = finalText.charAt(i);
        out += (ch === " " || ch === "." || i / finalText.length < p) ? ch : chars.charAt(Math.random() * chars.length | 0);
      }
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(step); else el.textContent = finalText;
    })(t0);
  }

  /* date reveal + supporting line */
  var support = $("support");
  makeReveal($("date"), "date", function(open){
    support.classList.toggle("on", open);
    if (open) scramble(support, support.getAttribute("data-final"), 800);
  });

  /* question rows (does nothing while they are commented out in the HTML) */
  var answers = { where: CONFIG.venue, cost: CONFIG.price };
  document.querySelectorAll(".row").forEach(function(row){
    var key = row.getAttribute("data-key");
    if (answers[key]) row.querySelector("[data-ans]").textContent = answers[key];
    makeReveal(row, "row-" + key);
  });

  /* ---------- ticker ---------- */
  (function(){
    var words = ["Something’s coming", "Paradigm Youth Camp", "Save your spot", "Something’s coming", "2027", "Be there"];
    var html = "";
    for (var r = 0; r < 4; r++) words.forEach(function(w){ html += "<span>" + w + "</span>"; });
    $("track").innerHTML = html;
  })();

  /* ---------- cursor-reactive headline (uses screen coordinates, so it works while the panel is pinned) ---------- */
  var h1 = $("h1"), hero = $("top");
  h1.querySelectorAll("[data-chars]").forEach(function(line){
    var t = line.textContent; line.textContent = "";
    Array.from(t).forEach(function(ch){
      var s = document.createElement("span"); s.className = "ch"; s.textContent = ch; line.appendChild(s);
    });
  });
  var chars = Array.prototype.slice.call(h1.querySelectorAll(".ch"));
  var offs = [], R = 160, fv = chars.map(function(){ return 0; });
  var ptr = { x: 0, y: 0, on: false }, raf = 0, sweeping = false, introDone = false;

  function measure(){
    var hr = h1.getBoundingClientRect();
    offs = chars.map(function(c){
      var r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2 - hr.left, y: r.top + r.height / 2 - hr.top };
    });
    R = Math.max(110, parseFloat(getComputedStyle(h1).fontSize) * 1.1);
  }
  function tick(){
    var hr = h1.getBoundingClientRect(), moving = false;
    for (var i = 0; i < chars.length; i++){
      var dx = ptr.x - (hr.left + offs[i].x), dy = ptr.y - (hr.top + offs[i].y);
      var target = ptr.on ? Math.exp(-(dx * dx + dy * dy) / (R * R)) : 0;
      var diff = target - fv[i];
      if (Math.abs(diff) > 0.003){ fv[i] += diff * 0.2; moving = true; } else fv[i] = target;
      chars[i].style.setProperty("--f", fv[i].toFixed(3));
    }
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(tick); }

  if (!reduce.matches){
    var touchTimer = 0;
    hero.addEventListener("pointermove", function(e){
      sweeping = false; ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; kick();
    });
    hero.addEventListener("pointerdown", function(e){
      sweeping = false; ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; kick();
      if (e.pointerType === "touch"){ clearTimeout(touchTimer); touchTimer = setTimeout(function(){ ptr.on = false; kick(); }, 700); }
    });
    hero.addEventListener("pointerleave", function(){ ptr.on = false; kick(); });
    window.addEventListener("resize", function(){ if (!ptr.on) measure(); });

    var intro = function(){
      if (introDone) return;
      introDone = true;
      if (offs.length < 2) return;
      var t0 = performance.now(), dur = 2400; sweeping = true; ptr.on = true;
      (function step(t){
        if (!sweeping) return;
        var hr = h1.getBoundingClientRect();
        var p = Math.min(1, (t - t0) / dur), pos = p * (offs.length - 1);
        var k = Math.min(offs.length - 2, Math.floor(pos)), u = pos - k;
        ptr.x = hr.left + offs[k].x + (offs[k + 1].x - offs[k].x) * u;
        ptr.y = hr.top + offs[k].y + (offs[k + 1].y - offs[k].y) * u;
        kick();
        if (p < 1) requestAnimationFrame(step); else { sweeping = false; ptr.on = false; kick(); }
      })(t0);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(measure);
    /* run the wave once, when page 2 scrolls into view */
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(entries, io){
        entries.forEach(function(e){
          if (e.isIntersecting){ io.disconnect(); setTimeout(intro, 300); }
        });
      }, { threshold: 0.35 }).observe(hero);
    }
  }

  /* cursor glow */
  var glow = $("glow"), ghost = $("ghost");
  if (fine.matches && !reduce.matches){
    window.addEventListener("pointermove", function(e){
      if (e.pointerType === "touch") return;
      glow.classList.add("on");
      glow.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
    }, { passive: true });
    document.addEventListener("pointerleave", function(){ glow.classList.remove("on"); });
  }

  /* ---------- countdown ---------- */
  var UNITS = [
    { one: "day", many: "days", ms: 86400000 },
    { one: "hour", many: "hours", ms: 3600000 },
    { one: "minute", many: "minutes", ms: 60000 },
    { one: "second", many: "seconds", ms: 1000 }
  ];
  var ui = 1;   // 0 = days, 1 = hours, 2 = minutes, 3 = seconds. This is the unit the page opens on.
  var wordEl = $("unitW"), lastCycle = 0, lastMinute = -1, lastLen = 0;
  var coverP = 0, numRolling = false;
  function pad(n){ return n < 10 ? "0" + n : "" + n; }
  function wordFor(v){ return v === 1 ? UNITS[ui].one : UNITS[ui].many; }

  /* scale the big number so it fills the width of the screen */
  function fitNum(){
    var num = $("cNum"), box = $("big");
    if (!box.clientWidth) return;
    num.style.fontSize = "100px";
    var w = num.offsetWidth || 1;
    var size = 100 * box.clientWidth * 0.9 / w;
    num.style.fontSize = Math.min(size, window.innerHeight * 0.56) + "px";
  }

  function render(){
    var now = Date.now(), ms = START - now;
    if (ms <= 0){
      $("big").hidden = true; $("ticks").hidden = true; $("cMsg").hidden = false;
      $("cMsg").textContent = now < END ? "It’s on." : "Thanks for coming.";
      return;
    }
    var total = Math.floor(ms / UNITS[ui].ms);
    var txt = total.toLocaleString("en-NZ");
    var num = $("cNum");
    if (!numRolling && num.textContent !== txt){
      var had = num.textContent !== "--";
      num.textContent = txt;
      if (had) bump(num);
    }
    if (txt.length !== lastLen){ lastLen = txt.length; fitNum(); }
    var w = wordFor(total);
    if (wordEl.textContent !== w && !wordEl._busy) wordEl.textContent = w;
    $("cUnit").setAttribute("aria-label", "Showing " + UNITS[ui].many + ". Change the unit.");

    var s = Math.floor(ms / 1000);
    setTxt("tD", pad(Math.floor(s / 86400)));
    setTxt("tH", pad(Math.floor(s % 86400 / 3600)));
    setTxt("tM", pad(Math.floor(s % 3600 / 60)));
    setTxt("tS", pad(s % 60));

    var minute = Math.floor(s / 60);
    if (minute !== lastMinute){
      lastMinute = minute;
      $("srCount").textContent = Math.floor(s / 86400) + " days, " + Math.floor(s % 86400 / 3600) + " hours and " + Math.floor(s % 3600 / 60) + " minutes until camp starts.";
    }
  }

  function cycleUnit(){
    var nowT = Date.now();
    if (nowT - lastCycle < 450) return;
    lastCycle = nowT;
    ui = (ui + 1) % UNITS.length;
    mark("unit");
    buildWall(UNITS[ui].many);
    setTimeout(function(){ rollNumber(700); }, 60);
    var total = Math.floor((START - Date.now()) / UNITS[ui].ms);
    var w = wordFor(total), old = wordEl;
    if (reduce.matches || !old.animate){
      old.textContent = w; render(); fitNum(); return;
    }
    var nw = document.createElement("span"); nw.textContent = w;
    old.parentNode.appendChild(nw);
    var ease = "cubic-bezier(.19,1,.22,1)";
    old._busy = true;
    nw.animate([{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 520, easing: ease, fill: "both" });
    old.animate([{ transform: "none" }, { transform: "translateY(-110%)" }], { duration: 520, easing: ease, fill: "both" })
      .finished.then(function(){ old.remove(); }, function(){ old.remove(); });
    wordEl = nw;
    render(); fitNum();
  }
  var unitBtn = $("cUnit");
  unitBtn.addEventListener("pointerenter", function(e){ if (e.pointerType === "mouse" || e.pointerType === "pen") cycleUnit(); });
  unitBtn.addEventListener("click", function(e){ if (e.pointerType === "mouse" || e.pointerType === "pen") return; cycleUnit(); });

  render();
  setInterval(render, 250);

  /* ---------- front page movement ---------- */
  function bump(el){
    if (reduce.matches) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
  function setTxt(id, t){
    var el = $(id);
    if (el.textContent === t) return;
    var had = el.textContent !== "--";
    el.textContent = t;
    if (had) bump(el);
  }

  /* digits spin and settle left to right */
  function rollNumber(dur){
    var num = $("cNum"), finalTxt = num.textContent;
    if (reduce.matches || numRolling || !/\d/.test(finalTxt)) return;
    var n = finalTxt.length, t0 = performance.now(), last = 0;
    numRolling = true;
    (function step(t){
      var p = Math.min(1, (t - t0) / dur);
      if (t - last < 55 && p < 1){ requestAnimationFrame(step); return; }
      last = t;
      var out = "";
      for (var i = 0; i < n; i++){
        var ch = finalTxt.charAt(i);
        if (/\d/.test(ch) && p < 0.25 + 0.75 * (i + 1) / n) ch = String(Math.random() * 10 | 0);
        out += ch;
      }
      num.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else { numRolling = false; num.textContent = finalTxt; render(); }
    })(t0);
  }

  /* moving rows of outlined type behind the number */
  var wall = $("wall");
  var WALL_ROWS = [
    { dur: 70, k: -34, rev: false }, { dur: 55, k: 22, rev: true }, { dur: 82, k: -14, rev: false },
    { dur: 60, k: 30, rev: true }, { dur: 76, k: -24, rev: false }
  ];
  var wallTracks = WALL_ROWS.map(function(cfg){
    var row = document.createElement("div");
    row.className = "wall__row" + (cfg.rev ? " rev" : "");
    row.style.setProperty("--k", cfg.k);
    var track = document.createElement("div");
    track.className = "wall__track";
    track.style.setProperty("--dur", cfg.dur + "s");
    row.appendChild(track); wall.appendChild(row);
    return track;
  });
  function buildWall(word){
    var label = (word + " to go").toUpperCase(), half = "";
    for (var i = 0; i < 6; i++) half += "<span>" + label + "</span>";
    wallTracks.forEach(function(tr){ tr.innerHTML = half + half; });
  }
  buildWall(UNITS[ui].many);

  /* cursor tilt */
  var countEl = document.querySelector(".count");
  if (!reduce.matches){
    countEl.addEventListener("pointermove", function(e){
      if (e.pointerType === "touch") return;
      countEl.style.setProperty("--mx", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
      countEl.style.setProperty("--my", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
    });
    countEl.addEventListener("pointerleave", function(){
      countEl.style.setProperty("--mx", 0);
      countEl.style.setProperty("--my", 0);
    });
  }

  /* bottom line fills once a minute, in step with the clock */
  $("pulse").style.animationDelay = "-" + ((Date.now() / 1000) % 60).toFixed(2) + "s";

  /* opening roll, then a quick re-roll every 10 seconds while page 1 is on screen */
  rollNumber(1900);
  setInterval(function(){
    if (document.hidden || coverP > 0.15) return;
    rollNumber(900);
  }, 10000);

  /* ---------- stacked panels: transitions between the three pages ---------- */
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
  var stickies = Array.prototype.slice.call(document.querySelectorAll(".panel"));

  /* a panel taller than the screen scrolls until its bottom is visible, then pins */
  function fitPanels(){
    stickies.forEach(function(p){
      p.style.top = Math.min(0, window.innerHeight - p.offsetHeight) + "px";
    });
  }
  function onScroll(){
    var vh = window.innerHeight;
    for (var i = 0; i < panels.length - 1; i++){
      var next = panels[i + 1];
      var top = next.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, 1 - top / vh)).toFixed(3);
      if (i === 0) coverP = +p;
      panels[i].style.setProperty("--p", p);
      next.style.setProperty("--in", p);
    }
    if (!reduce.matches){
      ghost.style.transform = "translate3d(0," + (hero.getBoundingClientRect().top * 0.12).toFixed(1) + "px,0)";
    }
  }
  var scrollQueued = false;
  function queueScroll(){
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function(){ scrollQueued = false; onScroll(); });
  }
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", function(){ fitPanels(); fitNum(); queueScroll(); });
  fitPanels(); onScroll();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
    fitNum(); fitPanels(); onScroll();
  });

  $("cue").addEventListener("click", function(){
    window.scrollTo({ top: window.innerHeight, behavior: reduce.matches ? "auto" : "smooth" });
  });

  /* ---------- sign-up link ---------- */
  var note = $("regNote");
  document.querySelectorAll("[data-register]").forEach(function(a){
    if (CONFIG.registerUrl){
      a.href = CONFIG.registerUrl; a.target = "_blank"; a.rel = "noopener";
    } else {
      a.addEventListener("click", function(e){
        e.preventDefault();
        $("spot").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
        note.hidden = false;
      });
    }
  });

  /* magnetic sign-up button */
  var wrapEl = $("orbwrap"), orb = $("orb");
  if (fine.matches && !reduce.matches){
    $("spot").addEventListener("pointermove", function(e){
      var r = wrapEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
      orb.style.transform = d < 320 ? "translate(" + (dx * 0.22).toFixed(1) + "px," + (dy * 0.22).toFixed(1) + "px)" : "";
    });
    $("spot").addEventListener("pointerleave", function(){ orb.style.transform = ""; });
  }
})();