/* Gemeinsamer Kern: Konfiguration, Formatierung und PDF-Aufbau.
   Läuft im Browser (window.Core) und in Node (module.exports) für Tests. */
(function (g) {
  "use strict";

  var OBJEKT = {
    adresse: "Lützowstraße 24, 47057 Duisburg, 1. OG",
    vermieter: "FiOs Immobilien eGbR"
  };

  var PERSON_FIELDS = [
    { k: "name", l: "Name, Vorname", req: true, type: "text", ac: "name" },
    { k: "geb", l: "Geburtsdatum", req: true, type: "date", ac: "bday" },
    { k: "stand", l: "Familienstand", type: "select", opts: ["", "ledig", "verheiratet", "eingetragene Lebenspartnerschaft", "getrennt lebend", "geschieden", "verwitwet"] },
    { k: "besch", l: "Beschäftigungsart", req: true, type: "select", opts: ["", "angestellt", "verbeamtet", "selbstständig", "in Ausbildung / Studium", "Rente / Pension", "sonstige"] },
    { k: "anschrift", l: "Bisherige Anschrift", req: true, type: "text", ac: "street-address" },
    { k: "email", l: "E-Mail", type: "email", ac: "email" },
    { k: "telP", l: "Telefon privat", req: true, type: "tel", ac: "tel" },
    { k: "telG", l: "Telefon geschäftlich", type: "tel" },
    { k: "vermieter", l: "Bisheriger Vermieter (Anschrift / Telefon)", type: "text" },
    { k: "arbeitgeber", l: "Derzeitiger Arbeitgeber (Anschrift / Telefon)", type: "text" },
    { k: "seit", l: "Beschäftigt in ungekündigter Stellung seit", type: "month" },
    { k: "bis", l: "Befristet beschäftigt bis zum", type: "date" },
    { k: "beruf", l: "Derzeit ausgeübter Beruf", type: "text" },
    { k: "netto", l: "Aktuelles monatliches Nettoeinkommen", req: true, type: "number", eur: true }
  ];

  var QUESTIONS = [
    { k: "wg", t: "Es bestehen Absichten oder Gründe, weitere Personen in die Wohnung aufzunehmen oder eine Wohngemeinschaft zu gründen.", opts: ["Nein", "Ja"], detailOn: ["Ja"], detail: [{ k: "d", l: "Welche Personen / welcher Grund?" }] },
    { k: "tiere", t: "Ich / wir halten Haustiere.", opts: ["Nein", "Ja"], detailOn: ["Ja"], detail: [{ k: "d", l: "Welche Tiere (Art, Anzahl)?" }] },
    { k: "gewerbe", t: "Die Wohnung soll gewerblich genutzt werden.", opts: ["Nein", "Ja"], detailOn: ["Ja"], detail: [{ k: "d", l: "Art der Nutzung" }] },
    { k: "mietseit", t: "Seit wann besteht Ihr derzeitiges Mietverhältnis?", free: "month" },
    { k: "gekuendigt", t: "Mein / unser derzeitiges Mietverhältnis wurde gekündigt.", opts: ["Nein", "Ja, durch den Mieter", "Ja, durch den Vermieter"], detailOn: ["Ja, durch den Mieter", "Ja, durch den Vermieter"], detail: [{ k: "d", l: "Wegen" }] },
    { k: "raeumung", t: "Über die Räumung meiner / unserer Wohnung war oder ist ein Räumungsstreit anhängig.", opts: ["Nein", "Ja"] },
    { k: "zahlung", t: "Es bestehen Zahlungsverpflichtungen (monatlich).", opts: ["Nein", "Ja"], detailOn: ["Ja"], detail: [
      { k: "teil", l: "Teilzahlungsgeschäfte", eur: true }, { k: "darl", l: "Darlehen", eur: true },
      { k: "buerg", l: "Bürgschaften", eur: true }, { k: "sonst", l: "Sonstige", eur: true }] },
    { k: "eidesstatt", t: "Ich / wir haben eine eidesstattliche Versicherung (Vermögensauskunft) abgegeben, es erging ein Haftbefehl zu deren Erzwingung oder ein solches Verfahren ist anhängig.", opts: ["Nein", "Ja"] },
    { k: "insolvenz", t: "In den letzten 5 Jahren wurde über mein / unser Vermögen ein Insolvenzverfahren eröffnet oder mangels Masse abgewiesen, oder ein solches Verfahren ist derzeit anhängig.", opts: ["Nein", "Ja"] },
    { k: "sicherheit", t: "Ich bin / wir sind in der Lage, eine Mietsicherheit von 3 Monatsmieten zu leisten und die geforderte Miete laufend zu zahlen.", opts: ["Ja", "Nein"] }
  ];

  var CONSENTS = [
    { k: "dsgvo", t: "Datenverarbeitung zum Zweck der Anbahnung und Durchführung des Mietvertrages gemäß Art. 6 Abs. 1 lit. b) und f) DSGVO" },
    { k: "schufa", t: "SCHUFA-Selbstauskunft wird direkt bei der SCHUFA eingeholt und dem Vermieter übergeben (Voraussetzung für das Zustandekommen des Mietvertrags)" },
    { k: "bonitaet", t: "Der Vermieter darf eine Bonitätsprüfung durchführen lassen" },
    { k: "referenz", t: "Telefonische Referenzanfrage beim bisherigen Vermieter ist gestattet" }
  ];

  var HINWEIS = "Wichtiger Hinweis: Ein etwaiger Mietvertrag kommt nur unter der Bedingung zustande, dass die Angaben der Wahrheit entsprechen. Stellt sich nach Abschluss des Mietvertrages heraus, dass einzelne Angaben falsch sind, sind die Mieter zur sofortigen Räumung und Herausgabe des Mietobjektes verpflichtet und haben dem Vermieter jeden mittelbaren und unmittelbaren Schaden zu ersetzen.";

  /* ---------- Formatierung ---------- */
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "." + m[2] + "." + m[1] : (iso || "");
  }
  function fmtMonth(iso) {
    var m = /^(\d{4})-(\d{2})$/.exec(iso || "");
    return m ? m[2] + "/" + m[1] : (iso || "");
  }
  function fmtVal(f, v) {
    if (!v) return "";
    if (f.type === "date") return fmtDate(v);
    if (f.type === "month") return fmtMonth(v);
    if (f.eur) return v + " EUR";
    return v;
  }
  /* Die eingebauten PDF-Schriften kennen nur Latin-1 (plus Euro-Zeichen).
     Andere Zeichen werden auf das Grundzeichen reduziert, sonst "?". */
  function clean(s) {
    s = String(s == null ? "" : s);
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), c = s.charCodeAt(i);
      if (c === 10 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || c === 0x20AC) { out += ch; continue; }
      if (c === 0x2013 || c === 0x2014) { out += "-"; continue; }
      if (c === 0x2018 || c === 0x2019) { out += "'"; continue; }
      if (c === 0x201C || c === 0x201E || c === 0x201D) { out += '"'; continue; }
      var sp = { "\u0141": "L", "\u0142": "l", "\u0110": "D", "\u0111": "d", "\u0131": "i", "\u0130": "I", "\u0126": "H", "\u0127": "h" };
      if (sp[ch]) { out += sp[ch]; continue; }
      var base = ch.normalize ? ch.normalize("NFD").replace(/[̀-ͯ]/g, "") : "";
      out += (base && base.charCodeAt(0) < 128 && base.length === 1) ? base : "?";
    }
    return out;
  }

  /* ---------- PDF ---------- */
  function buildPdf(JsPDF, d, sigs) {
    sigs = sigs || [];
    var doc = new JsPDF({ unit: "mm", format: "a4", compress: true });
    doc.setProperties({ title: "Mieterselbstauskunft", subject: OBJEKT.adresse });
    var M = 18, W = 210 - 2 * M, BOT = 297 - 20, y = M;
    var INK = [22, 34, 44], MUTED = [95, 108, 118], LINE = [200, 208, 214], ACC = [29, 92, 120];

    function lh(size) { return size * 0.3528 * 1.38; }
    function font(size, bold, color) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      var c = color || INK;
      doc.setTextColor(c[0], c[1], c[2]);
    }
    function wrap(s, width, size, bold) { font(size || 9.5, bold); return doc.splitTextToSize(clean(s), width); }
    function ensure(h) { if (y + h > BOT) { doc.addPage(); y = M; } }
    function hr(color) { doc.setDrawColor((color || LINE)[0], (color || LINE)[1], (color || LINE)[2]); doc.setLineWidth(0.2); doc.line(M, y, M + W, y); }

    function heading(txt) {
      ensure(32);
      y += 5;
      font(11.5, true, ACC);
      doc.text(clean(txt), M, y);
      y += 1.8;
      hr(ACC);
      y += 5;
    }
    function para(txt, size, bold, color) {
      size = size || 9.5;
      var lines = wrap(txt, W), step = lh(size);
      font(size, bold, color);
      for (var i = 0; i < lines.length; i++) { ensure(step); y += step; doc.text(lines[i], M, y - step * 0.25); }
    }

    /* Kopf */
    font(20, true);
    y += 8; doc.text("Mieterselbstauskunft", M, y);
    y += 7;
    font(10, false, MUTED);
    doc.text(clean("Objekt: " + OBJEKT.adresse), M, y);
    y += 5; doc.text(clean("Vermieter: " + OBJEKT.vermieter), M, y);
    y += 5; doc.text(clean("Ausgefüllt am " + fmtDate(d.datum) + " in " + d.ort), M, y);
    y += 3;

    /* Personen */
    var p1 = d.persons[0], p2 = d.persons[1] && d.persons[1].name ? d.persons[1] : null;
    heading("Angaben zu den Personen");
    var cl = 56, cw = p2 ? (W - cl) / 2 : W - cl;
    var cols = [{ x: M + cl, w: cw, p: p1 }];
    if (p2) cols.push({ x: M + cl + cw, w: cw, p: p2 });

    ensure(8);
    font(8.5, true, MUTED);
    y += 4;
    doc.text("MIETINTERESSENT/IN", cols[0].x + 1.5, y);
    if (p2) doc.text("EHEGATTE / MITMIETER/IN", cols[1].x + 1.5, y);
    y += 2;
    hr();
    PERSON_FIELDS.forEach(function (f) {
      var cells = cols.map(function (c) { return wrap(fmtVal(f, c.p[f.k]) || "-", c.w - 3); });
      var labelLines = wrap(f.l, cl - 3);
      var n = Math.max(labelLines.length, cells.reduce(function (a, c) { return Math.max(a, c.length); }, 1));
      var step = lh(9.5), h = n * step + 2.6;
      ensure(h);
      font(8.5, false, MUTED);
      doc.text(labelLines, M + 1.5, y + step);
      font(9.5, false);
      cols.forEach(function (c, i) { doc.text(cells[i], c.x + 1.5, y + step); });
      y += h;
      hr();
    });

    /* Haushalt */
    heading("Haushalt");
    function kv(label, val) {
      var step = lh(9.5), vl = wrap(val, W - 75);
      ensure(vl.length * step + 1.5);
      font(9, false, MUTED); doc.text(clean(label), M + 1.5, y + step);
      font(9.5, true); doc.text(vl, M + 75, y + step);
      y += vl.length * step + 1.5;
    }
    kv("Gesamt-Haushaltsnettoeinkommen", d.hhnetto ? d.hhnetto + " EUR pro Monat" : "-");
    kv("Wohnung wird benötigt für", d.personen + " Person(en)");
    var ms = d.members.filter(function (m) { return m.vorname || m.name; });
    if (ms.length) {
      y += 1.5;
      font(8.5, true, MUTED); ensure(8); y += 4; doc.text("WEITERE HAUSHALTSMITGLIEDER", M + 1.5, y); y += 2; hr();
      var hc = [M + 1.5, M + 38, M + 76, M + 96];
      font(8, false, MUTED); y += 4;
      doc.text("Vorname, Name", hc[0], y); doc.text("Verwandtschaftsgrad", hc[1], y);
      doc.text("Alter", hc[2], y); doc.text("Eigenes Einkommen", hc[3], y);
      y += 1.5; hr();
      ms.forEach(function (m) {
        var a = wrap([m.vorname, m.name].filter(Boolean).join(" "), 35), b = wrap(m.grad || "-", 36);
        var n = Math.max(a.length, b.length), step = lh(9.5);
        ensure(n * step + 2.6);
        font(9.5, false);
        doc.text(a, hc[0], y + step); doc.text(b, hc[1], y + step);
        doc.text(clean(m.alter || "-"), hc[2], y + step); doc.text(clean(m.eink ? m.eink + " EUR" : "-"), hc[3], y + step);
        y += n * step + 2.6; hr();
      });
    } else {
      kv("Weitere Haushaltsmitglieder", "keine");
    }

    /* Erklärungen */
    heading("Erklärungen");
    QUESTIONS.forEach(function (q) {
      var a = d.answers[q.k] || {};
      var qw = W - 42, ql = wrap(q.t, qw), step = lh(9.5);
      var ans = q.free ? (fmtMonth(a.v) || "-") : (a.v || "-");
      var detail = "";
      if (q.detail && a.v && q.detailOn.indexOf(a.v) > -1) {
        detail = q.detail.map(function (f) {
          var v = a[f.k];
          return v ? (q.detail.length > 1 ? f.l + " " : "") + v + (f.eur ? " EUR mtl." : "") : "";
        }).filter(Boolean).join("; ");
      }
      var dl = detail ? wrap("Angabe: " + detail, qw) : [];
      var h = (ql.length + dl.length) * step + 2.8;
      ensure(h);
      font(9.5, false); doc.text(ql, M + 1.5, y + step);
      font(9.5, true); doc.text(wrap(ans, 38), M + W - 38, y + step);
      if (dl.length) { font(9, false, MUTED); doc.text(dl, M + 1.5, y + step * (ql.length + 1)); }
      y += h;
      hr();
    });

    /* Einverständnis */
    heading("Einverständnis");
    CONSENTS.forEach(function (c) {
      var t = c.t;
      if (c.k === "schufa" && d.schufaBis) t += ", Übergabe bis spätestens " + fmtDate(d.schufaBis);
      var lines = wrap(t, W - 9), step = lh(9.5);
      ensure(lines.length * step + 3);
      doc.setDrawColor(INK[0], INK[1], INK[2]); doc.setLineWidth(0.3);
      doc.rect(M + 1.5, y + 1, 3.6, 3.6);
      if (d.c[c.k]) { doc.line(M + 2, y + 1.6, M + 4.6, y + 4.1); doc.line(M + 4.6, y + 1.6, M + 2, y + 4.1); }
      font(9.5, false); doc.text(lines, M + 8, y + step);
      y += lines.length * step + 2.4;
    });

    /* Hinweis */
    y += 3;
    var hl = wrap(HINWEIS, W - 8), hh = hl.length * lh(9) + 7;
    ensure(hh + 2);
    doc.setFillColor(255, 244, 220); doc.rect(M, y, W, hh, "F");
    font(9, false, [91, 67, 8]); doc.text(hl, M + 4, y + 5.2);
    y += hh + 4;

    /* Unterschriften */
    var need = 62;
    ensure(need);
    y += 2;
    font(9.5, false);
    doc.text(clean(d.ort + ", den " + fmtDate(d.datum)), M, y + 4);
    y += 10;
    var persons = [p1].concat(p2 ? [p2] : []);
    var bw = p2 ? (W - 12) / 2 : 90;
    persons.forEach(function (p, i) {
      var x = M + i * (bw + 12);
      var sg = sigs[i];
      if (sg) { try { doc.addImage(sg, "PNG", x + 2, y, 60, 22); } catch (e) {} }
      doc.setDrawColor(INK[0], INK[1], INK[2]); doc.setLineWidth(0.3);
      doc.line(x, y + 24, x + bw, y + 24);
      font(8.5, false, MUTED);
      doc.text(clean(p.name + (i === 0 ? " (Mietinteressent/in)" : " (Mitmieter/in)")), x, y + 28.5);
    });
    y += 32;

    /* Fußzeile */
    var pages = doc.getNumberOfPages();
    for (var i = 1; i <= pages; i++) {
      doc.setPage(i);
      font(8, false, MUTED);
      doc.text(clean("Mieterselbstauskunft " + OBJEKT.adresse), M, 297 - 10);
      doc.text("Seite " + i + " von " + pages, 210 - M, 297 - 10, { align: "right" });
    }
    return doc;
  }

  var api = {
    OBJEKT: OBJEKT, PERSON_FIELDS: PERSON_FIELDS, QUESTIONS: QUESTIONS, CONSENTS: CONSENTS, HINWEIS: HINWEIS,
    fmtDate: fmtDate, fmtMonth: fmtMonth, fmtVal: fmtVal, clean: clean, buildPdf: buildPdf
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else g.Core = api;
})(typeof window !== "undefined" ? window : this);
