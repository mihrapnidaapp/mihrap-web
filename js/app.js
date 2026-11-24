/* Mihrap web — browser version of the Mihrap tablet app for smart-TV browsers.
 * Plain ES5 on purpose: TV browsers (Tizen, webOS, Vidaa, Android TV) often run old Chromium builds.
 * Ported from the Android sources (1.0.17): PrayerApi, PrayerCalculator, CalculatedTimes, HijriDays,
 * ScreensaverTextRenderer, SkyHomeView, MosqueMedallionView, ReferenceButtonDrawable, ThemePresets,
 * SlideTransitions, AdhanHelper, AdhanVisuals and the home/slide/adhan/reminder code of MainActivity.
 * The stage is 1920x1080 px; one Android dp is 1.5 px (a 1280x720 dp landscape screen).
 */
(function () {
  "use strict";

  var DATA = window.MIHRAP_DATA;
  // Chrome fires this when the page meets the install rules (PWA); noted for checks, the browser's own prompt is left alone.
  window.mihrapInstallable = false;
  window.addEventListener("beforeinstallprompt", function () { window.mihrapInstallable = true; });
  var W = 1920, H = 1080, DP = 1.5;
  var KEYS = ["Imsak", "Gunes", "Ogle", "Ikindi", "Aksam", "Yatsi"];
  var LANGS = ["tr", "en", "de", "ar", "fa", "id", "ms", "zh", "ur", "hi"];
  var LANG_NAMES = { tr: "Türkçe", en: "English", de: "Deutsch", ar: "العربية", fa: "فارسی", id: "Bahasa Indonesia",
    ms: "Bahasa Melayu", zh: "中文", ur: "اردو", hi: "हिन्दी" };
  var RTL = { ar: true, fa: true, ur: true };

  var SANS = '"MRoboto", Roboto, "Noto Sans", Arial, sans-serif';
  var THIN = '"MRobotoThin", "MRoboto", Roboto, sans-serif';
  var MONO = '"MMono", "Droid Sans Mono", monospace';
  var SERIF = '"MihrapSerif", "Noto Serif", Georgia, serif';

  // ThemePresets.ALL: layout (1 Classic photo, 2 Pano, 3 Salon, 4 Sky), photo, accent, clock style.
  var PRESETS = [
    { name: "theme_medina", layout: 1, photo: 0, accent: "teal", clock: 1 },
    { name: "theme_kaaba", layout: 1, photo: 1, accent: "gold", clock: 1 },
    { name: "theme_green_dome", layout: 1, photo: 2, accent: "teal", clock: 2 },
    { name: "home_layout_2", layout: 2, photo: 0, accent: "teal", clock: 2 },
    { name: "home_layout_3", layout: 3, photo: 0, accent: "gold", clock: 2 },
    { name: "theme_sky", layout: 4, photo: 0, accent: "teal", clock: 2 }
  ];
  // DashPalette (Pano / Salon).
  var PALETTES = {
    teal: { highlight: "#3E6E66", highlightText: "#FFFFFF", nextStroke: "#D4B56A", buttonFill: "#3E6E66", buttonStroke: "#2C4F48", buttonText: "#FFFFFF" },
    gold: { highlight: "#C4A05A", highlightText: "#2C2418", nextStroke: "#E8D5A0", buttonFill: "#C4A05A", buttonStroke: "#8A6A2E", buttonText: "#2C2418" }
  };
  var CHIP_IDLE = "rgba(255,255,255,0.8)", CHIP_IDLE_STROKE = "rgba(196,160,90,0.4)";
  var GOLD_SOFT = "#F0D78A";

  // Web-only texts (the rest come from the Android string resources).
  var WEB = {
    tr: ["Başlat", "Ezanın sesli çalabilmesi için bir kez basın veya dokunun.", "Kapalı", "Görsel kaynakları", "Açık", "Kapalı", "Ekran koruyucu süresi", "Ayarları sıfırla", "Emin misiniz? Tekrar basın"],
    en: ["Start", "Press or tap once so the adhan can play with sound.", "Off", "Image credits", "On", "Off", "Screensaver after", "Reset settings", "Are you sure? Press again"],
    de: ["Starten", "Einmal mit der Fernbedienung drücken, damit der Adhan abgespielt werden kann.", "Aus", "Bildnachweise", "An", "Aus", "Bildschirmschoner nach", "Einstellungen zurücksetzen", "Sicher? Nochmals drücken"],
    ar: ["ابدأ", "اضغط مرة واحدة بجهاز التحكم ليتمكن الأذان من العمل.", "إيقاف", "مصادر الصور", "تشغيل", "إيقاف", "شاشة التوقف بعد", "إعادة ضبط الإعدادات", "هل أنت متأكد؟ اضغط مرة أخرى"],
    fa: ["شروع", "یک بار با کنترل فشار دهید تا اذان پخش شود.", "خاموش", "منابع تصاویر", "روشن", "خاموش", "محافظ صفحه پس از", "بازنشانی تنظیمات", "مطمئن هستید؟ دوباره فشار دهید"],
    id: ["Mulai", "Tekan sekali dengan remote agar azan dapat diputar.", "Mati", "Sumber gambar", "Aktif", "Mati", "Screensaver setelah", "Atur ulang pengaturan", "Yakin? Tekan sekali lagi"],
    ms: ["Mula", "Tekan sekali dengan alat kawalan jauh supaya azan boleh dimainkan.", "Dimatikan", "Sumber gambar", "Hidup", "Mati", "Penyelamat skrin selepas", "Set semula tetapan", "Pasti? Tekan sekali lagi"],
    zh: ["开始", "请用遥控器按一次，以便播放宣礼。", "关闭", "图片来源", "开", "关", "屏保启动时间", "重置设置", "确定吗？请再按一次"],
    ur: ["شروع کریں", "ریموٹ سے ایک بار دبائیں تاکہ اذان چل سکے۔", "بند", "تصاویر کے ماخذ", "آن", "آف", "اسکرین سیور کے بعد", "ترتیبات دوبارہ ترتیب دیں", "کیا آپ کو یقین ہے؟ دوبارہ دبائیں"],
    hi: ["शुरू करें", "अज़ान चलने के लिए रिमोट से एक बार दबाएँ।", "बंद", "चित्र स्रोत", "चालू", "बंद", "स्क्रीनसेवर इसके बाद", "सेटिंग्स रीसेट करें", "क्या आप निश्चित हैं? फिर से दबाएँ"]
  };
  var W_START = 0, W_HINT = 1, W_ADHAN_OFF = 2, W_CREDITS = 3, W_ON = 4, W_OFF = 5, W_SAVER_AFTER = 6, W_RESET = 7, W_RESET_SURE = 8;

  // ------------------------------------------------------------------ helpers
  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function load(key, fallback) {
    try { var v = window.localStorage.getItem("mihrap_" + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { window.localStorage.setItem("mihrap_" + key, JSON.stringify(value)); } catch (e) { }
  }
  function getJson(url, ok, fail) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 20000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var parsed;
        try { parsed = JSON.parse(xhr.responseText); } catch (e) { if (fail) fail(e); return; }
        ok(parsed);
      } else if (fail) {
        fail(new Error("HTTP " + xhr.status));
      }
    };
    xhr.ontimeout = function () { if (fail) fail(new Error("timeout")); };
    xhr.send();
  }
  // Android format strings: %1$s, %2$d, %s, %d.
  function format(template, a, b) {
    return String(template).replace(/%1\$[sd]/, a).replace(/%2\$[sd]/, b === undefined ? "" : b).replace(/%[sd]/, a);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function upper(s) { try { return s.toLocaleUpperCase(settings.lang); } catch (e) { return s.toUpperCase(); } }

  // ------------------------------------------------------------------ settings
  function defaultLanguage() {
    var nav = String(navigator.language || navigator.userLanguage || "tr").toLowerCase().substring(0, 2);
    if (nav === "in") nav = "id";
    return LANGS.indexOf(nav) >= 0 ? nav : "tr";
  }
  var settings = load("settings", null) || {};
  var DEFAULTS = { lang: defaultLanguage(), countryId: "", countryName: "", cityId: "", cityName: "", districtId: "", districtName: "",
    azan: "turkey", dua: true, calc: "diyanet", asr: "standard", idle: 30, slide: 20, mihrapTr: true, theme: 0, reminder: true,
    tesbihat: false, tesbihatDelay: 15, tesbihatSet: 1, saverLangs: [] };
  for (var dk in DEFAULTS) if (DEFAULTS.hasOwnProperty(dk) && settings[dk] === undefined) settings[dk] = DEFAULTS[dk];

  function S(key) {
    var table = DATA.strings[settings.lang] || DATA.strings.en;
    var v = table[key];
    return v === undefined ? (DATA.strings.en[key] || "") : v;
  }
  function Wt(i) { return (WEB[settings.lang] || WEB.en)[i]; }
  function preset() { return PRESETS[settings.theme] || PRESETS[0]; }
  // On Friday Dhuhr is the Friday prayer everywhere on the home screen.
  function prayerName(key, day) {
    if (key === "Ogle" && day && day.getDay() === 5) return S("prayer_cuma");
    return S("prayer_" + key);
  }

  // ------------------------------------------------------------------ stage scaling
  function fitStage() {
    var stage = $("stage");
    var frame = $("frame");
    var w = (frame && frame.clientWidth) || window.innerWidth || document.documentElement.clientWidth;
    var h = (frame && frame.clientHeight) || window.innerHeight || document.documentElement.clientHeight;
    var scale = Math.min(w / W, h / H);
    var left = Math.round((w - W * scale) / 2), top = Math.round((h - H * scale) / 2);
    var t = "translate(" + left + "px," + top + "px) scale(" + scale + ")";
    stage.style.webkitTransform = t;
    stage.style.transform = t;
  }

  // ------------------------------------------------------------------ prayer times (PrayerApi)
  var rows = load("times_rows", []);
  var rowsDistrict = load("times_district", "");
  var rowsFetchedAt = load("times_fetched", 0);
  var fetching = false;
  var fetchError = false;

  function dateKey(d) { return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function convertRange(data) {
    var out = [];
    for (var i = 0; data && i < data.length; ++i) {
      var s = data[i];
      if (!s || !s.date || !s.times) continue;
      var p = String(s.date).substring(0, 10).split("-");
      if (p.length !== 3) continue;
      var t = s.times;
      var row = { MiladiTarihKisa: p[2] + "." + p[1] + "." + p[0], Imsak: t.imsak || "", Gunes: t.gunes || "", Ogle: t.ogle || "",
        Ikindi: t.ikindi || "", Aksam: t.aksam || "", Yatsi: t.yatsi || "" };
      var hj = s.hijri_date;
      if (hj) {
        row.HicriTarihUzun = hj.full_date || "";
        if (hj.day > 0 && hj.month > 0) row.HicriTarihKisa = hj.day + "." + hj.month + "." + hj.year;
      }
      out.push(row);
    }
    return out;
  }

  function fetchTimes(done) {
    var district = settings.districtId;
    if (!district || fetching) return;
    fetching = true;
    var start = new Date(), end = new Date();
    end.setDate(end.getDate() + TIMES_DAYS - 1);
    store("times_attempt", Date.now());
    var finish = function (list) {
      fetching = false;
      if (list && list.length) {
        // TimesCache: merge by date with what is kept, drop days before yesterday.
        rows = mergeRows(rowsDistrict === district ? rows : [], list);
        rowsDistrict = district; rowsFetchedAt = Date.now(); fetchError = false;
        store("times_rows", rows); store("times_district", district); store("times_fetched", rowsFetchedAt);
      } else {
        fetchError = true;
      }
      computedCache.key = "";
      if (done) done();
      tick(true);
    };
    var fallback = function () {
      getJson("https://ezanvakti.emushaf.net/vakitler/" + encodeURIComponent(district), function (list) { finish(list); }, function () { finish(null); });
    };
    getJson("https://ezanvakti.imsakiyem.com/api/prayer-times/" + encodeURIComponent(district) + "/range?startDate=" + iso(start) +
      "&endDate=" + iso(end) + "&limit=100", function (resp) {
        var list = convertRange(resp && resp.data);
        if (list.length >= 30) finish(list); else fallback();
      }, fallback);
  }

  // TimesSync: keep a rolling window of 90 days from today, as the tablets do.
  var TIMES_DAYS = 90;
  function rowTime(row) {
    var p = String(row && row.MiladiTarihKisa || "").split(".");
    return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : NaN;
  }
  function mergeRows(existing, incoming) {
    var byDate = {}, i;
    for (i = 0; i < existing.length; ++i) if (existing[i] && existing[i].MiladiTarihKisa) byDate[existing[i].MiladiTarihKisa] = existing[i];
    for (i = 0; i < incoming.length; ++i) if (incoming[i] && incoming[i].MiladiTarihKisa) byDate[incoming[i].MiladiTarihKisa] = incoming[i];
    var now = new Date(), from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    var out = [];
    for (var k in byDate) if (byDate.hasOwnProperty(k) && rowTime(byDate[k]) >= from) out.push(byDate[k]);
    out.sort(function (a, b) { return rowTime(a) - rowTime(b); });
    return out;
  }
  function forwardDays() {
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), n = 0;
    for (var i = 0; i < rows.length; ++i) if (rowTime(rows[i]) >= today) n++;
    return n;
  }
  function needsFetch(ignoreWait) {
    if (!settings.districtId) return false;
    if (rowsDistrict !== settings.districtId || !rows.length) return true;
    if (forwardDays() >= TIMES_DAYS) return false;
    // Fewer than 90 days left: top up, at most every six hours (the fallback source gives only a month).
    return ignoreWait || Date.now() - load("times_attempt", 0) > 6 * 3600000;
  }

  // Adhan, dua, reminder and tesbihat recordings kept on the device so the adhan plays offline
  // (the tablets download them the same way); sw.js serves them, with byte ranges.
  var AUDIO_CACHE = "mihrap-audio-v1";
  var cachingAudio = false;
  function wantedAudio() {
    var list = [DATA.audio.dua], k;
    if (settings.azan !== "off" && DATA.audio[settings.azan]) {
      for (k in DATA.audio[settings.azan]) if (DATA.audio[settings.azan].hasOwnProperty(k)) list = list.concat(DATA.audio[settings.azan][k]);
    }
    if (DATA.audio.alert[settings.lang] || DATA.audio.alert.en) list.push(DATA.audio.alert[settings.lang] || DATA.audio.alert.en);
    var set = settings.tesbihatSet === 2 ? 2 : 1;
    list.push(DATA.audio.tesbihat["ismi_azam_" + set], DATA.audio.tesbihat["tercumani_ismi_azam_" + set]);
    return list;
  }
  // iPhone / iPad / Mac Safari: WebKit stops (and may crash the page) when a service worker
  // answers audio byte ranges, so there the recordings stream from the site (sw.js skips them too).
  var APPLE_WEBKIT = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent));
  function cacheAudio() {
    if (APPLE_WEBKIT) {
      if (window.caches) try { caches["delete"](AUDIO_CACHE).then(function () { }, function () { }); } catch (e) { }
      return;
    }
    if (cachingAudio || !window.caches || !window.fetch || navigator.onLine === false) return;
    cachingAudio = true;
    var wanted = wantedAudio(), wantedAbs = {};
    for (var i = 0; i < wanted.length; ++i) wantedAbs[new URL(wanted[i], location.href).href] = true;
    caches.open(AUDIO_CACHE).then(function (cache) {
      return cache.keys().then(function (keys) {
        // Recordings of another adhan set or language are removed to save space.
        var drops = [];
        for (var j = 0; j < keys.length; ++j) if (!wantedAbs[keys[j].url]) drops.push(cache.delete(keys[j]));
        return Promise.all(drops);
      }).then(function () {
        var chain = Promise.resolve();
        wanted.forEach(function (url) {
          chain = chain.then(function () {
            return cache.match(url).then(function (hit) {
              if (hit) return;
              return fetch(url).then(function (r) { if (r.ok && r.status === 200) return cache.put(url, r); });
            });
          });
        });
        return chain;
      });
    }).then(function () { cachingAudio = false; }, function () { cachingAudio = false; });
  }

  // ------------------------------------------------------------------ computed times (CalculatedTimes)
  // {fajr angle, isha angle or -minutes after maghrib, maghrib angle or 0 for sunset, options}.
  // Options: minute adjustments (sunrise, dhuhr, asr, maghrib; dhuhr defaults to +1) and moon = the
  // Moonsighting Committee's seasonal Fajr/Isha limits. Values as published by each authority
  // (and as used by the adhan / aladhan libraries).
  var METHODS = { mwl: [18.0, 17.0, 0.0], isna: [15.0, 15.0, 0.0], egypt: [19.5, 17.5, 0.0], makkah: [18.5, -90.0, 0.0],
    karachi: [18.0, 18.0, 0.0], tehran: [17.7, 14.0, 4.5],
    jakim: [20.0, 18.0, 0.0], kemenag: [20.0, 18.0, 0.0], muis: [20.0, 18.0, 0.0], uoif: [12.0, 12.0, 0.0],
    kuwait: [18.0, 17.5, 0.0], qatar: [18.0, -90.0, 0.0],
    dubai: [18.2, 18.2, 0.0, { sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3 }],
    moonsighting: [18.0, 18.0, 0.0, { dhuhr: 5, maghrib: 3, moon: true }] };
  var CALC_ORDER = ["diyanet", "mwl", "isna", "egypt", "makkah", "karachi", "tehran", "jakim", "kemenag", "muis", "uoif",
    "kuwait", "qatar", "dubai", "moonsighting"];
  // Names of the methods the Android strings do not have (Turkish; English elsewhere).
  var CALC_NAMES = {
    tr: { jakim: "JAKIM (Malezya)", kemenag: "Kemenag (Endonezya)", muis: "MUIS (Singapur)", uoif: "UOIF (Fransa)", kuwait: "Kuveyt",
      qatar: "Katar", dubai: "Dubai", moonsighting: "Moonsighting Committee" },
    en: { jakim: "JAKIM (Malaysia)", kemenag: "Kemenag (Indonesia)", muis: "MUIS (Singapore)", uoif: "UOIF (France)", kuwait: "Kuwait",
      qatar: "Qatar", dubai: "Dubai", moonsighting: "Moonsighting Committee" }
  };
  function calcName(id) {
    var own = S("calc_" + id);
    if (own) return own;
    return (CALC_NAMES[settings.lang] || CALC_NAMES.en)[id] || id;
  }
  var computedCache = { key: "", rows: null };
  var geocoding = false;

  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function sinD(d) { return Math.sin(rad(d)); }
  function cosD(d) { return Math.cos(rad(d)); }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }
  function sun(jd) {
    var d = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * d, 360);
    var q = fix(280.459 + 0.98564736 * d, 360);
    var l = fix(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g), 360);
    var e = 23.439 - 0.00000036 * d;
    var ra = fix(deg(Math.atan2(cosD(e) * sinD(l), cosD(l))) / 15.0, 24);
    return [deg(Math.asin(sinD(e) * sinD(l))), q / 15.0 - ra];
  }
  function midDay(jd, t) { return fix(12 - sun(jd + t)[1], 24); }
  function angleTime(jd, lat, angle, t, beforeNoon) {
    var decl = sun(jd + t)[0], noon = midDay(jd, t);
    var cosH = (-sinD(angle) - sinD(decl) * sinD(lat)) / (cosD(decl) * cosD(lat));
    if (cosH < -1 || cosH > 1) return NaN;
    var h = deg(Math.acos(cosH)) / 15.0;
    return noon + (beforeNoon ? -h : h);
  }
  function asrTime(jd, lat, factor, t) {
    var decl = sun(jd + t)[0];
    var angle = -deg(Math.atan(1.0 / (factor + Math.tan(rad(Math.abs(lat - decl))))));
    return angleTime(jd, lat, angle, t, false);
  }
  function sunTimes(jd, lat, g, m, asrFactor) {
    var sunset = angleTime(jd, lat, 0.833, g[4] / 24, false);
    var maghrib = m[2] > 0 ? angleTime(jd, lat, m[2], g[5] / 24, false) : sunset;
    return [angleTime(jd, lat, m[0], g[0] / 24, true), angleTime(jd, lat, 0.833, g[1] / 24, true), midDay(jd, g[2] / 24),
      asrTime(jd, lat, asrFactor, g[3] / 24), sunset, maghrib, m[1] > 0 ? angleTime(jd, lat, m[1], g[6] / 24, false) : maghrib];
  }
  function hm(hours) {
    if (isNaN(hours)) return "--:--";
    var minutes = Math.round(hours * 60);
    minutes = ((minutes % 1440) + 1440) % 1440;
    return pad(Math.floor(minutes / 60)) + ":" + pad(minutes % 60);
  }
  function compute(y, mo, d, lat, lon, tz, m, asrFactor) {
    var jd = julian(y, mo, d) - lon / (15.0 * 24.0);
    var guess = [5, 6, 12, 13, 18, 18, 18];
    var t = sunTimes(jd, lat, guess, m, asrFactor);
    var refined = [];
    for (var i = 0; i < t.length; ++i) refined.push(isNaN(t[i]) ? guess[i] : t[i]);
    t = sunTimes(jd, lat, refined, m, asrFactor);
    for (i = 0; i < t.length; ++i) t[i] += tz - lon / 15.0;
    var fajr = t[0], sunrise = t[1], dhuhr = t[2], asr = t[3], sunset = t[4], maghrib = t[5], isha = t[6];
    var o = m[3] || {};
    if (m[1] < 0) isha = maghrib - m[1] / 60.0;
    var night = 24.0 - (sunset - sunrise);
    if (o.moon) {
      // Moonsighting Committee: Fajr no earlier and Isha no later than the seasonal limits; above 55°
      // a seventh of the night.
      var doy = dayOfYear(y, mo, d);
      if (Math.abs(lat) >= 55) {
        fajr = sunrise - night / 7;
        isha = sunset + night / 7;
      } else {
        var safeFajr = sunrise - seasonalMinutes(lat, doy, y, true) / 60;
        var safeIsha = sunset + seasonalMinutes(lat, doy, y, false) / 60;
        if (isNaN(fajr) || safeFajr > fajr) fajr = safeFajr;
        if (isNaN(isha) || safeIsha < isha) isha = safeIsha;
      }
    } else {
      var fajrPortion = m[0] / 60.0 * night;
      if (isNaN(fajr) || sunrise - fajr > fajrPortion) fajr = sunrise - fajrPortion;
      if (m[1] > 0) {
        var ishaPortion = m[1] / 60.0 * night;
        if (isNaN(isha) || isha - sunset > ishaPortion) isha = sunset + ishaPortion;
      }
    }
    dhuhr += (o.dhuhr !== undefined ? o.dhuhr : 1) / 60.0;
    sunrise += (o.sunrise || 0) / 60.0;
    asr += (o.asr || 0) / 60.0;
    maghrib += (o.maghrib || 0) / 60.0;
    return [hm(fajr), hm(sunrise), hm(dhuhr), hm(asr), hm(maghrib), hm(isha)];
  }
  function dayOfYear(y, mo, d) {
    return Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  }
  // Khalid Shaukat's seasonal twilight (minutes before sunrise / after sunset), general shafaq.
  function seasonalMinutes(lat, doy, year, morning) {
    var l = Math.abs(lat);
    var a, b, c, dd;
    if (morning) { a = 75 + 28.65 / 55 * l; b = 75 + 19.44 / 55 * l; c = 75 + 32.74 / 55 * l; dd = 75 + 48.10 / 55 * l; }
    else { a = 75 + 25.60 / 55 * l; b = 75 + 2.050 / 55 * l; c = 75 - 9.21 / 55 * l; dd = 75 + 6.14 / 55 * l; }
    var leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    var daysInYear = leap ? 366 : 365;
    var dyy;
    if (lat >= 0) { dyy = doy + 10; if (dyy >= daysInYear) dyy -= daysInYear; }
    else { dyy = doy - (leap ? 173 : 172); if (dyy < 0) dyy += daysInYear; }
    if (dyy < 91) return a + (b - a) / 91 * dyy;
    if (dyy < 137) return b + (c - b) / 46 * (dyy - 91);
    if (dyy < 183) return c + (dd - c) / 46 * (dyy - 137);
    if (dyy < 229) return dd + (c - dd) / 46 * (dyy - 183);
    if (dyy < 275) return c + (b - c) / 46 * (dyy - 229);
    return b + (a - b) / 91 * (dyy - 275);
  }
  function coordinates() { return settings.districtId ? load("coords_" + settings.districtId, null) : null; }

  function ensureCoordinates() {
    if (!METHODS[settings.calc] || !settings.districtId || coordinates() || geocoding) return;
    geocoding = true;
    var district = settings.districtId;
    var join = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; ++i) if (arguments[i] && String(arguments[i]).trim()) parts.push(String(arguments[i]).trim());
      return parts.join(", ");
    };
    var queries = [join(settings.districtName, settings.cityName, settings.countryName), join(settings.districtName, settings.countryName),
      join(settings.cityName, settings.countryName)];
    var next = function (i) {
      if (i >= queries.length || district !== settings.districtId) { geocoding = false; return; }
      if (!queries[i]) { next(i + 1); return; }
      getJson("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(queries[i]), function (list) {
        if (list && list.length) {
          store("coords_" + district, [parseFloat(list[0].lat), parseFloat(list[0].lon)]);
          geocoding = false;
          computedCache.key = "";
          tick(true);
        } else {
          setTimeout(function () { next(i + 1); }, 1100); // Nominatim allows one request per second
        }
      }, function () { setTimeout(function () { next(i + 1); }, 1100); });
    };
    next(0);
  }

  // The rows to show: Diyanet's, or the same rows with computed times.
  function shownRows() {
    var m = METHODS[settings.calc];
    var c = coordinates();
    if (!m || !c || !rows.length) return rows;
    var key = settings.calc + "|" + settings.asr + "|" + c.join(",") + "|" + rowsFetchedAt;
    if (computedCache.key === key) return computedCache.rows;
    var factor = settings.asr === "hanafi" ? 2.0 : 1.0;
    var out = [];
    for (var i = 0; i < rows.length; ++i) {
      var row = clone(rows[i]);
      var dmy = String(row.MiladiTarihKisa || "").split(".");
      if (dmy.length === 3) {
        var day = +dmy[0], month = +dmy[1], year = +dmy[2];
        var tz = -new Date(year, month - 1, day, 12, 0).getTimezoneOffset() / 60;
        var t = compute(year, month, day, c[0], c[1], tz, m, factor);
        for (var k = 0; k < KEYS.length; ++k) row[KEYS[k]] = t[k];
      }
      out.push(row);
    }
    computedCache = { key: key, rows: out };
    return out;
  }

  function rowFor(day) {
    var key = dateKey(day), list = shownRows();
    for (var i = 0; i < list.length; ++i) if (list[i].MiladiTarihKisa === key) return list[i];
    return null;
  }
  function at(row, key, day) {
    var v = String(row && row[key] || "");
    var p = v.split(":");
    if (p.length < 2) return null;
    var d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), +p[0], +p[1], 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  function findNext(now) {
    for (var offset = 0; offset < 2; ++offset) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      var row = rowFor(day);
      if (!row) continue;
      for (var i = 0; i < KEYS.length; ++i) {
        var when = at(row, KEYS[i], day);
        if (when && when.getTime() > now.getTime()) return { key: KEYS[i], when: when };
      }
    }
    return null;
  }
  // The latest prayer whose time has begun. Sunrise is a time marker, not an adhan.
  function activeKey(row, now) {
    if (!row) return "";
    var current = "";
    for (var i = 0; i < KEYS.length; ++i) {
      if (KEYS[i] === "Gunes") continue;
      var when = at(row, KEYS[i], now);
      if (when && when.getTime() <= now.getTime()) current = KEYS[i];
    }
    return current || "Yatsi"; // after midnight and before Imsak it is still the night's Yatsi
  }
  function remainingHms(target, now) {
    var sec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    return pad(Math.floor(sec / 3600)) + ":" + pad(Math.floor((sec % 3600) / 60)) + ":" + pad(sec % 60);
  }

  // ------------------------------------------------------------------ Hijri (HijriDays)
  var HIJRI = {
    tr: ["Muharrem", "Safer", "Rebiülevvel", "Rebiülâhir", "Cemâziyelevvel", "Cemâziyelâhir", "Recep", "Şâban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"],
    en: ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Akhir", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"],
    de: ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Achir", "Dschumada al-Ula", "Dschumada al-Achira", "Radschab", "Schaban", "Ramadan", "Schawwal", "Dhu l-Qa'da", "Dhu l-Hiddscha"],
    ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
    fa: ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"],
    id: ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Syakban", "Ramadan", "Syawal", "Zulkaidah", "Zulhijah"],
    ms: ["Muharam", "Safar", "Rabiulawal", "Rabiulakhir", "Jamadilawal", "Jamadilakhir", "Rejab", "Syaaban", "Ramadan", "Syawal", "Zulkaedah", "Zulhijah"],
    zh: ["穆哈兰姆月", "色法尔月", "赖比尔·敖外鲁月", "赖比尔·阿色尼月", "主马达·敖外鲁月", "主马达·阿色尼月", "赖哲卜月", "舍尔邦月", "莱麦丹月", "闪瓦鲁月", "都尔喀尔德月", "都尔黑哲月"],
    ur: ["محرم", "صفر", "ربیع الاول", "ربیع الثانی", "جمادی الاول", "جمادی الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذوالقعدہ", "ذوالحجہ"],
    hi: ["मुहर्रम", "सफ़र", "रबीउल अव्वल", "रबीउस्सानी", "जुमादल ऊला", "जुमादस्सानी", "रजब", "शाबान", "रमज़ान", "शव्वाल", "ज़िलक़ादा", "ज़िलहिज्जा"]
  };
  var HIJRI_SUFFIX = { tr: "", en: " AH", de: " AH", ar: " هـ", fa: " ق", id: " H", ms: " H", zh: "", ur: " ھ", hi: " हि." };
  var MONTH_KEYS = ["muharrem", "safer", "rebiulevvel", "rebiulahir", "cemaziyelevvel", "cemaziyelahir", "recep", "saban", "ramazan", "sevval", "zilkade", "zilhicce"];
  // tr, en, de, ar, fa, id, ms, zh, ur, hi
  var EVENTS = {
    regaib: ["Bu gece Regaib Kandili", "Tonight is Laylat al-Raghaib", "Heute Nacht ist Regaib-Nacht", "الليلة ليلة الرغائب", "امشب لیلة الرغائب", "Malam ini Malam Raghaib", "Malam ini Malam Raghaib", "今夜是赖嘎伊布夜", "آج رات لیلۃ الرغائب ہے", "आज रात लैलतुर रग़ाइब है"],
    arefe_ramazan: ["Ramazan Bayramı Arefesi", "Eve of Eid al-Fitr", "Vorabend des Ramadanfestes", "وقفة عيد الفطر", "روز پیش از عید فطر", "Sehari menjelang Idulfitri", "Sehari sebelum Aidilfitri", "开斋节前一天", "عید الفطر سے پہلے کا دن", "ईदुल फ़ित्र से पहले का दिन"],
    new_year: ["Hicrî Yılbaşı", "Islamic New Year", "Islamisches Neujahr", "رأس السنة الهجرية", "آغاز سال نو هجری قمری", "Tahun Baru Islam", "Awal Muharam", "伊斯兰新年", "اسلامی نیا سال", "इस्लामी नव वर्ष"],
    asure: ["Aşure Günü", "Day of Ashura", "Aschura-Tag", "يوم عاشوراء", "روز عاشورا", "Hari Asyura", "Hari Asyura", "阿舒拉日", "یوم عاشور", "आशूरा का दिन"],
    mevlid: ["Bu gece Mevlid Kandili", "Tonight is Mawlid al-Nabi", "Heute Nacht ist Mevlid-Nacht", "الليلة ليلة المولد النبوي", "امشب شب میلاد پیامبر", "Malam ini Maulid Nabi", "Malam ini Maulidur Rasul", "今夜是圣纪之夜", "آج رات میلاد النبی کی رات ہے", "आज रात मीलादुन्नबी की रात है"],
    three_months: ["Üç Aylar başladı", "The three holy months begin", "Die drei heiligen Monate beginnen", "بداية الأشهر الثلاثة", "آغاز ماه‌های سه‌گانه", "Awal tiga bulan mulia", "Permulaan tiga bulan mulia", "三个吉庆月开始", "تین مقدس مہینوں کا آغاز", "तीन पवित्र महीनों का आरंभ"],
    mirac: ["Bu gece Miraç Kandili", "Tonight is Laylat al-Mi'raj", "Heute Nacht ist Miradsch-Nacht", "الليلة ليلة الإسراء والمعراج", "امشب شب معراج", "Malam ini Isra Mikraj", "Malam ini Israk dan Mikraj", "今夜是登霄夜", "آج رات شب معراج ہے", "आज रात शबे मेराज है"],
    berat: ["Bu gece Berat Kandili", "Tonight is Laylat al-Bara'ah", "Heute Nacht ist Berat-Nacht", "الليلة ليلة البراءة", "امشب شب برات", "Malam ini Nisfu Syakban", "Malam ini Nisfu Syaaban", "今夜是拜拉特夜", "آج رات شب برات ہے", "आज रात शबे बरात है"],
    kadir: ["Bu gece Kadir Gecesi", "Tonight is Laylat al-Qadr", "Heute Nacht ist Lailat al-Qadr", "الليلة ليلة القدر", "امشب شب قدر", "Malam ini Lailatul Qadar", "Malam ini Lailatulqadar", "今夜是盖德尔夜", "آج رات شب قدر ہے", "आज रात शबे क़द्र है"],
    ramazan_bayram: ["Ramazan Bayramı", "Eid al-Fitr", "Ramadanfest", "عيد الفطر", "عید فطر", "Idulfitri", "Aidilfitri", "开斋节", "عید الفطر", "ईदुल फ़ित्र"],
    arefe_kurban: ["Kurban Bayramı Arefesi", "Day of Arafah", "Tag von Arafat", "يوم عرفة", "روز عرفه", "Hari Arafah", "Hari Arafah", "阿拉法特日", "یوم عرفہ", "अरफ़ा का दिन"],
    kurban_bayram: ["Kurban Bayramı", "Eid al-Adha", "Opferfest", "عيد الأضحى", "عید قربان", "Iduladha", "Aidiladha", "宰牲节", "عید الاضحی", "ईदुल अज़हा"]
  };

  function stripMarks(s) {
    if (s.normalize) return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[ûÛüÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g").replace(/[öÖ]/g, "o").replace(/İ/g, "I");
  }
  function hijriParts(row) {
    if (!row) return null;
    var p = String(row.HicriTarihKisa || "").split(".");
    if (p.length === 3) {
      var out = [parseInt(p[0], 10), parseInt(p[1], 10), parseInt(p[2], 10)];
      if (out[1] >= 1 && out[1] <= 12 && !isNaN(out[0]) && !isNaN(out[2])) return out;
    }
    var words = String(row.HicriTarihUzun || "").trim().split(/\s+/);
    if (words.length !== 3) return null;
    var month = stripMarks(words[1]).toLowerCase().replace(/ı/g, "i");
    var idx = MONTH_KEYS.indexOf(month);
    if (idx < 0) return null;
    return [parseInt(words[0], 10), idx + 1, parseInt(words[2], 10)];
  }
  function hijriText(h) {
    if (!h) return "";
    var lang = HIJRI[settings.lang] ? settings.lang : "en";
    var month = HIJRI[lang][h[1] - 1];
    if (lang === "zh") return "伊历" + h[2] + "年" + month + h[0] + "日";
    return h[0] + " " + month + " " + h[2] + HIJRI_SUFFIX[lang];
  }
  function eventText(key) {
    var i = LANGS.indexOf(settings.lang);
    return EVENTS[key][i < 0 ? 1 : i];
  }
  function dayOf(feast, day) {
    var l = settings.lang;
    if (l === "tr") return feast + " (" + day + ". gün)";
    if (l === "de") return feast + " (" + day + ". Tag)";
    if (l === "ar") return feast + " (اليوم " + day + ")";
    if (l === "fa") return feast + " (روز " + day + ")";
    if (l === "ur") return feast + " (دن " + day + ")";
    if (l === "id" || l === "ms") return feast + " (hari ke-" + day + ")";
    if (l === "zh") return feast + "（第" + day + "天）";
    if (l === "hi") return feast + " (दिन " + day + ")";
    return feast + " (day " + day + ")";
  }
  function eventFor(now) {
    var today = hijriParts(rowFor(now));
    if (!today) return "";
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var tomorrow = hijriParts(rowFor(next));
    var d = today[0], m = today[1];
    if (tomorrow && tomorrow[1] === 7 && tomorrow[0] <= 7 && next.getDay() === 5) return eventText("regaib");
    if (tomorrow && tomorrow[1] === 10 && tomorrow[0] === 1) return eventText("arefe_ramazan");
    if (m === 1 && d === 1) return eventText("new_year");
    if (m === 1 && d === 10) return eventText("asure");
    if (m === 3 && d === 11) return eventText("mevlid");
    if (m === 7 && d === 1) return eventText("three_months");
    if (m === 7 && d === 26) return eventText("mirac");
    if (m === 8 && d === 14) return eventText("berat");
    if (m === 9 && d === 26) return eventText("kadir");
    if (m === 10 && d >= 1 && d <= 3) return dayOf(eventText("ramazan_bayram"), d);
    if (m === 12 && d === 9) return eventText("arefe_kurban");
    if (m === 12 && d >= 10 && d <= 13) return dayOf(eventText("kurban_bayram"), d - 9);
    return "";
  }
  // "Day N of Ramadan · Iftar in hh:mm:ss" during the fast, "Imsak in" from sunset until the next fast.
  function ramadanLine(now) {
    var todayRow = rowFor(now);
    var today = hijriParts(todayRow);
    var nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var tomorrowRow = rowFor(nextDay);
    var fastingToday = !!(today && today[1] === 9);
    var tomorrowParts = hijriParts(tomorrowRow);
    var fastingTomorrow = !!(tomorrowParts && tomorrowParts[1] === 9);
    if (!fastingToday && !fastingTomorrow) return "";
    var imsak = at(todayRow, "Imsak", now), iftar = at(todayRow, "Aksam", now);
    if (!imsak || !iftar) return "";
    var head = fastingToday ? format(S("ramadan_day"), today[0]) : S("ramadan_eve");
    if (fastingToday && now < imsak) return head + "  ·  " + format(S("imsak_in"), remainingHms(imsak, now));
    if (fastingToday && now < iftar) return head + "  ·  " + format(S("iftar_in"), remainingHms(iftar, now));
    if (fastingTomorrow && tomorrowRow) {
      var nextImsak = at(tomorrowRow, "Imsak", nextDay);
      if (nextImsak) return head + "  ·  " + format(S("imsak_in"), remainingHms(nextImsak, now));
    }
    return fastingToday ? head : "";
  }
  var KERAHAT_MS = 45 * 60 * 1000;
  function kerahatLine(row, now) {
    var sunrise = at(row, "Gunes", now), dhuhr = at(row, "Ogle", now), sunset = at(row, "Aksam", now);
    if (!sunrise || !dhuhr || !sunset) return "";
    var t = now.getTime(), end = 0;
    if (t >= sunrise.getTime() && t < sunrise.getTime() + KERAHAT_MS) end = sunrise.getTime() + KERAHAT_MS;
    else if (t >= dhuhr.getTime() - KERAHAT_MS && t < dhuhr.getTime()) end = dhuhr.getTime();
    else if (t >= sunset.getTime() - KERAHAT_MS && t < sunset.getTime()) end = sunset.getTime();
    if (!end) return "";
    var e = new Date(end);
    return format(S("kerahat_until"), pad(e.getHours()) + ":" + pad(e.getMinutes()));
  }
  // MainActivity.dateLine: the civil date and the Hijri date, then the blessed day (gold) and kerahat (red).
  function dateLines(now, civil) {
    var hijri = hijriText(hijriParts(rowFor(now)));
    var out = [{ text: hijri ? civil + "  ·  " + hijri : civil }];
    var event = eventFor(now), ramadan = ramadanLine(now);
    if (ramadan) out.push({ text: ramadan, color: "#FFD27A", bold: true });
    if (event) out.push({ text: event, color: "#FFD27A", bold: true });
    var k = kerahatLine(rowFor(now), now);
    if (k) out.push({ text: k, color: "#FF9C8A", bold: true });
    return out;
  }
  function civilDash(d) { return pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear(); }

  // "EEE, dd MMM" upper-cased, as the Pano / Salon card shows it.
  var CIVIL = {
    tr: [["PAZ", "PZT", "SAL", "ÇAR", "PER", "CUM", "CMT"], ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"]],
    en: [["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]],
    de: [["SO.", "MO.", "DI.", "MI.", "DO.", "FR.", "SA."], ["JAN.", "FEB.", "MÄRZ", "APR.", "MAI", "JUNI", "JULI", "AUG.", "SEPT.", "OKT.", "NOV.", "DEZ."]]
  };
  function civilShort(d) {
    var t = CIVIL[settings.lang];
    if (!t) {
      try { return upper(d.toLocaleDateString(settings.lang, { weekday: "short", day: "2-digit", month: "short" })); } catch (e) { t = CIVIL.en; }
    }
    return t[0][d.getDay()] + ", " + pad(d.getDate()) + " " + t[1][d.getMonth()];
  }
  function dativeUntil(key, now) {
    if (key === "Ogle" && now.getDay() === 5) return S("dash_to_cuma");
    return S("dash_to_" + key);
  }

  // ------------------------------------------------------------------ canvas helpers
  function setFont(ctx, size, family, bold) { ctx.font = (bold ? "bold " : "") + (Math.round(size * 10) / 10) + "px " + family; }
  // SkyHomeView.fitText: the given size, shrunk so the text fits maxWidth.
  function fit(ctx, value, maxWidth, size, family, bold) {
    setFont(ctx, size, family, bold);
    var m = value ? ctx.measureText(value).width : 0;
    if (m > maxWidth && m > 0) { size = size * maxWidth / m; setFont(ctx, size, family, bold); }
    return size;
  }
  // Android's fake bold (thin and monospace clock faces are drawn bold): fill plus a stroke of the same colour.
  function fakeBoldText(ctx, text, x, y, size) {
    ctx.fillText(text, x, y);
    var shadow = ctx.shadowColor;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.lineWidth = size / 32;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);
    ctx.shadowColor = shadow;
  }
  function shadow(ctx, radius, dy, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 1.15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = dy;
  }
  function noShadow(ctx) { ctx.shadowColor = "rgba(0,0,0,0)"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowOffsetX = 0; }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ------------------------------------------------------------------ home state (filled once a second)
  function homeState(now) {
    var row = rowFor(now);
    var next = findNext(now);
    var s = { now: now, row: row, next: next, active: activeKey(row, now), names: [], times: [], activeIndex: -1 };
    for (var i = 0; i < KEYS.length; ++i) {
      s.names.push(prayerName(KEYS[i], now));
      s.times.push(row ? row[KEYS[i]] || "--:--" : "--:--");
      if (KEYS[i] === s.active) s.activeIndex = i;
    }
    s.nextName = next ? dativeUntil(next.key, now) : "";
    s.nextLeft = next ? remainingHms(next.when, now) : "";
    s.nextSuffix = S("time_left_suffix");
    s.sunrise = format(S("dash_sunrise"), row ? row.Gunes : "--:--");
    s.sunset = format(S("dash_sunset"), row ? row.Aksam : "--:--");
    s.phase = 2;
    s.phaseProgress = 0;
    if (row) {
      var t = now.getTime(), minute = 60000;
      var imsak = at(row, "Imsak", now), gunes = at(row, "Gunes", now), aksam = at(row, "Aksam", now), yatsi = at(row, "Yatsi", now);
      if (imsak && gunes && aksam && yatsi) {
        var dawnEnd = gunes.getTime() + 20 * minute, sunsetStart = aksam.getTime() - 45 * minute, duskStart = aksam.getTime() + 20 * minute;
        if (t < imsak.getTime() || t >= yatsi.getTime()) s.phase = 0;
        else if (t < dawnEnd) { s.phase = 1; s.phaseProgress = (t - imsak.getTime()) / Math.max(1, dawnEnd - imsak.getTime()); }
        else if (t < sunsetStart) s.phase = 2;
        else if (t < duskStart) { s.phase = 3; s.phaseProgress = (t - sunsetStart) / Math.max(1, duskStart - sunsetStart); }
        else { s.phase = 4; s.phaseProgress = (t - duskStart) / Math.max(1, yatsi.getTime() - duskStart); }
      }
    }
    return s;
  }

  // ------------------------------------------------------------------ Classic (layout 1): photo, prayer row, clock
  // ReferenceButtonDrawable, prayer chip variant 1: sloped shoulders and a shallow lower point.
  function chipPath(ctx, x, y, w, h) {
    var l = x + 1, r = x + w - 1, t = y + 1, b = y + h - 2;
    var shoulder = Math.min(w * 0.16, h * 0.24), point = Math.min(h * 0.16, w * 0.10);
    ctx.beginPath();
    ctx.moveTo(l + shoulder, t);
    ctx.lineTo(r - shoulder, t);
    ctx.lineTo(r, t + shoulder);
    ctx.lineTo(r, b - point);
    ctx.lineTo((l + r) / 2, b);
    ctx.lineTo(l, b - point);
    ctx.lineTo(l, t + shoulder);
    ctx.closePath();
  }

  // MainActivity.buildPrayerRow: six chips across the top (dimens sw720dp: 84dp high, 6dp apart, 16sp / 11sp).
  function drawPrayerRow(ctx, s, top, dash, pal) {
    var gap = 6 * DP, chipH = 84 * DP, padX = 2 * DP;
    var left = dash ? 18 * DP + padX : padX;
    var width = dash ? W - 36 * DP - 2 * padX : W - 2 * padX;
    var itemW = (width - gap * 5) / 6;
    var timeSize = 16 * DP, nameSize = 11 * DP;
    ctx.textAlign = "center";
    for (var i = 0; i < 6; ++i) {
      var hi = i === s.activeIndex;
      var x = left + i * (itemW + gap);
      if (dash) {
        roundRect(ctx, x + 0.9, top + 0.9, itemW - 1.8, chipH - 1.8, 14 * DP);
        ctx.fillStyle = hi ? pal.highlight : CHIP_IDLE;
        ctx.fill();
        ctx.lineWidth = 1.2 * DP;
        ctx.strokeStyle = hi ? pal.nextStroke : CHIP_IDLE_STROKE;
        ctx.stroke();
      } else {
        chipPath(ctx, x, top, itemW, chipH);
        ctx.fillStyle = hi ? "rgba(29,102,128,0.933)" : "rgba(22,75,104,0.867)";
        ctx.fill();
        ctx.lineWidth = 2 * DP;
        ctx.strokeStyle = hi ? "#FFD75A" : "#87C7D6";
        ctx.stroke();
      }
      var cx = x + itemW / 2;
      var y = top + 6 * DP;
      if (!dash) {
        roundRect(ctx, cx - 11 * DP, y, 22 * DP, 2.5 * DP, 2 * DP);
        ctx.fillStyle = hi ? "#F0D88A" : "#E8C56A";
        ctx.fill();
        y += 2.5 * DP + 4 * DP;
      }
      var regular = dash ? "#2C2418" : "#FFFFFF";
      ctx.fillStyle = hi ? (dash ? pal.highlightText : "#FFD75A") : regular;
      fit(ctx, s.times[i], itemW - 8 * DP, timeSize, SANS, true);
      ctx.fillText(s.times[i], cx, y + 1.056 * timeSize);
      y += 1.327 * timeSize + 2 * DP;
      ctx.fillStyle = hi ? (dash ? pal.highlightText : "#FFF8D0") : regular;
      fit(ctx, upper(s.names[i]), itemW - 8 * DP, nameSize, SANS, false);
      ctx.fillText(upper(s.names[i]), cx, y + 1.056 * nameSize);
    }
    return top + chipH;
  }

  function drawClassic(ctx, s) {
    var p = preset();
    var rowBottom = drawPrayerRow(ctx, s, 40 * DP, false);
    // Clock "HH:mm:ss" and the date lines, centred between the row and the bottom chrome.
    var now = s.now;
    var clock = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    var clockSize = Math.min(H * 0.20, W * 0.16);
    var dateSize = 24 * DP;
    var lines = dateLines(now, civilDash(now));
    var clockH = 1.327 * clockSize;
    var dateH = (0.128 + lines.length * 1.172 + 0.027) * dateSize;
    var block = clockH + 4 * DP + dateH;
    var bottom = H - (36 + 96) * DP;
    var top = rowBottom + (bottom - rowBottom - block) / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFE6A0";
    if (p.clock === 2) {
      shadow(ctx, 4 * DP, 1 * DP, "rgba(0,0,0,0.8)");
      setFont(ctx, clockSize, MONO, false);
    } else {
      shadow(ctx, 10 * DP, 2 * DP, "rgba(0,0,0,0.8)");
      setFont(ctx, clockSize, THIN, false);
    }
    fakeBoldText(ctx, clock, W / 2, top + 1.056 * clockSize, clockSize);
    var y = top + clockH + 4 * DP + 1.056 * dateSize;
    shadow(ctx, 6 * DP, 1 * DP, "rgba(0,0,0,0.8)");
    for (var i = 0; i < lines.length; ++i) {
      ctx.fillStyle = lines[i].color || GOLD_SOFT;
      fit(ctx, lines[i].text, W * 0.94, dateSize, SANS, !!lines[i].bold);
      ctx.fillText(lines[i].text, W / 2, y);
      y += 1.172 * dateSize;
    }
    noShadow(ctx);
    drawCorners(ctx, s, rowBottom);
  }

  // SkyHomeView in corners-only mode: the gold next-prayer disc (right) and the sunrise/sunset pill (left).
  function drawGoldDisc(ctx, x, y, r) {
    circle(ctx, x, y, r * 1.22, "rgba(232,197,106,0.333)");
    circle(ctx, x, y, r, GOLD_SOFT);
  }
  function drawDiscText(ctx, x, y, r, s, ink) {
    var suffix = !!s.nextSuffix;
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    fit(ctx, s.nextName, r * 1.5, r * 0.27, SANS, true);
    ctx.fillText(s.nextName, x, y - r * (suffix ? 0.32 : 0.2));
    fit(ctx, s.nextLeft, r * 1.62, r * 0.4, SANS, false);
    ctx.fillText(s.nextLeft, x, y + r * (suffix ? 0.16 : 0.38));
    if (suffix) {
      fit(ctx, s.nextSuffix, r * 1.3, r * 0.24, SANS, false);
      ctx.fillText(s.nextSuffix, x, y + r * 0.52);
    }
  }
  function drawPill(ctx, s, top0, cornersOnly, dark) {
    var unit = Math.min(W, H) / 100;
    var x = unit * 4, y = top0 + unit * 4, pw = W * 0.15, ph = H * 0.12;
    var ink;
    if (cornersOnly) {
      var halo = unit * 1.2;
      roundRect(ctx, x - halo, y - halo, pw + halo * 2, ph + halo * 2, (ph + halo * 2) / 2);
      ctx.fillStyle = "rgba(232,197,106,0.333)";
      ctx.fill();
      ctx.fillStyle = GOLD_SOFT;
      ink = "#5A3A08";
    } else {
      ctx.fillStyle = dark ? "rgba(43,75,208,0.2)" : "rgba(255,255,255,0.4)";
      ink = dark ? "#FFFFFF" : "#14306A";
    }
    roundRect(ctx, x, y, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    fit(ctx, s.sunrise, pw * 0.84, H * 0.034, SANS, false);
    ctx.fillText(s.sunrise, x + pw / 2, y + ph * 0.43);
    fit(ctx, s.sunset, pw * 0.84, H * 0.034, SANS, false);
    ctx.fillText(s.sunset, x + pw / 2, y + ph * 0.8);
  }
  function drawCorners(ctx, s, top0) {
    var unit = Math.min(W, H) / 100;
    var r = Math.min(W * 0.078, H * 0.12);
    var x = W - r - unit * 4, y = top0 + r + unit * 4;
    drawGoldDisc(ctx, x, y, r);
    if (s.next) drawDiscText(ctx, x, y, r, s, "#5A3A08");
    drawPill(ctx, s, top0, true, false);
  }

  // ------------------------------------------------------------------ Sky (layout 4), SkyHomeView
  var SKY = [["#070B2E", "#14207A", "#2537B8"], ["#1B2A6B", "#6A5AA8", "#F2A07B"], ["#3E8FE0", "#79B8F0", "#C9E6FA"],
    ["#2B2F6E", "#C4577A", "#F7A24B"], ["#101548", "#283A9A", "#5A4C9E"]];
  var STARS = (function () {
    // java.util.Random(7) is not reproduced; a fixed seeded sequence keeps the stars in place.
    var seed = 7, out = [];
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (var i = 0; i < 90; ++i) out.push([rnd(), rnd() * 0.62, 0.6 + rnd() * 1.6, rnd() * 6.28]);
    return out;
  })();
  var cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 700; cloudCanvas.height = 400;

  function drawSky(ctx, s) {
    var unit = Math.min(W, H) / 100;
    var dark = s.phase === 0 || s.phase === 4 || s.phase === 1;
    var colors = SKY[s.phase];
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, colors[0]); g.addColorStop(0.55, colors[1]); g.addColorStop(1, colors[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (s.phase === 0 || s.phase === 4 || (s.phase === 1 && s.phaseProgress < 0.7)) {
      var fade = s.phase === 1 ? 1 - s.phaseProgress / 0.7 : (s.phase === 4 ? 0.35 + 0.65 * s.phaseProgress : 1);
      drawStars(ctx, s.now.getTime(), fade);
    }
    drawClouds(ctx, unit, s);
    drawGrass(ctx, s);

    var discR = Math.min(W * 0.078, H * 0.12);
    var discX = W - discR - unit * 4, discY = discR + unit * 4;
    var night = s.phase === 0 || s.phase === 4;
    if (night) {
      circle(ctx, discX, discY, discR * 1.18, "rgba(201,214,255,0.2)");
      circle(ctx, discX, discY, discR, "#DCE4FA");
      circle(ctx, discX - discR * 0.45, discY - discR * 0.5, discR * 0.16, "rgba(34,48,96,0.133)");
      circle(ctx, discX + discR * 0.55, discY + discR * 0.45, discR * 0.12, "rgba(34,48,96,0.133)");
      circle(ctx, discX - discR * 0.6, discY + discR * 0.55, discR * 0.09, "rgba(34,48,96,0.133)");
    } else {
      circle(ctx, discX, discY, discR * 1.22, s.phase === 3 ? "rgba(255,154,60,0.333)" : (s.phase === 1 ? "rgba(255,192,138,0.333)" : "rgba(255,226,122,0.333)"));
      circle(ctx, discX, discY, discR, s.phase === 3 ? "#FFC56B" : "#FFE08A");
    }
    if (s.next) drawDiscText(ctx, discX, discY, discR, s, night ? "#22305E" : "#5A3A08");
    drawPill(ctx, s, 0, false, dark);

    // Large clock and the date line.
    ctx.textAlign = "center";
    ctx.fillStyle = dark ? "#E6ECFF" : "#FFFFFF";
    shadow(ctx, unit * 1.2, unit * 0.4, dark ? "rgba(0,0,0,0.4)" : "rgba(32,48,96,0.333)");
    var clock = pad(s.now.getHours()) + ":" + pad(s.now.getMinutes());
    fit(ctx, clock, W * 0.5, H * 0.27, SERIF, true);
    var clockBase = H * 0.42;
    ctx.fillText(clock, W * 0.5, clockBase);
    var date = dateLines(s.now, civilDash(s.now))[0].text;
    fit(ctx, date, W * 0.62, H * 0.045, SANS, false);
    ctx.fillText(date, W * 0.5, clockBase + H * 0.075);
    noShadow(ctx);

    // Prayer cards; the prayer whose time has begun is lifted and brighter.
    var n = s.names.length, gap = unit * 1.6;
    var cardsW = Math.min(W * 0.86, n * H * 0.24);
    var cardW = (cardsW - gap * (n - 1)) / n;
    var cardH = Math.min(H * 0.19, cardW * 0.95);
    var left = (W - cardsW) * 0.5, top = H * 0.555;
    var moon = s.phase === 0 || s.phase === 4;
    for (var i = 0; i < n; ++i) {
      var active = i === s.activeIndex;
      var x = left + i * (cardW + gap);
      var y = active ? top - unit * 1.2 : top;
      roundRect(ctx, x, y, cardW, cardH, unit * 2.2);
      ctx.fillStyle = active ? (moon ? "#DCE4FA" : (s.phase === 3 ? "#FFC56B" : "#FFE08A")) : (dark ? "rgba(53,89,216,0.6)" : "rgba(255,255,255,0.7)");
      ctx.fill();
      ctx.fillStyle = active ? (moon ? "#22305E" : "#5A3A08") : (dark ? "rgba(230,236,255,0.867)" : "#2A4580");
      fit(ctx, s.names[i], cardW * 0.86, cardH * 0.18, SANS, true);
      ctx.fillText(s.names[i], x + cardW / 2, y + cardH * 0.32);
      fit(ctx, s.times[i], cardW * 0.86, cardH * 0.34, SANS, false);
      ctx.fillText(s.times[i], x + cardW / 2, y + cardH * 0.74);
    }
  }
  function sparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath();
    ctx.fill();
  }
  function drawStars(ctx, nowMs, fade) {
    var t = (nowMs % 60000) / 1000;
    for (var i = 0; i < STARS.length; ++i) {
      var st = STARS[i];
      var twinkle = 0.55 + 0.45 * Math.sin(t * 0.9 + st[3]);
      var alpha = fade * twinkle;
      if (alpha * 255 <= 8) continue;
      ctx.fillStyle = i % 9 === 0 ? "rgba(184,243,107," + alpha.toFixed(3) + ")" : "rgba(255,255,255," + alpha.toFixed(3) + ")";
      var x = st[0] * W, y = st[1] * H, r = st[2] * H / 600;
      if (i % 7 === 0) sparkle(ctx, x, y, r * 4.5);
      else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function drawClouds(ctx, unit, s) {
    var color, outline, alpha;
    if (s.phase === 2) { color = "#FFFFFF"; outline = "#B5D3F2"; alpha = 240; }
    else if (s.phase === 3) { color = "#FFD9BC"; outline = "#E7A07A"; alpha = 225; }
    else if (s.phase === 1) { color = "#EACDE6"; outline = "#B98FBF"; alpha = 215; }
    else { color = "#2E47C9"; outline = "#1A2A9C"; alpha = 235; }
    var nowMs = s.now.getTime();
    var span = W * 1.3;
    var sail = (nowMs % 240000) / 240000 * span;
    var sailing = [[0.0, 0.08, 0.72], [0.55, 0.06, 0.6]];
    for (var i = 0; i < sailing.length; ++i) {
      var c = sailing[i];
      var cx = ((c[0] * span + sail) % span) - W * 0.15;
      drawCloud(ctx, cx, c[1] * H, unit * 8 * c[2], color, outline, alpha);
    }
    var t = (nowMs % 30000) / 30000 * 2 * Math.PI;
    var swaying = [[0.12, 0.42, 1.0, 0], [0.87, 0.46, 0.95, 2.4]];
    for (i = 0; i < swaying.length; ++i) {
      var sw = swaying[i];
      drawCloud(ctx, sw[0] * W + Math.sin(t + sw[3]) * W * 0.04, sw[1] * H, unit * 8 * sw[2], color, outline, alpha);
    }
  }
  // Cartoon cloud: three puffs on a flat base merged into one outline, faded as one on its own layer.
  function drawCloud(ctx, x, y, r, color, outline, alpha) {
    var c = cloudCanvas.getContext("2d");
    var ox = r * 2.2, oy = r * 1.3; // cloud origin inside the scratch canvas
    var cw = Math.ceil(r * 4.4), ch = Math.ceil(r * 2.6);
    if (cloudCanvas.width < cw || cloudCanvas.height < ch) { cloudCanvas.width = Math.max(cw, cloudCanvas.width); cloudCanvas.height = Math.max(ch, cloudCanvas.height); }
    c.clearRect(0, 0, cloudCanvas.width, cloudCanvas.height);
    var puffs = [[ox - r * 0.95, oy + r * 0.15, r * 0.62], [ox, oy - r * 0.15, r * 0.85], [ox + r * 1.0, oy + r * 0.2, r * 0.66]];
    var stroke = Math.max(1.5, r * 0.07);
    // Outline of the union: a doubled stroke under the fill leaves only its outer half visible.
    c.lineWidth = stroke * 2;
    c.strokeStyle = outline;
    c.lineCap = "round";
    roundRect(c, ox - r * 1.75, oy + r * 0.05, r * 3.6, r * 0.8, r * 0.4);
    c.stroke();
    for (var i = 0; i < puffs.length; ++i) { c.beginPath(); c.arc(puffs[i][0], puffs[i][1], puffs[i][2], 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = color;
    roundRect(c, ox - r * 1.75, oy + r * 0.05, r * 3.6, r * 0.8, r * 0.4);
    c.fill();
    for (i = 0; i < puffs.length; ++i) { c.beginPath(); c.arc(puffs[i][0], puffs[i][1], puffs[i][2], 0, Math.PI * 2); c.fill(); }
    // Folds: the inner edges of the side puffs.
    c.lineWidth = stroke;
    c.beginPath(); c.arc(puffs[0][0], puffs[0][1], puffs[0][2], rad(300), rad(370)); c.stroke();
    c.beginPath(); c.arc(puffs[2][0], puffs[2][1], puffs[2][2], rad(170), rad(240)); c.stroke();
    ctx.save();
    ctx.globalAlpha = alpha / 255;
    ctx.drawImage(cloudCanvas, 0, 0, cw, ch, x - ox, y - oy, cw, ch);
    ctx.restore();
  }
  // Two rolling hills and, on the far one, an Ottoman mosque with two minarets.
  function drawGrass(ctx, s) {
    var back, front, mosque;
    if (s.phase === 0) { back = "#1B2770"; front = "#121B55"; mosque = "#0B1240"; }
    else if (s.phase === 4) { back = "#2A2F7E"; front = "#1C2163"; mosque = "#131750"; }
    else if (s.phase === 1) { back = "#6E5B9E"; front = "#4E417F"; mosque = "#3A2F66"; }
    else if (s.phase === 3) { back = "#8A4E7E"; front = "#5E3767"; mosque = "#3F2450"; }
    else { back = "#8CC47E"; front = "#5FA25F"; mosque = "#4E6A85"; }
    var farTop = H * 0.855;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, farTop + H * 0.03);
    ctx.bezierCurveTo(W * 0.25, farTop - H * 0.035, W * 0.45, farTop + H * 0.025, W * 0.62, farTop);
    ctx.bezierCurveTo(W * 0.78, farTop - H * 0.025, W * 0.9, farTop + H * 0.02, W, farTop + H * 0.01);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = back;
    ctx.fill();

    ctx.fillStyle = mosque;
    var baseY = farTop + H * 0.005, cx = W * 0.885, u = H * 0.012;
    var bodyTop = baseY - u * 3.2;
    var halfDome = function (l, t, r, b) {
      ctx.beginPath();
      ctx.save();
      ctx.translate((l + r) / 2, (t + b) / 2);
      ctx.scale((r - l) / 2, (b - t) / 2);
      ctx.moveTo(-1, 0);
      ctx.arc(0, 0, 1, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.restore();
      ctx.fill();
    };
    ctx.fillRect(cx - u * 7.5, bodyTop, u * 15, baseY + u - bodyTop);
    ctx.fillRect(cx - u * 3.6, bodyTop - u * 2.2, u * 7.2, u * 2.2);
    halfDome(cx - u * 4.4, bodyTop - u * 6.6, cx + u * 4.4, bodyTop + u * 0.6);
    halfDome(cx - u * 6.8, bodyTop - u * 2.4, cx - u * 2.6, bodyTop + u * 1.6);
    halfDome(cx + u * 2.6, bodyTop - u * 2.4, cx + u * 6.8, bodyTop + u * 1.6);
    for (var side = -1; side <= 1; side += 2) {
      var sx = cx + side * u * 6.6;
      halfDome(sx - u * 1.2, bodyTop - u * 1.3, sx + u * 1.2, bodyTop + u * 1.1);
    }
    var tipY = bodyTop - u * 6.2;
    ctx.fillRect(cx - u * 0.18, tipY - u * 1.6, u * 0.36, u * 1.6);
    // Crescent: the circle minus a bite.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, tipY - u * 2.2, u * 0.7, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(cx - u, tipY - u * 3.2, u * 2, u * 2);
    ctx.arc(cx + u * 0.35, tipY - u * 2.35, u * 0.6, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
    for (side = -1; side <= 1; side += 2) {
      var mx = cx + side * u * 10.5;
      var shaftTop = baseY - u * 17;
      ctx.fillRect(mx - u * 0.55, shaftTop, u * 1.1, baseY + u - shaftTop);
      ctx.fillRect(mx - u * 0.75, baseY - u * 3, u * 1.5, u * 4);
      var bal = [0.45, 0.75];
      for (var b = 0; b < bal.length; ++b) {
        var by = baseY - u * 17 * bal[b];
        ctx.fillRect(mx - u * 1.05, by - u * 0.35, u * 2.1, u * 0.5);
      }
      ctx.beginPath();
      ctx.moveTo(mx - u * 0.6, shaftTop);
      ctx.lineTo(mx, shaftTop - u * 5);
      ctx.lineTo(mx + u * 0.6, shaftTop);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(mx - u * 0.1, shaftTop - u * 6.2, u * 0.2, u * 1.2);
    }

    var nearTop = H * 0.905;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, nearTop);
    ctx.bezierCurveTo(W * 0.18, nearTop - H * 0.03, W * 0.38, nearTop + H * 0.03, W * 0.55, nearTop + H * 0.005);
    ctx.bezierCurveTo(W * 0.72, nearTop - H * 0.02, W * 0.88, nearTop + H * 0.035, W, nearTop + H * 0.01);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = front;
    ctx.fill();
  }

  // ------------------------------------------------------------------ Pano / Salon (layouts 2 and 3), home_dash.xml
  // MosqueMedallionView: gold rim with carving, dark green disc, gold calligraphy (Scheherazade).
  function drawMedallion(ctx, cx, cy, size, text) {
    var r = size * 0.46;
    var g = ctx.createRadialGradient(cx + r * 0.06, cy + r * 0.10, 0, cx + r * 0.06, cy + r * 0.10, r * 1.12);
    g.addColorStop(0.55, "rgba(0,0,0,0.4)"); g.addColorStop(1, "rgba(0,0,0,0)");
    circle(ctx, cx + r * 0.05, cy + r * 0.08, r * 1.04, g);
    g = ctx.createRadialGradient(cx - r * 0.18, cy - r * 0.22, 0, cx - r * 0.18, cy - r * 0.22, r * 1.15);
    g.addColorStop(0, "#E8D48A"); g.addColorStop(0.45, "#C9A227"); g.addColorStop(1, "#8A6A1E");
    circle(ctx, cx, cy, r, g);
    g = ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.18, 0, cx - r * 0.12, cy - r * 0.18, r * 0.95);
    g.addColorStop(0, "#2A4A40"); g.addColorStop(0.55, "#16352C"); g.addColorStop(1, "#0C201A");
    circle(ctx, cx, cy, r * 0.90, g);
    var lg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    lg.addColorStop(0, "#F0D78A"); lg.addColorStop(1, "#9A7420");
    ctx.strokeStyle = lg;
    var rings = [[0.935, Math.max(3, r * 0.055)], [0.80, Math.max(1.5, r * 0.018)], [0.74, Math.max(1, r * 0.010)]];
    for (var i = 0; i < rings.length; ++i) {
      ctx.lineWidth = rings[i][1];
      ctx.beginPath(); ctx.arc(cx, cy, r * rings[i][0], 0, Math.PI * 2); ctx.stroke();
    }
    var ring = r * 0.865, sz = Math.max(2.2, r * 0.034);
    var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, ring + sz);
    cg.addColorStop(0, "#E8D48A"); cg.addColorStop(1, "#B8903A");
    ctx.fillStyle = cg;
    for (i = 0; i < 24; ++i) {
      var a = i * Math.PI * 2 / 24 - Math.PI / 2;
      var x = cx + Math.cos(a) * ring, y = cy + Math.sin(a) * ring;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2);
      ctx.scale(sz * 0.55, sz);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (!text) return;
    var family = '"Scheherazade", "Amiri", serif';
    var maxW = r * 1.22, textSize = r * 0.50;
    setFont(ctx, textSize, family, false);
    while (ctx.measureText(text).width > maxW && textSize > 14) { textSize -= 1; setFont(ctx, textSize, family, false); }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#5A3E12";
    ctx.fillText(text, cx + r * 0.008, cy + r * 0.010);
    var tg = ctx.createLinearGradient(cx, cy - r * 0.2, cx, cy + r * 0.25);
    tg.addColorStop(0, "#F6E7B0"); tg.addColorStop(1, "#C9A227");
    ctx.fillStyle = tg;
    ctx.fillText(text, cx, cy);
    ctx.textBaseline = "alphabetic";
  }

  function drawDash(ctx, s, layout) {
    var pal = PALETTES[preset().accent];
    ctx.fillStyle = "#F7F1E4";
    ctx.fillRect(0, 0, W, H);
    var padX = 18 * DP, chrome = 96 * DP;
    var top = 12 * DP;
    if (layout === 2) top = drawPrayerRow(ctx, s, top, true, pal) + 10 * DP;
    // Bottom: the next-prayer circle (right) and, on Salon, five wide cards.
    var circleSize = 108 * DP;
    var rowBottom = H - chrome - 8 * DP;
    var rowTop = rowBottom - circleSize;
    var ccx = W - padX - circleSize / 2, ccy = rowTop + circleSize / 2;
    ctx.beginPath(); ctx.arc(ccx, ccy, circleSize / 2 - 2.5 * DP, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_SOFT; ctx.fill();
    ctx.lineWidth = 5 * DP; ctx.strokeStyle = "#C4A05A"; ctx.stroke();
    if (s.next) {
      var sec = Math.max(0, Math.floor((s.next.when.getTime() - s.now.getTime()) / 1000));
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
      var value = h > 0 ? h + ":" + pad(m) : m + " " + S("dash_min");
      var lines = [{ t: s.nextName, size: 12 * DP }, { t: value, size: 18 * DP }];
      if (s.nextSuffix) lines.push({ t: s.nextSuffix, size: 18 * DP });
      var total = 0;
      for (var i = 0; i < lines.length; ++i) total += 1.327 * lines[i].size;
      var y = ccy - total / 2;
      ctx.fillStyle = "#5A3A08";
      ctx.textAlign = "center";
      for (i = 0; i < lines.length; ++i) {
        fit(ctx, lines[i].t, circleSize - 16 * DP, lines[i].size, SANS, true);
        ctx.fillText(lines[i].t, ccx, y + 1.056 * lines[i].size);
        y += 1.327 * lines[i].size;
      }
    }
    if (layout === 3) {
      var gap = 8 * DP, itemH = 92 * DP;
      var areaW = W - padX * 2 - circleSize - 10 * DP;
      var keys = [0, 2, 3, 4, 5];
      var itemW = (areaW - gap * 4) / 5;
      var itop = ccy - itemH / 2;
      for (i = 0; i < keys.length; ++i) {
        var k = keys[i], hi = k === s.activeIndex;
        var ix = padX + i * (itemW + gap);
        roundRect(ctx, ix + 0.9, itop + 0.9, itemW - 1.8, itemH - 1.8, 16 * DP);
        ctx.fillStyle = hi ? pal.highlight : CHIP_IDLE;
        ctx.fill();
        ctx.lineWidth = 1.2 * DP;
        ctx.strokeStyle = hi ? pal.nextStroke : CHIP_IDLE_STROKE;
        ctx.stroke();
        var ts = 16 * DP, ns = 12 * DP;
        var contentH = 1.327 * ts + 6 * DP + 1.327 * ns;
        var cy = itop + (itemH - contentH) / 2;
        ctx.fillStyle = hi ? pal.highlightText : "#1A1712";
        fit(ctx, s.times[k], itemW - 12 * DP, ts, SANS, true);
        ctx.fillText(s.times[k], ix + itemW / 2, cy + 1.056 * ts);
        ctx.fillStyle = hi ? pal.highlightText : "#6B5E48";
        fit(ctx, upper(s.names[k]), itemW - 12 * DP, ns, SANS, false);
        ctx.fillText(upper(s.names[k]), ix + itemW / 2, cy + 1.327 * ts + 6 * DP + 1.056 * ns);
      }
    }
    // Middle: Muhammad medallion, the clock card, Allah medallion.
    var midTop = top, midBottom = rowTop;
    var medal = Math.max(128 * DP, Math.min(228 * DP, H * 0.36));
    var cardX = padX + medal + 14 * DP + 8 * DP;
    var cardW = W - padX * 2 - medal * 2 - 28 * DP - 16 * DP;
    var clockSize = Math.min(H * 0.26, W * 0.24) * 0.8;
    var dateSize = 15 * DP;
    var dlines = dateLines(s.now, civilShort(s.now));
    var cardH = 18 * DP + 1.362 * clockSize + 17 * DP + (0.128 + dlines.length * 1.172 + 0.027) * dateSize + 16 * DP;
    var midY = (midTop + midBottom) / 2;
    var cardY = midY - cardH / 2;
    drawMedallion(ctx, padX + medal / 2, midY, medal, S("dash_panel_muhammad"));
    drawMedallion(ctx, W - padX - medal / 2, midY, medal, S("dash_panel_allah"));
    roundRect(ctx, cardX + 0.75, cardY + 0.75, cardW - 1.5, cardH - 1.5, 20 * DP);
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fill();
    ctx.lineWidth = 1 * DP; ctx.strokeStyle = "rgba(196,160,90,0.533)"; ctx.stroke();
    var clock = pad(s.now.getHours()) + ":" + pad(s.now.getMinutes());
    ctx.textAlign = "center";
    ctx.fillStyle = "#2C2418";
    setFont(ctx, clockSize, SERIF, true);
    var cy2 = cardY + 18 * DP;
    ctx.fillText(clock, cardX + cardW / 2, cy2 + 1.069 * clockSize);
    cy2 += 1.362 * clockSize + 8 * DP;
    ctx.fillStyle = "#C4A86A";
    ctx.fillRect(cardX + cardW / 2 - 90 * DP, cy2, 180 * DP, 1 * DP);
    cy2 += 9 * DP + 1.056 * dateSize;
    for (i = 0; i < dlines.length; ++i) {
      ctx.fillStyle = dlines[i].color || "#6B5E48";
      fit(ctx, dlines[i].text, cardW - 56 * DP, dateSize, SANS, !!dlines[i].bold);
      ctx.fillText(dlines[i].text, cardX + cardW / 2, cy2);
      cy2 += 1.172 * dateSize;
    }
  }

  // ------------------------------------------------------------------ home rendering
  var homeCtx = null;
  var lastPhoto = -1;
  function renderHome(now) {
    if (!isShown("home")) return;
    var ctx = homeCtx || (homeCtx = $("homeCanvas").getContext("2d"));
    var p = preset();
    if (p.layout === 1 && lastPhoto !== p.photo) {
      lastPhoto = p.photo;
      $("homePhoto").style.backgroundImage = "url(" + DATA.homePhotos[p.photo] + ")";
    }
    $("homePhoto").style.display = p.layout === 1 ? "block" : "none";
    ctx.clearRect(0, 0, W, H);
    var s = homeState(now);
    if (p.layout === 1) drawClassic(ctx, s);
    else if (p.layout === 4) drawSky(ctx, s);
    else drawDash(ctx, s, p.layout);
    if (!settings.districtId || (!s.row && (fetching || fetchError))) {
      var msg = !settings.districtId ? S("location_required") : fetching ? S("loading") : S("times_fetch_failed");
      ctx.textAlign = "center";
      setFont(ctx, 22 * DP, SANS, false);
      var tw = ctx.measureText(msg).width + 48 * DP;
      roundRect(ctx, (W - tw) / 2, H - 150 * DP, tw, 46 * DP, 23 * DP);
      ctx.fillStyle = "rgba(230,230,230,0.92)"; ctx.fill();
      ctx.fillStyle = "#222";
      ctx.fillText(msg, W / 2, H - 150 * DP + 31 * DP);
    }
    styleActions(p.layout);
  }

  // Home action buttons behind the menu toggle (btn_action_bg / ReferenceButtonDrawable, button style 6).
  var actionStyled = -1;
  function actionSvg(fill, stroke, dash) {
    var w = 150, h = 150;
    var shape;
    if (dash) {
      shape = '<rect x="1" y="1" width="148" height="148" rx="21" ry="21" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2.25"/>';
    } else {
      var l = 1, r = w - 1, t = 1, b = h - 2, point = Math.min(h * 0.20, w * 0.14), inset = w * 0.28;
      shape = '<path d="M' + l + ',' + t + 'L' + r + ',' + t + 'L' + r + ',' + (b - point) + 'L' + (r - inset) + ',' + (b - point) + 'L' + ((l + r) / 2) +
        ',' + b + 'L' + (l + inset) + ',' + (b - point) + 'L' + l + ',' + (b - point) + 'Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
    }
    return "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">' + shape + "</svg>") + "\")";
  }
  function styleActions(layout) {
    if (actionStyled === layout) return;
    actionStyled = layout;
    var dash = layout === 2 || layout === 3, sky = layout === 4;
    var pal = PALETTES[preset().accent];
    var bg = dash ? actionSvg(pal.buttonFill, pal.buttonStroke, true)
      : actionSvg(sky ? "rgba(47,79,200,0.867)" : "rgba(22,75,104,0.867)", sky ? "#AFC2FF" : "#87C7D6", false);
    var buttons = [$("actAdhan"), $("actTesbihat"), $("actSettings"), $("actClose")];
    for (var i = 0; i < buttons.length; ++i) {
      buttons[i].style.backgroundImage = bg;
      buttons[i].style.color = dash ? pal.buttonText : "#FFFFFF";
    }
  }
  function iconSvg(icon) {
    var paths = icon.paths;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + icon.viewBox + '">';
    for (var i = 0; i < paths.length; ++i) out += '<path fill="' + paths[i][0] + '" d="' + paths[i][1] + '"/>';
    return out + "</svg>";
  }

  // ------------------------------------------------------------------ screensaver footer (SkyHomeView.drawSlideDisc)
  var saverCtx = null;
  var slideTextDark = false;
  function renderSaverOverlay(now) {
    if (!isShown("saver")) return;
    var ctx = saverCtx || (saverCtx = $("saverOverlay").getContext("2d"));
    ctx.clearRect(0, 0, W, H);
    var s = homeState(now);
    var unit = Math.min(W, H) / 100;
    // Shift a pixel or two every minute so nothing stays lit in exactly one place for hours.
    var minute = Math.floor(now.getTime() / 60000);
    var dx = ((minute * 7) % 5) * unit * 0.4, dy = ((minute * 3) % 3) * unit * 0.3;
    ctx.textAlign = "center";
    var r = Math.min(W * 0.06, H * 0.095);
    var bottom = H - unit * 2 - dy;
    var discX = W - unit * 3 - r - dx, discY = bottom - r;
    var stripH = H * 0.11;
    var stripLeft = unit * 2 + dx;
    roundRect(ctx, stripLeft, bottom - stripH, discX - stripLeft, stripH, stripH * 0.3);
    ctx.fillStyle = "rgba(16,24,40,0.36)";
    ctx.fill();
    var n = s.names.length, left = stripLeft + unit, right = discX - r - unit;
    if (right > left) {
      var slot = (right - left) / n;
      for (var i = 0; i < n; ++i) {
        var active = i === s.activeIndex;
        var cx = left + slot * (i + 0.5);
        ctx.fillStyle = active ? GOLD_SOFT : "rgba(255,255,255,0.8)";
        fit(ctx, s.names[i], slot * 0.9, stripH * 0.32, SANS, active);
        ctx.fillText(s.names[i], cx, bottom - stripH + stripH * 0.4);
        ctx.fillStyle = active ? GOLD_SOFT : "#FFFFFF";
        fit(ctx, s.times[i], slot * 0.92, stripH * 0.46, SANS, true);
        ctx.fillText(s.times[i], cx, bottom - stripH + stripH * 0.87);
      }
    }
    drawGoldDisc(ctx, discX, discY, r);
    if (s.next) drawDiscText(ctx, discX, discY, r, s, "#5A3A08");
    // Clock and date, one line centred above the strip.
    var line = civilDash(now) + "  ·  " + pad(now.getHours()) + ":" + pad(now.getMinutes());
    ctx.fillStyle = slideTextDark ? "#18202C" : "#FFFFFF";
    shadow(ctx, unit * 0.8, unit * 0.2, slideTextDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.9)");
    fit(ctx, line, W * 0.5, H * 0.045, SANS, true);
    ctx.fillText(line, W * 0.5, bottom - stripH - unit * 1.5);
    noShadow(ctx);
  }

  // ------------------------------------------------------------------ toast and reminder overlay
  var toastTimer = null;
  function toast(text) {
    var t = $("toast");
    t.innerHTML = escapeHtml(text);
    show("toast");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { hide("toast"); }, 3500);
  }
  var eventTimer = null;
  function showEventOverlay(title, subtitle, hideAfterMs) {
    $("eventTitle").innerHTML = escapeHtml(title);
    $("eventSubtitle").innerHTML = escapeHtml(subtitle);
    var o = $("eventOverlay");
    o.className = "";
    setTimeout(function () { o.className = "on"; }, 30);
    if (eventTimer) clearTimeout(eventTimer);
    eventTimer = setTimeout(hideEventOverlay, hideAfterMs);
  }
  function hideEventOverlay() {
    var o = $("eventOverlay");
    if (o.className.indexOf("hidden") >= 0) return;
    o.className = "";
    setTimeout(function () { if (o.className === "") o.className = "hidden"; }, 720);
  }

  // checkPrayerReminder: fifteen minutes before each prayer (not sunrise), once a day.
  var reminded = load("reminder_played", {});
  function checkReminder(now, row) {
    if (!settings.reminder || !row) return;
    var lead = 15;
    var today = dateKey(now);
    for (var i = 0; i < KEYS.length; ++i) {
      var key = KEYS[i];
      if (key === "Gunes" || reminded[today + "|" + key]) continue;
      var when = at(row, key, now);
      if (!when) continue;
      var diff = when.getTime() - now.getTime();
      if (diff > lead * 60000 || diff <= lead * 60000 - 60000) continue;
      var keep = {};
      for (var m in reminded) if (reminded.hasOwnProperty(m) && m.indexOf(today) === 0) keep[m] = true;
      keep[today + "|" + key] = true;
      reminded = keep;
      store("reminder_played", reminded);
      var label = prayerName(key, now);
      toast(format(S("reminder_toast"), label, lead));
      showEventOverlay(label, format(S("frame_prayer_in_minutes"), lead), 12000);
      if (!adhanState) {
        if (tesbihatPlaying) stopTesbihat(); // playReminderCue stops the helper's previous media
        var cue = $("cue");
        cue.src = DATA.audio.alert[settings.lang] || DATA.audio.alert.en;
        try { var pr = cue.play(); if (pr && pr.catch) pr.catch(function () { }); } catch (e) { }
      }
      return;
    }
  }

  // ------------------------------------------------------------------ adhan (AdhanHelper + showAdhanMode)
  var player = $("player");
  var adhanState = null; // {key, phase: "adhan"|"dua"}
  var played = load("adhan_played", {});
  var adhanImages = [];
  var adhanImageIndex = 0;
  var adhanImageTimer = null;

  // checkPrayerAdhan: from 2 s before to 5 s after the minute, once per prayer and day; never at sunrise.
  function checkAdhan(now, row) {
    if (settings.azan === "off" || !DATA.audio[settings.azan] || !row || adhanState) return;
    var today = dateKey(now);
    for (var i = 0; i < KEYS.length; ++i) {
      var key = KEYS[i];
      if (key === "Gunes") continue;
      var mark = today + "|" + key;
      if (played[mark]) continue;
      var when = at(row, key, now);
      if (!when) continue;
      var diffSec = (when.getTime() - now.getTime()) / 1000;
      if (diffSec > 2 || diffSec < -5) continue;
      var keep = {};
      for (var m in played) if (played.hasOwnProperty(m) && m.indexOf(today) === 0) keep[m] = true;
      keep[mark] = true;
      played = keep;
      store("adhan_played", played);
      playAdhan(key, now);
      return;
    }
  }

  function playAdhan(key, now) {
    if (settings.azan === "off" || !DATA.audio[settings.azan]) return;
    var tracks = DATA.audio[settings.azan][key];
    if (!tracks || !tracks.length) return;
    var rot = load("adhan_rotation", {});
    var index = (rot[settings.azan + key] || 0) % tracks.length;
    rot[settings.azan + key] = index + 1;
    store("adhan_rotation", rot);
    stopSaver();
    hideEventOverlay();
    tesbihatPlaying = false; // a new adhan replaces whatever was playing
    store("tesbihat_due", null);
    adhanState = { key: key, phase: "adhan" };
    showAdhanMode();
    toast(format(S("adhan_playing"), prayerName(key, now)));
    playFile(tracks[index]);
  }

  function showAdhanMode() {
    adhanImages = DATA.adhanVisuals.slice();
    for (var i = adhanImages.length - 1; i > 0; --i) { var j = Math.floor(Math.random() * (i + 1)); var t = adhanImages[i]; adhanImages[i] = adhanImages[j]; adhanImages[j] = t; }
    adhanImageIndex = 0;
    // The home photo stays until the first mosque photo has loaded.
    $("adhanPhoto").style.backgroundImage = "url(" + DATA.homePhotos[preset().photo] + ")";
    $("adhanCaption").style.display = "none";
    show("adhan");
    $("adhanStop").focus();
    showNextAdhanImage();
    if (adhanImageTimer) clearInterval(adhanImageTimer);
    adhanImageTimer = setInterval(showNextAdhanImage, 8000);
  }
  function showNextAdhanImage() {
    if (!adhanImages.length) return;
    var item = adhanImages[adhanImageIndex % adhanImages.length];
    ++adhanImageIndex;
    var img = new Image();
    img.onload = function () {
      if (!adhanState) return;
      $("adhanPhoto").style.backgroundImage = "url(" + item.url + ")";
      var l = settings.lang;
      $("adhanCaption").innerHTML = escapeHtml(l === "tr" ? item.tr : l === "de" ? item.de : l === "ar" ? item.ar : item.en);
      $("adhanCaption").style.display = "block";
    };
    img.src = item.url;
  }

  function playFile(src) {
    player.src = src;
    try {
      var p = player.play();
      if (p && p.catch) p.catch(function () { });
    } catch (e) { }
  }

  player.addEventListener("ended", function () {
    if (tesbihatPlaying) { tesbihatPlaying = false; updateTesbihatButton(new Date()); return; }
    if (adhanState && adhanState.phase === "adhan" && settings.dua && adhanState.key !== "Gunes") {
      adhanState.phase = "dua";
      playFile(DATA.audio.dua);
      return;
    }
    // maybeScheduleTesbihat: only after an adhan (and its dua) that played to the end.
    if (adhanState) scheduleTesbihat(adhanState.key);
    stopAdhan();
  });
  player.addEventListener("error", function () {
    if (tesbihatPlaying) { tesbihatPlaying = false; updateTesbihatButton(new Date()); }
    if (adhanState) stopAdhan();
  });

  // ------------------------------------------------------------------ tesbihat (AdhanHelper.tesbihatFor + MainActivity)
  var tesbihatPlaying = false;
  var tesbihatPrayerKey = "";
  // Fajr and Asr are followed by Tercuman-i Ism-i Azam, Dhuhr, Maghrib and Isha by Ism-i Azam; set 1 or 2.
  function tesbihatFor(key) {
    var morningOrAfternoon = key === "Imsak" || key === "Ikindi";
    var set = settings.tesbihatSet === 2 ? 2 : 1;
    return DATA.audio.tesbihat[(morningOrAfternoon ? "tercumani_ismi_azam_" : "ismi_azam_") + set];
  }
  function playerBusy() { return !!adhanState || tesbihatPlaying || !$("cue").paused; }
  function playTesbihat(key) {
    if (adhanState) return false;
    tesbihatPlaying = true;
    playFile(tesbihatFor(key));
    updateTesbihatButton(new Date());
    return true;
  }
  function stopTesbihat() {
    tesbihatPlaying = false;
    try { player.pause(); } catch (e) { }
    updateTesbihatButton(new Date());
  }
  function scheduleTesbihat(key) {
    if (!settings.tesbihat || key === "Gunes") return;
    store("tesbihat_due", { at: Date.now() + settings.tesbihatDelay * 60000, key: key });
  }
  function maybeStartScheduledTesbihat() {
    var due = load("tesbihat_due", null);
    if (!due) return;
    if (!settings.tesbihat) { store("tesbihat_due", null); return; }
    var now = Date.now();
    if (now < due.at) return;
    if (now - due.at > 5 * 60000) { store("tesbihat_due", null); return; } // expired
    if (playerBusy()) return; // something else is still sounding; the next tick tries again
    store("tesbihat_due", null);
    playTesbihat(due.key);
  }
  // The button shows for an hour after each prayer (not sunrise) and while the tesbihat plays.
  function updateTesbihatButton(now) {
    if (adhanState) { hide("actTesbihat"); return; }
    var inWindow = false;
    for (var d = -1; d <= 0 && !inWindow; ++d) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      var row = rowFor(day);
      for (var i = 0; row && i < KEYS.length; ++i) {
        if (KEYS[i] === "Gunes") continue;
        var when = at(row, KEYS[i], day);
        if (!when) continue;
        var elapsed = now.getTime() - when.getTime();
        if (elapsed < 0 || elapsed > 3600000) continue;
        inWindow = true;
        tesbihatPrayerKey = KEYS[i];
        break;
      }
    }
    if (inWindow || tesbihatPlaying) show("actTesbihat"); else hide("actTesbihat");
    var label = S(tesbihatPlaying ? "tesbihat_stop" : "tesbihat");
    if ($("lblTesbihat").textContent !== label) $("lblTesbihat").innerHTML = escapeHtml(label);
  }
  function toggleTesbihat() {
    if (adhanState) return;
    store("tesbihat_due", null);
    if (tesbihatPlaying) stopTesbihat(); else playTesbihat(tesbihatPrayerKey || "Ogle");
  }

  function stopAdhan() {
    adhanState = null;
    try { player.pause(); } catch (e) { }
    if (adhanImageTimer) { clearInterval(adhanImageTimer); adhanImageTimer = null; }
    hide("adhan");
    touch();
    tick(true);
    focusFirst();
  }
  // toggleAdhan: the next prayer's adhan (Imsak instead of sunrise), or stop the one playing.
  function toggleAdhan() {
    if (adhanState) { stopAdhan(); return; }
    var next = findNext(new Date());
    var key = next ? next.key : "Imsak";
    if (key === "Gunes") key = "Imsak";
    playAdhan(key, new Date());
  }

  // ------------------------------------------------------------------ screensaver (ScreensaverTextRenderer + SlideTransitions)
  var texts = {};
  var saverTimer = null;
  var saverFront = "";
  var saverToken = 0;
  var lastActivity = Date.now();

  function loadTexts(lang, done) {
    if (texts[lang]) { done(); return; }
    getJson("data/texts/" + lang + ".json", function (list) {
      var map = {};
      for (var i = 0; i < list.length; ++i) map[list[i].id] = list[i];
      texts[lang] = map;
      done();
    }, function () { texts[lang] = texts[lang] || {}; done(); });
  }
  function record(id, lang) {
    var r = texts[lang] && texts[lang][id];
    if (r) return { r: r, lang: lang };
    r = texts.en && texts.en[id];
    return r ? { r: r, lang: "en" } : null;
  }
  // ScreensaverTextRenderer.hidden: Mihrap's own translations the viewer chose not to see (Esma keeps the slide).
  function isHidden(id, lang) {
    if (settings.mihrapTr) return false;
    var r = texts[lang] && texts[lang][id];
    return !!(r && r.translation === "mihrap" && r.category !== "ESMA");
  }
  // SlideAssets.languages: the menu language plus the ticked screensaver languages.
  function saverLanguages() {
    var out = [settings.lang];
    var extra = settings.saverLangs || [];
    for (var i = 0; i < extra.length; ++i) if (LANGS.indexOf(extra[i]) >= 0 && out.indexOf(extra[i]) < 0) out.push(extra[i]);
    return out;
  }
  var allSlideIds = (function () {
    var ids = DATA.slides.slice();
    for (var i = 0; i < DATA.esmaCount; ++i) ids.push(DATA.esmaFirst + i);
    return ids;
  })();
  var lastSlideId = -1;
  // SlideAssets.nextRandom: a random slide in a random screensaver language; slides hidden in that
  // language are skipped, and after many misses any slide will do.
  function nextRandom() {
    var languages = saverLanguages(), id, lang, tries = 0;
    do {
      id = allSlideIds[Math.floor(Math.random() * allSlideIds.length)];
      lang = languages[Math.floor(Math.random() * languages.length)];
    } while (id === lastSlideId || (++tries < 60 && isHidden(id, lang)));
    lastSlideId = id;
    return { id: id, lang: lang };
  }
  function loadAllTexts(langs, done) {
    var i = 0;
    var step = function () { if (i >= langs.length) { done(); return; } loadTexts(langs[i++], step); };
    step();
  }

  function startSaver() {
    loadAllTexts(["en"].concat(saverLanguages()), function () {
      if (!isShown("home") || anyLayer()) return;
      {
        hide("home");
        show("saver");
        $("slideA").className = ""; $("slideB").className = "";
        saverFront = "";
        saverToken++;
        renderSaverOverlay(new Date());
        nextSlide(saverToken, false);
      }
    });
  }
  function stopSaver() {
    if (!isShown("saver")) return;
    saverToken++;
    if (saverTimer) { clearTimeout(saverTimer); saverTimer = null; }
    hide("saver");
    show("home");
    touch();
    tick(true);
  }
  function nextSlide(token, animate) {
    if (token !== saverToken) return;
    var choice = nextRandom(), id = choice.id;
    var img = new Image();
    img.onload = function () {
      if (token !== saverToken) return;
      var incoming = saverFront === "slideA" ? "slideB" : "slideA";
      drawSlide($(incoming), img, id, choice.lang);
      renderSaverOverlay(new Date());
      playTransition($(incoming), saverFront ? $(saverFront) : null, animate);
      saverFront = incoming;
      saverTimer = setTimeout(function () { nextSlide(token, true); }, Math.max(5, settings.slide) * 1000);
    };
    img.onerror = function () { saverTimer = setTimeout(function () { nextSlide(token, animate); }, 1000); };
    img.src = id >= DATA.esmaFirst ? "slides/esma.jpg" : "slides/" + ("00" + id).slice(-3) + ".jpg";
  }

  // SlideTransitions: fade, slide from either side, rotate in, or a curved swing; 700 ms.
  function setTransform(el, t, opacity, animated) {
    el.className = (animated ? "anim " : "") + "show";
    el.style.webkitTransform = t;
    el.style.transform = t;
    el.style.opacity = opacity;
  }
  function playTransition(incoming, outgoing, animate) {
    if (!animate || !outgoing) {
      setTransform(incoming, "none", 1, false);
      if (outgoing) outgoing.className = "";
      return;
    }
    var kind = Math.floor(Math.random() * 5), start, outEnd = "none", outOpacity = 0, inOpacity = 1, startOpacity = 1;
    if (kind === 1) { start = "translateX(100%)"; outEnd = "translateX(-100%)"; outOpacity = 1; }
    else if (kind === 2) { start = "translateX(-100%)"; outEnd = "translateX(100%)"; outOpacity = 1; }
    else if (kind === 3) { start = "rotate(" + (Math.random() < 0.5 ? 90 : -90) + "deg)"; startOpacity = 0.2; }
    else if (kind === 4) {
      var fromRight = Math.random() < 0.5;
      start = "translate(" + (fromRight ? 110 : -110) + "%," + (Math.random() < 0.5 ? 35 : -35) + "%) rotate(" + (fromRight ? 18 : -18) + "deg)";
    } else { start = "none"; startOpacity = 0; }
    incoming.style.zIndex = 2;
    outgoing.style.zIndex = 1;
    setTransform(incoming, start, startOpacity, false);
    setTransform(outgoing, "none", 1, false);
    void incoming.offsetWidth; // apply the start state before animating
    setTransform(incoming, "none", inOpacity, true);
    setTransform(outgoing, outEnd, outOpacity, true);
    setTimeout(function () { if (outgoing.className.indexOf("show") >= 0 && outgoing !== $(saverFront)) outgoing.className = ""; }, 760);
  }

  function arabicScript(lang) { return lang === "ar" || lang === "fa" || lang === "ur"; }
  function quoteFace(arabic) { return arabic ? '"Amiri", serif' : SERIF; }

  function drawSlide(canvas, img, id, lang) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var scale = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
    slideTextDark = false;
    var rec = record(id, lang);
    if (!rec) return;
    var rtl = arabicScript(rec.lang);
    canvas.setAttribute("dir", rtl ? "rtl" : "ltr");
    if ("direction" in ctx) ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    if (rec.r.category === "ESMA") {
      var meaning = rec.lang !== "ar" && (rec.r.translation !== "mihrap" || settings.mihrapTr);
      drawEsma(ctx, w, h, rec.r, rec.lang === "ar", meaning);
    } else if (rec.r.text) {
      drawQuote(ctx, w, h, rec.r, rtl);
    }
  }

  function wrap(ctx, text, maxWidth) {
    var lines = [];
    var paragraphs = String(text).trim().split("\n");
    for (var p = 0; p < paragraphs.length; ++p) {
      var para = paragraphs[p].trim();
      if (!para) continue;
      var spaced = para.indexOf(" ") >= 0;
      var units = spaced ? para.split(/\s+/) : para.split("");
      var line = "";
      for (var i = 0; i < units.length; ++i) {
        var candidate = line ? line + (spaced ? " " : "") + units[i] : units[i];
        if (ctx.measureText(candidate).width <= maxWidth || !line) {
          line = candidate;
        } else {
          lines.push(line);
          line = units[i];
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  function sample(ctx, left, top, right, bottom, w, h) {
    var x0 = Math.max(0, Math.min(w - 1, Math.round(left))), y0 = Math.max(0, Math.min(h - 1, Math.round(top)));
    var x1 = Math.max(x0 + 1, Math.min(w, Math.round(right))), y1 = Math.max(y0 + 1, Math.min(h, Math.round(bottom)));
    var total = 0, bright = 0, samples = 0, data;
    try { data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; } catch (e) { return { lum: 80, bright: 0 }; }
    var bw = x1 - x0;
    for (var row = 0; row < 12; row++) {
      var y = Math.floor(((y1 - y0 - 1) * row) / 11);
      for (var col = 0; col < 20; col++) {
        var x = Math.floor(((x1 - x0 - 1) * col) / 19);
        var o = (y * bw + x) * 4;
        var l = (data[o] * 54 + data[o + 1] * 183 + data[o + 2] * 19) >> 8;
        total += l; if (l > 170) bright++; samples++;
      }
    }
    return { lum: samples ? Math.floor(total / samples) : 0, bright: samples ? bright / samples : 0 };
  }

  // Near-white areas get dark text with a light halo; everything else white text with a dark outline and halo.
  function tone(ctx, w, h, centerX, textWidth, top, bottom) {
    var half = Math.min(w * 0.5, textWidth * 0.5);
    var s = sample(ctx, centerX - half, top, centerX + half, bottom, w, h);
    if (s.lum >= 145 || s.bright >= 0.5) {
      return { dark: true, text: "#18202C", source: "#2A2F38", outline: "rgba(24,32,44,0.333)", halo: "rgba(255,255,255,0.85)" };
    }
    var strength = Math.max(0.55, Math.min(0.9, 0.55 + (s.lum - 80) / 120 * 0.35 + s.bright * 0.2));
    return { dark: false, text: "#FFFFFF", source: "#F8EFD9", outline: "rgba(0,0,0,0.9)", halo: "rgba(0,0,0," + strength.toFixed(3) + ")" };
  }

  function drawToned(ctx, text, x, y, size, t, color) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.strokeStyle = t.halo;
    ctx.fillStyle = t.halo;
    ctx.lineWidth = size * 0.07;
    ctx.shadowColor = t.halo;
    ctx.shadowBlur = Math.max(2, size * 0.11) * 2;
    for (var i = 0; i < 2; ++i) { ctx.strokeText(text, x, y); ctx.fillText(text, x, y); }
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.lineWidth = Math.max(1.5, size * (t.dark ? 0.02 : 0.045));
    ctx.strokeStyle = t.outline;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function cleanAttribution(value) {
    value = value || "";
    var prefixes = ["Hikmet — ", "Wisdom — ", "Weisheit — ", "حكمة — ", "حکمت — ", "Hikmah — ", "箴言 — ", "हिकमत — "];
    for (var i = 0; i < prefixes.length; ++i) {
      if (value.indexOf(prefixes[i]) === 0) { value = value.substring(prefixes[i].length).trim(); break; }
    }
    if (value === "Hikmet" || value === "Genel Hikmet") return "Geleneksel";
    if (value === "Wisdom" || value === "Traditional wisdom") return "Traditional";
    if (value === "Weisheit" || value === "Überlieferte Weisheit") return "Überliefert";
    if (value === "حكمة" || value === "حكمة مأثورة") return "مأثور";
    return value;
  }

  function drawQuote(ctx, w, h, r, arabic) {
    var base = w, left = w * 0.105, right = w * 0.895, top = h * 0.13, bottom = h * 0.83;
    var textBottom = bottom - h * 0.105, dividerY = bottom - h * 0.105;
    var face = quoteFace(arabic);
    var maxWidth = right - left - w * 0.07, maxTextHeight = h * 0.48;
    var size = base * (arabic ? 0.041 : 0.038), minSize = base * 0.022;
    var lines = null, used = size;
    while (size >= minSize) {
      setFont(ctx, size, face, false);
      lines = wrap(ctx, r.text, maxWidth);
      used = size;
      if (lines.length * size * (arabic ? 1.48 : 1.30) <= maxTextHeight) break;
      size -= Math.max(1, w * 0.0015);
    }
    if (!lines) return;
    size = used;
    setFont(ctx, size, face, false);
    var lineHeight = size * (arabic ? 1.48 : 1.30);
    var y = top + ((textBottom - top) - lines.length * lineHeight) * 0.5 + size;
    var center = w * 0.5;
    // The first line chooses the tone for the whole quotation.
    var t = tone(ctx, w, h, center, ctx.measureText(lines[0]).width, y - size, y + size * 0.25);
    slideTextDark = t.dark;
    for (var i = 0; i < lines.length; ++i) { drawToned(ctx, lines[i], center, y, size, t, t.text); y += lineHeight; }

    var srcSize = base * (arabic ? 0.022 : 0.020);
    setFont(ctx, srcSize, arabic ? '"Amiri", serif' : SANS, true);
    var source = cleanAttribution(r.source_display || r.source || "");
    var srcLines = wrap(ctx, source, maxWidth * 0.86);
    var sy = dividerY + h * 0.055;
    for (i = 0; i < srcLines.length; ++i) { drawToned(ctx, srcLines[i], center, sy, srcSize, t, t.source); sy += srcSize * 1.22; }
  }

  function drawEsma(ctx, w, h, r, arabic, showMeaning) {
    var base = w, center = w * 0.5, maxWidth = w * 0.74;
    var areaTop = h * 0.12, areaBottom = h * 0.78;
    var amiri = '"Amiri", serif', serif = quoteFace(false);
    var nameAr = r.name_ar || "", name = arabic ? "" : (r.name || ""), meaning = showMeaning ? (r.meaning || "") : "";
    var meaningFace = meaning && /^[؀-ۿ]/.test(meaning) ? amiri : serif;
    var scale = 1, arSize, nameSize, meaningSize, gap, meaningLine, total, meaningLines, arH, nameH;
    while (true) {
      arSize = base * (arabic ? 0.12 : 0.095) * scale;
      setFont(ctx, arSize, amiri, false);
      while (ctx.measureText(nameAr).width > maxWidth) { arSize *= 0.95; setFont(ctx, arSize, amiri, false); }
      arH = arSize * 1.05;
      nameSize = base * 0.044 * scale;
      meaningSize = base * 0.028 * scale;
      gap = base * 0.0225 * scale;
      meaningLine = meaningSize * 1.3;
      nameH = nameSize * 0.75;
      total = arH;
      if (name) total += gap + nameH;
      setFont(ctx, meaningSize, meaningFace, false);
      meaningLines = meaning ? wrap(ctx, meaning, maxWidth) : [];
      if (meaningLines.length) total += gap * 0.8 + meaningSize + (meaningLines.length - 1) * meaningLine;
      if (total <= areaBottom - areaTop || scale < 0.6) break;
      scale *= 0.93;
    }
    var top = areaTop + (areaBottom - areaTop - total) * 0.5;
    setFont(ctx, arSize, amiri, false);
    var widest = ctx.measureText(nameAr).width;
    if (name) { setFont(ctx, nameSize, serif, false); widest = Math.max(widest, ctx.measureText(name).width); }
    setFont(ctx, meaningSize, meaningFace, false);
    for (var i = 0; i < meaningLines.length; ++i) widest = Math.max(widest, ctx.measureText(meaningLines[i]).width);
    var t = tone(ctx, w, h, center, widest, top, top + total);
    slideTextDark = t.dark;
    var y = top + arH * 0.8;
    setFont(ctx, arSize, amiri, false);
    drawToned(ctx, nameAr, center, y, arSize, t, t.text);
    y += arH * 0.2;
    if (name) {
      y += gap + nameH;
      setFont(ctx, nameSize, serif, false);
      drawToned(ctx, name, center, y, nameSize, t, t.text);
    }
    if (meaningLines.length) {
      y += gap * 0.8 + meaningSize;
      setFont(ctx, meaningSize, meaningFace, false);
      for (i = 0; i < meaningLines.length; ++i) { drawToned(ctx, meaningLines[i], center, y, meaningSize, t, t.text); y += meaningLine; }
    }
  }

  // ------------------------------------------------------------------ layers and focus (TV remote)
  var LAYERS = ["start", "adhan", "credits", "picker"];
  function show(id) { var el = $(id); el.className = el.className.replace(/\s*hidden/g, ""); }
  function hide(id) { var el = $(id); if (el.className.indexOf("hidden") < 0) el.className += " hidden"; }
  function isShown(id) { return $(id).className.indexOf("hidden") < 0; }
  function anyLayer() { for (var i = 0; i < LAYERS.length; ++i) if (isShown(LAYERS[i])) return LAYERS[i]; return ""; }
  function activeRoot() {
    var layer = anyLayer();
    if (layer) return $(layer);
    if (isShown("settings")) return $("settings");
    return $("home");
  }
  function focusables(root) {
    var all = root.querySelectorAll(".nav"), out = [];
    for (var i = 0; i < all.length; ++i) if (all[i].offsetWidth > 0 || all[i].offsetHeight > 0) out.push(all[i]);
    return out;
  }
  function focusFirst(preferred) {
    var list = focusables(activeRoot());
    var target = preferred && list.indexOf(preferred) >= 0 ? preferred : list[0];
    if (target) { target.focus(); keepVisible(target); }
  }
  function keepVisible(el) {
    // The scroll boxes are positioned, so they are the offsetParent of the buttons inside them.
    var box = el.offsetParent;
    if (!box || (box.id !== "pickerList" && box.id !== "settingsBody")) return;
    var top = el.offsetTop;
    if (top < box.scrollTop) box.scrollTop = Math.max(0, top - 20);
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top + el.offsetHeight - box.clientHeight + 20;
  }
  function moveFocus(dir) {
    var list = focusables(activeRoot());
    if (!list.length) return;
    var cur = document.activeElement;
    if (list.indexOf(cur) < 0) { focusFirst(); return; }
    var a = cur.getBoundingClientRect();
    var ax = (a.left + a.right) / 2, ay = (a.top + a.bottom) / 2;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < list.length; ++i) {
      var el = list[i];
      if (el === cur) continue;
      var b = el.getBoundingClientRect();
      var bx = (b.left + b.right) / 2, by = (b.top + b.bottom) / 2;
      var dx = bx - ax, dy = by - ay, primary, secondary;
      if (dir === "left") { if (b.right > a.left + 2 && dx >= -2) continue; primary = -dx; secondary = Math.abs(dy); }
      else if (dir === "right") { if (b.left < a.right - 2 && dx <= 2) continue; primary = dx; secondary = Math.abs(dy); }
      else if (dir === "up") { if (b.bottom > a.top + 2 && dy >= -2) continue; primary = -dy; secondary = Math.abs(dx); }
      else { if (b.top < a.bottom - 2 && dy <= 2) continue; primary = dy; secondary = Math.abs(dx); }
      if (primary <= 0) continue;
      // Items that overlap the current one across the move (same column / same line) count as straight ahead.
      var overlaps = (dir === "up" || dir === "down") ? (b.left < a.right && b.right > a.left) : (b.top < a.bottom && b.bottom > a.top);
      if (overlaps) secondary = 0;
      var score = primary + secondary * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) { best.focus(); keepVisible(best); }
  }

  function touch() { lastActivity = Date.now(); }

  var BACK_KEYS = { 8: true, 27: true, 461: true, 10009: true, 166: true, 4: true };
  document.addEventListener("keydown", function (e) {
    var code = e.keyCode || e.which;
    touch();
    if (isShown("saver")) { e.preventDefault(); stopSaver(); focusFirst(); return; }
    // During the adhan, OK or Back stops it (the tablet stops on a double tap, the TV app on Back).
    if (isShown("adhan")) {
      if (code === 13 || BACK_KEYS[code]) { e.preventDefault(); stopAdhan(); }
      return;
    }
    if (isShown("credits") && (code === 38 || code === 40)) {
      $("creditsList").scrollTop += code === 40 ? 240 : -240;
      e.preventDefault();
      return;
    }
    if (code === 37 || code === 38 || code === 39 || code === 40) {
      e.preventDefault();
      moveFocus(code === 37 ? "left" : code === 38 ? "up" : code === 39 ? "right" : "down");
      return;
    }
    if (BACK_KEYS[code]) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (code === 8 && tag === "INPUT") return;
      // Only swallow Back when it closed something; on the bare home screen the browser gets it
      // (leave full screen, go back, or close, depending on the TV).
      if (goBack()) e.preventDefault();
      return;
    }
    // Menu key (as on the Fire TV app) opens the settings.
    if ((code === 93 || code === 18 || code === 457) && isShown("home") && !anyLayer()) { e.preventDefault(); openSettings(); }
  }, true);
  function goBack() {
    var layer = anyLayer();
    if (layer === "picker") closePicker();
    else if (layer === "credits") { hide("credits"); focusFirst(); }
    else if (isShown("settings")) closeSettings(false);
    else if (isShown("home") && isShown("actionRow")) setMenuOpen(false);
    else if (isShown("home") && tesbihatPlaying) stopTesbihat();
    else return false;
    return true;
  }
  // Kapat: a page cannot close itself, so this stops every sound, leaves full screen and
  // returns to the Start screen (the TV's Home key leaves the browser).
  function closeApp() {
    if (adhanState) stopAdhan();
    tesbihatPlaying = false;
    try { player.pause(); } catch (e) { }
    try { $("cue").pause(); } catch (e) { }
    stopSaver();
    hide("actionRow");
    hideEventOverlay();
    var d = document;
    var exit = d.exitFullscreen || d.webkitExitFullscreen || d.webkitCancelFullScreen || d.mozCancelFullScreen || d.msExitFullscreen;
    var inFull = d.fullscreenElement || d.webkitFullscreenElement || d.webkitCurrentFullScreenElement || d.mozFullScreenElement || d.msFullscreenElement;
    if (exit && inFull) { try { var p = exit.call(d); if (p && p.catch) p.catch(function () { }); } catch (e) { } }
    show("start");
    focusFirst();
  }
  function wakeFromPointer(e) {
    touch();
    if (isShown("saver")) { if (e) { e.preventDefault(); e.stopPropagation(); } stopSaver(); }
  }
  document.addEventListener("click", wakeFromPointer, true);
  document.addEventListener("touchstart", wakeFromPointer, true);
  var lastMove = 0;
  document.addEventListener("mousemove", function () {
    var t = Date.now();
    if (t - lastMove < 300) return; // TV pointers jitter; one move every 300 ms counts
    lastMove = t;
    wakeFromPointer();
  }, true);

  // The menu toggle shows or hides the action buttons (setMenuOpen).
  function setMenuOpen(open) {
    if (open) { show("actionRow"); $("actAdhan").focus(); }
    else { hide("actionRow"); $("menuToggle").focus(); }
  }

  // ------------------------------------------------------------------ settings screen
  var draft = null;

  function opt(label, selected, onClick) {
    var b = document.createElement("button");
    b.className = "nav opt" + (selected ? " sel" : "");
    b.appendChild(document.createTextNode(label));
    b.onclick = onClick;
    return b;
  }
  function row(label, buttons, note) {
    var r = document.createElement("div");
    r.className = "row";
    var l = document.createElement("div");
    l.className = "label";
    l.appendChild(document.createTextNode(label));
    r.appendChild(l);
    var o = document.createElement("div");
    o.className = "opts";
    for (var i = 0; i < buttons.length; ++i) o.appendChild(buttons[i]);
    r.appendChild(o);
    var frag = document.createDocumentFragment();
    frag.appendChild(r);
    if (note) { var n = document.createElement("div"); n.className = "note"; n.appendChild(document.createTextNode(note)); frag.appendChild(n); }
    return frag;
  }
  function choice(field, values, labels) {
    var out = [];
    for (var i = 0; i < values.length; ++i) {
      (function (v) { out.push(opt(labels[i], draft[field] === v, function () { draft[field] = v; buildSettings(this.id); })); })(values[i]);
      out[out.length - 1].id = "opt_" + field + "_" + i;
    }
    return out;
  }
  function localizeDurations(values, offLabel) {
    var out = [];
    for (var i = 0; i < values.length; ++i) {
      var v = values[i];
      out.push(v < 60 ? v + " s" : (v / 60) + " " + S("dash_min"));
    }
    out.push(offLabel);
    return out;
  }

  function buildSettings(focusId) {
    var saved = settings.lang;
    settings.lang = draft.lang; // labels follow the language being chosen
    $("settings").setAttribute("dir", RTL[draft.lang] ? "rtl" : "ltr");
    $("settingsTitle").innerHTML = escapeHtml(S("settings"));
    $("saveSettings").innerHTML = escapeHtml(S("save"));
    $("cancelSettings").innerHTML = escapeHtml(S("cancel"));
    $("openCredits").innerHTML = escapeHtml(Wt(W_CREDITS));
    disarmReset();
    var body = $("settingsBody");
    var scroll = body.scrollTop;
    body.innerHTML = "";
    var langNames = [];
    for (var i = 0; i < LANGS.length; ++i) langNames.push(LANG_NAMES[LANGS[i]]);
    body.appendChild(row(S("language"), choice("lang", LANGS, langNames)));
    body.appendChild(row(S("show_mihrap_translations"), choice("mihrapTr", [true, false], [Wt(W_ON), Wt(W_OFF)])));
    // Screensaver languages: the menu language is always included; ticked ones are mixed into the slides.
    var saverButtons = [];
    for (i = 0; i < LANGS.length; ++i) {
      (function (code, index) {
        var locked = code === draft.lang;
        var on = locked || (draft.saverLangs || []).indexOf(code) >= 0;
        var b = opt((on ? "✓ " : "") + LANG_NAMES[code], on, function () {
          if (locked) return;
          var list = (draft.saverLangs || []).slice(), at2 = list.indexOf(code);
          if (at2 >= 0) list.splice(at2, 1); else list.push(code);
          draft.saverLangs = list;
          buildSettings(this.id);
        });
        if (locked) b.style.opacity = "0.6";
        b.id = "opt_saverLangs_" + index;
        saverButtons.push(b);
      })(LANGS[i], i);
    }
    body.appendChild(row(S("screensaver_languages"), saverButtons, S("screensaver_languages_desc")));

    var loc = [
      opt(S("country") + ": " + (draft.countryName || "—"), false, function () { openPicker("country"); }),
      opt(S("city") + ": " + (draft.cityName || "—"), false, function () { if (draft.countryId) openPicker("city"); }),
      opt(S("district") + ": " + (draft.districtName || "—"), false, function () { if (draft.cityId) openPicker("district"); })
    ];
    loc[0].id = "loc_country"; loc[1].id = "loc_city"; loc[2].id = "loc_district";
    body.appendChild(row(S("location_section"), loc));

    var themeValues = [], themeLabels = [];
    for (i = 0; i < PRESETS.length; ++i) { themeValues.push(i); themeLabels.push(S(PRESETS[i].name).replace(/\s+[—-].*$/, "")); }
    body.appendChild(row(S("home_theme"), choice("theme", themeValues, themeLabels)));

    body.appendChild(row(S("azan_type_section"), choice("azan", ["turkey", "mecca", "egypt", "off"],
      [S("azan_turkey").replace(/\s+[—-].*$/, ""), S("azan_mecca"), S("azan_egypt"), Wt(W_ADHAN_OFF)])));
    body.appendChild(row(S("dua_after_adhan"), choice("dua", [true, false], [Wt(W_ON), Wt(W_OFF)])));
    body.appendChild(row(S("tesbihat_after_adhan"), choice("tesbihat", [true, false], [Wt(W_ON), Wt(W_OFF)])));
    if (draft.tesbihat) {
      var delays = [5, 15, 30, 45, 60], delayLabels = [];
      for (i = 0; i < delays.length; ++i) delayLabels.push(format(S("tesbihat_minutes"), delays[i]));
      body.appendChild(row(S("tesbihat_delay"), choice("tesbihatDelay", delays, delayLabels)));
    }
    body.appendChild(row(S("tesbihat"), choice("tesbihatSet", [1, 2], [S("tesbihat_set1"), S("tesbihat_set2")]),
      S("tesbihat_name_tercuman") + " / " + S("tesbihat_name_ismi_azam")));
    body.appendChild(row(S("reminder_section"), choice("reminder", [true, false], [Wt(W_ON), Wt(W_OFF)]), S("reminder_desc")));
    var calcLabels = [];
    for (i = 0; i < CALC_ORDER.length; ++i) calcLabels.push(calcName(CALC_ORDER[i]));
    body.appendChild(row(S("calc_method_section"), choice("calc", CALC_ORDER, calcLabels),
      draft.calc === "diyanet" ? S("calc_source_diyanet") : ""));
    if (draft.calc !== "diyanet") {
      body.appendChild(row(S("asr_method_desc"), choice("asr", ["standard", "hanafi"], [S("asr_evvel"), S("asr_sani")])));
    }
    body.appendChild(row(Wt(W_SAVER_AFTER), choice("idle", [30, 60, 120, 300, 600, 0], localizeDurations([30, 60, 120, 300, 600], Wt(W_OFF)))));
    body.appendChild(row(S("slide_seconds"), choice("slide", [10, 20, 30, 60], ["10", "20", "30", "60"])));
    settings.lang = saved;
    body.scrollTop = scroll;
    focusFirst(focusId ? $(focusId) : null);
  }

  function openSettings() {
    draft = clone(settings);
    show("settings");
    hide("home");
    $("settingsBody").scrollTop = 0;
    buildSettings();
  }
  function closeSettings(save) {
    if (save) {
      var placeChanged = draft.districtId !== settings.districtId;
      settings = draft;
      store("settings", settings);
      applyLanguage();
      if (placeChanged) { rows = []; rowsDistrict = ""; computedCache.key = ""; fetchTimes(); }
      computedCache.key = "";
      ensureCoordinates();
      actionStyled = -1;
      cacheAudio();
    }
    hide("settings");
    show("home");
    hide("actionRow");
    touch();
    tick(true);
    focusFirst();
  }

  // ------------------------------------------------------------------ reset (two presses, so a stray OK cannot wipe it)
  var resetArmed = null;
  function disarmReset() {
    if (resetArmed) { clearTimeout(resetArmed); resetArmed = null; }
    var b = $("resetSettings");
    b.className = "nav big danger";
    var saved = settings.lang;
    if (draft) settings.lang = draft.lang;
    b.innerHTML = escapeHtml(Wt(W_RESET));
    settings.lang = saved;
  }
  function resetPressed() {
    if (!resetArmed) {
      var b = $("resetSettings");
      b.className = "nav big danger armed";
      b.innerHTML = escapeHtml(Wt(W_RESET_SURE));
      resetArmed = setTimeout(disarmReset, 5000);
      return;
    }
    try {
      var keys = [];
      for (var i = 0; i < window.localStorage.length; ++i) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf("mihrap_") === 0) keys.push(k);
      }
      for (i = 0; i < keys.length; ++i) window.localStorage.removeItem(keys[i]);
    } catch (e) { }
    location.reload();
  }

  // ------------------------------------------------------------------ location picker (SearchableSpinner: A-Z jump)
  var pickerKind = "";
  var pickerPlaces = [];
  function openPicker(kind) {
    pickerKind = kind;
    var english = draft.lang !== "tr";
    var url, idKey, trKey, enKey, title;
    if (kind === "country") { url = "https://ezanvakti.emushaf.net/ulkeler"; idKey = "UlkeID"; trKey = "UlkeAdi"; enKey = "UlkeAdiEn"; title = S("country"); }
    else if (kind === "city") { url = "https://ezanvakti.emushaf.net/sehirler/" + encodeURIComponent(draft.countryId); idKey = "SehirID"; trKey = "SehirAdi"; enKey = "SehirAdiEn"; title = S("city"); }
    else { url = "https://ezanvakti.emushaf.net/ilceler/" + encodeURIComponent(draft.cityId); idKey = "IlceID"; trKey = "IlceAdi"; enKey = "IlceAdiEn"; title = S("district"); }
    var saved = settings.lang;
    settings.lang = draft.lang;
    $("pickerTitle").innerHTML = escapeHtml(title);
    var list = $("pickerList");
    list.innerHTML = '<div class="note" style="margin:0">' + escapeHtml(S("loading")) + "</div>";
    settings.lang = saved;
    $("pickerLetters").innerHTML = "";
    list.scrollTop = 0;
    show("picker");
    getJson(url, function (items) {
      if (pickerKind !== kind || !isShown("picker")) return;
      var places = [];
      for (var i = 0; i < items.length; ++i) {
        var it = items[i];
        var tr = String(it[trKey] || "").trim(), en = String(it[enKey] || "").trim();
        var name = english ? (en || tr) : (tr || en);
        places.push({ id: String(it[idKey]), name: name || "?" });
      }
      places.sort(function (a, b) { return a.name.localeCompare ? a.name.localeCompare(b.name, english ? "en" : "tr") : (a.name < b.name ? -1 : 1); });
      if (places.length === 1) { pick(kind, places[0]); return; } // e.g. United Kingdom has one "city"
      pickerPlaces = places;
      list.innerHTML = "";
      var current = kind === "country" ? draft.countryId : kind === "city" ? draft.cityId : draft.districtId;
      var focusEl = null;
      for (i = 0; i < places.length; ++i) {
        (function (p) {
          var b = opt(p.name, p.id === current, function () { pick(kind, p); });
          if (p.id === current) focusEl = b;
          list.appendChild(b);
        })(places[i]);
      }
      // Letter buttons jump to the first entry with that initial.
      var letters = $("pickerLetters");
      var seen = {};
      for (i = 0; i < places.length; ++i) {
        var ch = stripMarks(places[i].name.charAt(0)).toUpperCase();
        if (!/[A-Z]/.test(ch) || seen.hasOwnProperty(ch)) continue;
        seen[ch] = i;
        (function (letter, index) {
          var b = document.createElement("button");
          b.className = "nav letter";
          b.appendChild(document.createTextNode(letter));
          b.onclick = function () { var target = list.children[index]; if (target) { target.focus(); keepVisible(target); } };
          letters.appendChild(b);
        })(ch, i);
      }
      focusFirst(focusEl || list.children[0]);
    }, function () {
      list.innerHTML = '<div class="note" style="margin:0">' + escapeHtml(S("times_fetch_failed")) + "</div>";
    });
  }
  function pick(kind, p) {
    if (kind === "country") {
      if (draft.countryId !== p.id) { draft.cityId = ""; draft.cityName = ""; draft.districtId = ""; draft.districtName = ""; }
      draft.countryId = p.id; draft.countryName = p.name;
      openPicker("city");
    } else if (kind === "city") {
      if (draft.cityId !== p.id) { draft.districtId = ""; draft.districtName = ""; }
      draft.cityId = p.id; draft.cityName = p.name;
      openPicker("district");
    } else {
      draft.districtId = p.id; draft.districtName = p.name;
      hide("picker");
      buildSettings("loc_district");
    }
  }
  function closePicker() {
    hide("picker");
    buildSettings(pickerKind === "country" ? "loc_country" : pickerKind === "city" ? "loc_city" : "loc_district");
  }

  // ------------------------------------------------------------------ credits (CC BY / BY-SA attribution)
  function openCredits() {
    $("creditsTitle").innerHTML = escapeHtml(Wt(W_CREDITS));
    $("closeCredits").innerHTML = escapeHtml(S("close"));
    var list = $("creditsList");
    list.innerHTML = escapeHtml(S("loading"));
    show("credits");
    focusFirst();
    getJson("data/credits.json", function (c) {
      var html = "";
      var photos = c.photos || [];
      for (var i = 0; i < photos.length; ++i) {
        var p = photos[i];
        html += "<p>#" + ("00" + p.id).slice(-3) + " · " + escapeHtml(p.title || "") + " — " + escapeHtml(p.creator || "") + " · " +
          escapeHtml(p.license || "") + "<br><small>" + escapeHtml(p.url || "") + "</small></p>";
      }
      html += "<p>Fonts: Amiri, Scheherazade New, Noto Serif — SIL Open Font License; Roboto, Droid Sans Mono — Apache License 2.0.</p>";
      list.innerHTML = html;
      list.scrollTop = 0;
    });
  }

  // ------------------------------------------------------------------ language
  var START_TR = null;
  function applyLanguage() {
    document.documentElement.lang = settings.lang;
    $("startButton").innerHTML = escapeHtml(Wt(W_START));
    $("startHint").innerHTML = escapeHtml(Wt(W_HINT));
    // The start page's description is written in Turkish in index.html (for search engines); English elsewhere.
    if (!START_TR) START_TR = [$("startTagline").innerHTML, $("startFacts").innerHTML];
    var en = settings.lang !== "tr";
    $("startTagline").innerHTML = en ? "Prayer times, adhan and reflection screen" : START_TR[0];
    $("startFacts").innerHTML = en ? "<li>Diyanet times or 14 calculation methods</li><li>Adhan on time; optional dua and tesbihat</li>" +
      "<li>Reflection screensaver: Quran verses, hadith and the 99 Names</li><li>Smart TV, tablet, phone and computer; 10 languages</li>" : START_TR[1];
    $("lblAdhan").innerHTML = escapeHtml(S("ezan_oku"));
    $("lblSettings").innerHTML = escapeHtml(S("settings"));
    $("lblClose").innerHTML = escapeHtml(S("kapat"));
    $("eventOverlay").setAttribute("dir", RTL[settings.lang] ? "rtl" : "ltr");
  }

  // ------------------------------------------------------------------ start and main loop
  function requestFullscreen() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (fn) { try { var p = fn.call(el); if (p && p.catch) p.catch(function () { }); } catch (e) { } }
  }
  function keepAwake() {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    try { navigator.wakeLock.request("screen").then(function () { }, function () { }); } catch (e) { }
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(); });

  function unlock(audio) {
    // A muted play inside the press lets later sounds play without a press.
    try {
      audio.muted = true;
      audio.src = DATA.audio.dua;
      var p = audio.play();
      var after = function () { try { audio.pause(); audio.currentTime = 0; } catch (e) { } audio.muted = false; };
      if (p && p.then) p.then(after, after); else setTimeout(after, 300);
    } catch (e) { audio.muted = false; }
  }
  function begin() {
    unlock(player);
    unlock($("cue"));
    requestFullscreen();
    keepAwake();
    hide("start");
    touch();
    if (!settings.districtId) openSettings(); else focusFirst();
  }

  function tick(force) {
    var now = new Date();
    var row = rowFor(now);
    renderHome(now);
    renderSaverOverlay(now);
    if (!isShown("start") && !isShown("settings")) {
      checkReminder(now, row);
      checkAdhan(now, row);
      maybeStartScheduledTesbihat();
    }
    updateTesbihatButton(now);
    if (force !== true) {
      if (isShown("home") && !anyLayer() && settings.idle > 0 && Date.now() - lastActivity > settings.idle * 1000) startSaver();
      if (now.getSeconds() === 0 && now.getMinutes() % 30 === 0) {
        if (needsFetch()) fetchTimes();
        cacheAudio();
      }
    }
  }

  function init() {
    fitStage();
    window.addEventListener("resize", fitStage);
    applyLanguage();
    $("icAdhan").innerHTML = iconSvg(DATA.icons.adhan);
    $("icSettings").innerHTML = iconSvg(DATA.icons.settings);
    $("startButton").onclick = begin;
    $("menuToggle").onclick = function () { setMenuOpen(!isShown("actionRow")); };
    $("actAdhan").onclick = function () { hide("actionRow"); toggleAdhan(); };
    $("actSettings").onclick = function () { hide("actionRow"); openSettings(); };
    $("actTesbihat").onclick = function () { toggleTesbihat(); };
    $("icTesbihat").innerHTML = iconSvg(DATA.icons.tesbihat);
    $("icClose").innerHTML = iconSvg(DATA.icons.close);
    $("actClose").onclick = closeApp;
    $("adhanStop").onclick = stopAdhan;
    // MainActivity.dispatchTouchEvent: during the adhan a double tap (within 550 ms, 150 px) stops it
    // and returns to the clock; single taps are ignored so a stray touch does not cut it off.
    var lastAdhanTap = { t: 0, x: 0, y: 0 };
    var adhanTap = function (e) {
      var p = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;
      var now = Date.now(), dx = p.clientX - lastAdhanTap.x, dy = p.clientY - lastAdhanTap.y;
      var doubleTap = now - lastAdhanTap.t <= 550 && dx * dx + dy * dy <= 22500;
      lastAdhanTap = doubleTap ? { t: 0, x: 0, y: 0 } : { t: now, x: p.clientX, y: p.clientY };
      if (e.type === "touchend") e.preventDefault(); // no extra click after the touch
      if (doubleTap && adhanState) stopAdhan();
    };
    $("adhan").addEventListener("touchend", adhanTap, false);
    $("adhan").addEventListener("click", adhanTap, false);
    $("saveSettings").onclick = function () { closeSettings(true); };
    $("cancelSettings").onclick = function () { closeSettings(false); };
    $("openCredits").onclick = openCredits;
    $("resetSettings").onclick = resetPressed;
    $("resetSettings").onblur = disarmReset;
    $("closeCredits").onclick = function () { hide("credits"); focusFirst(); };
    tick(true);
    if (needsFetch()) fetchTimes();
    // As soon as the connection is back: top up the 90 days and the recordings.
    window.addEventListener("online", function () { if (needsFetch(true)) fetchTimes(); cacheAudio(); });
    setTimeout(cacheAudio, 15000);
    ensureCoordinates();
    loadTexts("en", function () { loadTexts(settings.lang, function () { }); });
    if (document.fonts && document.fonts.load) {
      var faces = ['40px "Amiri"', '40px "Scheherazade"', '40px "MihrapSerif"', 'bold 40px "MihrapSerif"', '40px "MRoboto"',
        'bold 40px "MRoboto"', '40px "MRobotoThin"', '40px "MMono"'];
      for (var i = 0; i < faces.length; ++i) { try { document.fonts.load(faces[i]); } catch (e) { } }
    }
    focusFirst();
    setInterval(tick, 1000);
    // Installable web app: the service worker lets Chrome offer "Install app / Add to Home screen".
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
      try { navigator.serviceWorker.register("sw.js").then(function () { }, function () { }); } catch (e) { }
    }
    if (location.hash === "#debug") {
      // Test hooks, only with #debug in the address.
      window.mihrapDebug = { saver: startSaver, pick: nextRandom, tesbihat: toggleTesbihat, adhan: function (k) { playAdhan(k, new Date()); },
        settings: function () { return settings; }, theme: function (i) { settings.theme = i; actionStyled = -1; tick(true); },
        reminder: function (k) { showEventOverlay(prayerName(k, new Date()), format(S("frame_prayer_in_minutes"), 15), 12000); toast(format(S("reminder_toast"), prayerName(k, new Date()), 15)); } };
    }
  }

  init();
})();
