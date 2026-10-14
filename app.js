(function () {
  "use strict";
  var C = window.Core;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); };

  /* ---------- Formular aufbauen ---------- */
  function fieldHtml(f, prefix) {
    var id = prefix + f.k;
    var lab = '<label for="' + id + '"' + (f.req && prefix === "p0_" ? ' class="req"' : "") + ">" + esc(f.l) + "</label>";
    var inp;
    if (f.type === "select") {
      inp = '<select id="' + id + '">' + f.opts.map(function (o) { return '<option value="' + esc(o) + '">' + (o ? esc(o) : "Bitte wählen") + "</option>"; }).join("") + "</select>";
    } else {
      inp = '<input id="' + id + '" type="' + f.type + '"' + (f.ac ? ' autocomplete="' + f.ac + '"' : "") +
        (f.type === "number" ? ' inputmode="decimal" min="0" step="1"' : "") + ">";
    }
    if (f.eur) inp = '<div class="eur">' + inp + "</div>";
    return '<div class="f">' + lab + inp + "</div>";
  }

  ["Mietinteressent/in", "Ehegatte / Mitmieter/in (optional)"].forEach(function (title, i) {
    var col = document.createElement("div");
    col.className = "col";
    col.innerHTML = "<h3>" + title + "</h3>" + C.PERSON_FIELDS.map(function (f) { return fieldHtml(f, "p" + i + "_"); }).join("");
    $("persons").appendChild(col);
  });

  var memberSeq = 0;
  function addMember() {
    var n = memberSeq++;
    var row = document.createElement("div");
    row.className = "member";
    row.dataset.n = n;
    var fs = [["vorname", "Vorname", "text"], ["name", "Name", "text"], ["grad", "Verwandtschaftsgrad", "text"], ["alter", "Alter", "number"], ["eink", "Eigenes Einkommen (EUR)", "number"]];
    row.innerHTML = fs.map(function (f) {
      return '<div class="f"><label for="m' + n + "_" + f[0] + '">' + f[1] + '</label><input id="m' + n + "_" + f[0] + '" type="' + f[2] + '"' + (f[2] === "number" ? ' inputmode="numeric" min="0"' : "") + "></div>";
    }).join("") + '<div class="f"><button type="button" class="ghost">Entfernen</button></div>';
    row.querySelector("button").addEventListener("click", function () { row.remove(); });
    $("members").appendChild(row);
  }
  $("addMember").addEventListener("click", addMember);

  function selected(k) {
    var el = document.querySelector('input[name="a_' + k + '"]:checked');
    return el ? el.value : "";
  }
  C.QUESTIONS.forEach(function (q) {
    var d = document.createElement("div");
    d.className = "q";
    d.id = "q_" + q.k;
    var h = '<span class="lab">' + esc(q.t) + "</span>";
    if (q.free) {
      h += '<div class="f"><input type="month" id="a_' + q.k + '" aria-label="' + esc(q.t) + '"></div>';
    } else {
      h += '<div class="opts" role="radiogroup">' + q.opts.map(function (o) {
        return '<label class="opt"><input type="radio" name="a_' + q.k + '" value="' + esc(o) + '">' + esc(o) + "</label>";
      }).join("") + "</div>";
      if (q.detail) {
        h += '<div class="detail" hidden id="det_' + q.k + '">' + q.detail.map(function (f) {
          var inp = '<input type="' + (f.eur ? "number" : "text") + '" id="d_' + q.k + "_" + f.k + '"' + (f.eur ? ' inputmode="decimal" min="0"' : "") + ">";
          if (f.eur) inp = '<div class="eur">' + inp + "</div>";
          return '<div class="f"><label for="d_' + q.k + "_" + f.k + '">' + esc(f.l) + (f.eur ? " (mtl.)" : "") + "</label>" + inp + "</div>";
        }).join("") + "</div>";
      }
    }
    d.innerHTML = h;
    $("questions").appendChild(d);
    if (q.detail) {
      d.addEventListener("change", function () {
        $("det_" + q.k).hidden = q.detailOn.indexOf(selected(q.k)) < 0;
      });
    }
  });

  try {
    var t = new Date();
    $("datum").value = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  } catch (e) {}
  addMember();

  /* ---------- Unterschriftsfelder ---------- */
  var pads = [];
  function makePad(i, title) {
    var wrap = document.createElement("div");
    wrap.className = "sig";
    wrap.innerHTML = '<span class="lab">' + esc(title) + '</span><canvas aria-label="Unterschriftsfeld ' + (i + 1) + '"></canvas>' +
      '<div class="row"><span class="hint">Optional</span><button type="button" class="ghost">Löschen</button></div>';
    $("sigs").appendChild(wrap);
    var cv = wrap.querySelector("canvas"), ctx = null, drawing = false, ink = false, last = null;
    function size() {
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      var dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      ctx = cv.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#000";
      ink = false;
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener("pointerdown", function (e) {
      if (!ctx) size();
      drawing = true; last = pos(e);
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + 0.01, last.y + 0.01); ctx.stroke();
      ink = true; e.preventDefault();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; e.preventDefault();
    });
    function end() { drawing = false; }
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    wrap.querySelector("button").addEventListener("click", function () { size(); });
    window.addEventListener("resize", function () { if (!ink) size(); });
    pads.push({ wrap: wrap, size: size, data: function () { return ink ? cv.toDataURL("image/png") : null; } });
    setTimeout(size, 0);
  }
  makePad(0, "Mietinteressent/in");
  makePad(1, "Ehegatte / Mitmieter/in");
  pads[1].wrap.hidden = true;
  $("p1_name").addEventListener("input", function () {
    var show = !!this.value.trim();
    pads[1].wrap.hidden = !show;
    if (show) pads[1].size();
  });

  /* ---------- Daten, Prüfung ---------- */
  function val(id) { var e = $(id); return e ? e.value.trim() : ""; }
  function collect() {
    var d = { persons: [], members: [], answers: {}, c: {} };
    [0, 1].forEach(function (i) {
      var p = {};
      C.PERSON_FIELDS.forEach(function (f) { p[f.k] = val("p" + i + "_" + f.k); });
      d.persons.push(p);
    });
    d.hhnetto = val("hhnetto");
    d.personen = val("personen");
    Array.prototype.forEach.call($("members").children, function (row) {
      var n = row.dataset.n;
      d.members.push({ vorname: val("m" + n + "_vorname"), name: val("m" + n + "_name"), grad: val("m" + n + "_grad"), alter: val("m" + n + "_alter"), eink: val("m" + n + "_eink") });
    });
    C.QUESTIONS.forEach(function (q) {
      var a = {};
      if (q.free) { a.v = val("a_" + q.k); }
      else {
        a.v = selected(q.k);
        if (q.detail) q.detail.forEach(function (f) { a[f.k] = val("d_" + q.k + "_" + f.k); });
      }
      d.answers[q.k] = a;
    });
    d.c = { dsgvo: $("c_dsgvo").checked, schufa: $("c_schufa").checked, bonitaet: $("c_bonitaet").checked, referenz: $("c_referenz").checked };
    d.schufaBis = val("schufaBis");
    d.ort = val("ort");
    d.datum = val("datum");
    return d;
  }
  function mark(id, bad) { var e = $(id); if (e) e.setAttribute("aria-invalid", bad ? "true" : "false"); return bad; }
  function validate(d) {
    var firstBad = null, msgs = [];
    function need(id, bad, msg) { if (mark(id, bad)) { if (!firstBad) firstBad = id; if (msgs.indexOf(msg) < 0) msgs.push(msg); } }
    C.PERSON_FIELDS.forEach(function (f) { if (f.req) need("p0_" + f.k, !d.persons[0][f.k], "Bitte alle Pflichtfelder bei Mietinteressent/in ausfüllen."); });
    if (d.persons[1].name) {
      ["geb", "besch", "netto"].forEach(function (k) { need("p1_" + k, !d.persons[1][k], "Beim Mitmieter fehlen Angaben (Geburtsdatum, Beschäftigung, Einkommen)."); });
    }
    need("hhnetto", !d.hhnetto, "Bitte das Haushaltsnettoeinkommen angeben.");
    need("personen", !d.personen || Number(d.personen) < 1, "Bitte die Personenzahl angeben.");
    C.QUESTIONS.forEach(function (q) {
      if (q.free) return;
      if (!d.answers[q.k].v) {
        if (!firstBad) firstBad = "q_" + q.k;
        var m = "Bitte alle Fragen in Abschnitt 3 beantworten.";
        if (msgs.indexOf(m) < 0) msgs.push(m);
      }
    });
    if (!d.c.dsgvo || !d.c.schufa || !$("c_wahr").checked) {
      if (!firstBad) firstBad = !d.c.dsgvo ? "c_dsgvo" : (!d.c.schufa ? "c_schufa" : "c_wahr");
      msgs.push("Bitte die erforderlichen Einverständnisse und die Bestätigung ankreuzen.");
    }
    need("ort", !d.ort, "Bitte Ort angeben."); need("datum", !d.datum, "Bitte Datum angeben.");
    return { firstBad: firstBad, msgs: msgs };
  }

  /* ---------- PDF erzeugen ---------- */
  var current = null; // { blob, file, url, name }
  function fileName(d) {
    var base = (d.persons[0].name || "Auskunft").split(",")[0];
    base = C.clean(base).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "Auskunft";
    return "Mieterselbstauskunft-" + base + ".pdf";
  }
  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var d = collect(), r = validate(d), err = $("formErr");
    if (r.msgs.length) {
      err.textContent = r.msgs.join(" "); err.hidden = false;
      var t = $(r.firstBad);
      if (t && t.scrollIntoView) t.scrollIntoView({ block: "center" });
      if (t && t.focus) t.focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    var btn = $("make");
    btn.disabled = true;
    try {
      var sigs = [pads[0].data(), d.persons[1].name ? pads[1].data() : null];
      var doc = C.buildPdf(window.jspdf.jsPDF, d, sigs);
      var blob = doc.output("blob");
      var name = fileName(d);
      if (current && current.url) URL.revokeObjectURL(current.url);
      var file = null;
      try { file = new File([blob], name, { type: "application/pdf" }); } catch (e) {}
      current = { blob: blob, file: file, url: URL.createObjectURL(blob), name: name };
      $("fileInfo").textContent = name + " · " + Math.max(1, Math.round(blob.size / 1024)) + " KB";
      $("open").href = current.url;
      $("open").hidden = false;
      var canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
      $("share").hidden = !canShare;
      $("resMsg").textContent = "";
      $("resultSec").hidden = false;
      $("resultSec").scrollIntoView({ block: "start" });
    } catch (e) {
      err.textContent = "Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es mit einem aktuellen Browser (Chrome, Safari, Firefox, Edge).";
      err.hidden = false;
      if (window.console) console.error(e);
    }
    btn.disabled = false;
  });

  $("download").addEventListener("click", function () {
    if (!current) return;
    var a = document.createElement("a");
    a.href = current.url; a.download = current.name;
    document.body.appendChild(a); a.click(); a.remove();
    $("resMsg").textContent = "Das PDF wurde gespeichert, meist im Ordner „Downloads“. Bitte senden Sie es jetzt an uns.";
  });
  $("share").addEventListener("click", function () {
    if (!current || !current.file) return;
    navigator.share({ files: [current.file], title: "Mieterselbstauskunft" }).then(function () {
      $("resMsg").textContent = "Danke! Bitte prüfen Sie, dass die Nachricht abgeschickt wurde.";
    }, function (e) {
      if (e && e.name === "AbortError") return;
      $("resMsg").textContent = "Senden hat nicht geklappt. Bitte „PDF herunterladen“ nutzen.";
    });
  });
  $("back").addEventListener("click", function () {
    $("resultSec").hidden = true;
    $("form").scrollIntoView({ block: "start" });
  });
})();
