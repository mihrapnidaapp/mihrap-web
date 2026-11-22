/* Mihrap web — browser version of the Mihrap tablet app for smart-TV browsers.
 * Plain ES5 on purpose: TV browsers (Tizen, webOS, Vidaa, Android TV) often run old Chromium builds.
 * Ported from the Android sources: PrayerApi, PrayerCalculator, CalculatedTimes, HijriDays,
 * ScreensaverTextRenderer, AdhanHelper (selection and rotation) and the Board home theme.
 */
(function () {
  "use strict";

  var DATA = window.MIHRAP_DATA;
  var KEYS = ["Imsak", "Gunes", "Ogle", "Ikindi", "Aksam", "Yatsi"];
  var LANGS = ["tr", "en", "de", "ar", "fa", "id", "ms", "zh", "ur", "hi"];
  var LANG_NAMES = { tr: "Türkçe", en: "English", de: "Deutsch", ar: "العربية", fa: "فارسی", id: "Bahasa Indonesia",
    ms: "Bahasa Melayu", zh: "中文", ur: "اردو", hi: "हिन्दी" };
  var RTL = { ar: true, fa: true, ur: true };

  // Web-only texts (the rest come from the Android string resources).
  var WEB = {
    tr: ["Başlat", "Ezan sesinin çalabilmesi için kumandayla bir kez basın.", "Kapalı", "Görsel kaynakları", "Açık", "Kapalı", "Ekran koruyucu süresi", "Ayarları sıfırla", "Emin misiniz? Tekrar basın"],
    en: ["Start", "Press once with the remote so the adhan can play.", "Off", "Image credits", "On", "Off", "Screensaver after", "Reset settings", "Are you sure? Press again"],
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
  function format(template, a, b) {
    return String(template).replace("%1$s", a).replace("%2$s", b === undefined ? "" : b).replace("%s", a);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ------------------------------------------------------------------ settings
  function defaultLanguage() {
    var nav = String(navigator.language || navigator.userLanguage || "tr").toLowerCase().substring(0, 2);
    if (nav === "in") nav = "id";
    return LANGS.indexOf(nav) >= 0 ? nav : "tr";
  }
  var settings = load("settings", null) || {};
  var DEFAULTS = { lang: defaultLanguage(), countryId: "", countryName: "", cityId: "", cityName: "", districtId: "", districtName: "",
    azan: "turkey", dua: true, calc: "diyanet", asr: "standard", idle: 30, slide: 20, mihrapTr: true };
  for (var dk in DEFAULTS) if (DEFAULTS.hasOwnProperty(dk) && settings[dk] === undefined) settings[dk] = DEFAULTS[dk];

  function S(key) {
    var table = DATA.strings[settings.lang] || DATA.strings.en;
    var v = table[key];
    return v === undefined ? (DATA.strings.en[key] || "") : v;
  }
  function Wt(i) { return (WEB[settings.lang] || WEB.en)[i]; }
  function prayerName(key, day) {
    if (key === "Ogle" && day && day.getDay() === 5) return S("prayer_cuma");
    return S("prayer_" + key);
  }

  // ------------------------------------------------------------------ stage scaling
  function fitStage() {
    var stage = $("stage");
    var w = window.innerWidth || document.documentElement.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight;
    var scale = Math.min(w / 1920, h / 1080);
    var left = Math.round((w - 1920 * scale) / 2), top = Math.round((h - 1080 * scale) / 2);
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
    end.setDate(end.getDate() + 29);
    var finish = function (list) {
      fetching = false;
      if (list && list.length) {
        rows = list; rowsDistrict = district; rowsFetchedAt = Date.now(); fetchError = false;
        store("times_rows", rows); store("times_district", district); store("times_fetched", rowsFetchedAt);
      } else {
        fetchError = true;
      }
      if (done) done();
      render(true);
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

  function needsFetch() {
    if (!settings.districtId) return false;
    if (rowsDistrict !== settings.districtId || !rows.length) return true;
    var ahead = new Date();
    ahead.setDate(ahead.getDate() + 3);
    if (!rowFor(ahead)) return true;
    return Date.now() - rowsFetchedAt > 7 * 86400000;
  }

  // ------------------------------------------------------------------ computed times (CalculatedTimes)
  var METHODS = { mwl: [18.0, 17.0, 0.0], isna: [15.0, 15.0, 0.0], egypt: [19.5, 17.5, 0.0], makkah: [18.5, -90.0, 0.0],
    karachi: [18.0, 18.0, 0.0], tehran: [17.7, 14.0, 4.5] };
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
    if (m[1] < 0) isha = maghrib - m[1] / 60.0;
    var night = 24.0 - (sunset - sunrise);
    var fajrPortion = m[0] / 60.0 * night;
    if (isNaN(fajr) || sunrise - fajr > fajrPortion) fajr = sunrise - fajrPortion;
    if (m[1] > 0) {
      var ishaPortion = m[1] / 60.0 * night;
      if (isNaN(isha) || isha - sunset > ishaPortion) isha = sunset + ishaPortion;
    }
    dhuhr += 1.0 / 60.0;
    return [hm(fajr), hm(sunrise), hm(dhuhr), hm(asr), hm(maghrib), hm(isha)];
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
          render(true);
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

  // Civil date like "ÇAR, 28 EKİ" in the menu language (own tables for tr/en/de; Intl otherwise).
  var CIVIL = {
    tr: [["PAZ", "PZT", "SAL", "ÇAR", "PER", "CUM", "CMT"], ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"]],
    en: [["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]],
    de: [["SO", "MO", "DI", "MI", "DO", "FR", "SA"], ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"]]
  };
  function civilDate(d) {
    var t = CIVIL[settings.lang];
    if (!t) {
      try {
        return d.toLocaleDateString(settings.lang, { weekday: "short", day: "2-digit", month: "short" });
      } catch (e) { t = CIVIL.en; }
    }
    return t[0][d.getDay()] + ", " + pad(d.getDate()) + " " + t[1][d.getMonth()];
  }

  // ------------------------------------------------------------------ home rendering
  var lastMinuteRendered = "";
  function countdown(next, now) {
    var sec = Math.max(0, Math.floor((next.when.getTime() - now.getTime()) / 1000));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? h + ":" + pad(m) : m + " " + S("dash_min");
  }
  function untilLabel(key, now) {
    if (key === "Ogle" && now.getDay() === 5) return S("dash_to_cuma");
    return S("dash_to_" + key);
  }

  function render(force) {
    var now = new Date();
    var clock = pad(now.getHours()) + ":" + pad(now.getMinutes());
    $("clock").innerHTML = clock;
    var row = rowFor(now);
    var next = findNext(now);
    var active = activeKey(row, now);
    var suffix = S("time_left_suffix");
    if (next) {
      $("discTitle").innerHTML = escapeHtml(untilLabel(next.key, now));
      $("discValue").innerHTML = escapeHtml(countdown(next, now) + (suffix ? "\n" + suffix : ""));
    } else {
      $("discTitle").innerHTML = "";
      $("discValue").innerHTML = "--";
    }
    var minuteKey = clock + "|" + dateKey(now) + "|" + settings.lang + "|" + rowsFetchedAt + "|" + settings.calc + "|" + (coordinates() ? 1 : 0);
    if (!force && minuteKey === lastMinuteRendered) { renderSaverStrip(now, row, next, active); return; }
    lastMinuteRendered = minuteKey;

    var place = settings.districtName ? settings.districtName + (settings.cityName && settings.cityName !== settings.districtName ? ", " + settings.cityName : "") : "";
    $("placeLine").innerHTML = escapeHtml(place);
    var hijri = hijriText(hijriParts(row));
    $("dateLine").innerHTML = escapeHtml(civilDate(now) + (hijri ? "  ·  " + hijri : ""));
    $("eventLine").innerHTML = escapeHtml(eventFor(now));

    var html = "";
    for (var i = 0; i < KEYS.length; ++i) {
      var k = KEYS[i];
      html += '<div class="card' + (k === active ? " active" : "") + '"><div class="t">' + escapeHtml(row ? row[k] || "--:--" : "--:--") +
        '</div><div class="n">' + escapeHtml(prayerName(k, now).toLocaleUpperCase ? prayerName(k, now).toLocaleUpperCase(settings.lang) : prayerName(k, now).toUpperCase()) + "</div></div>";
    }
    $("cards").innerHTML = html;

    var msg = "";
    if (!settings.districtId) msg = S("location_required");
    else if (!row && fetching) msg = S("loading");
    else if (!row && fetchError) msg = S("times_fetch_failed");
    else if (METHODS[settings.calc] && !coordinates()) msg = S("calc_source_pending");
    $("homeMessage").innerHTML = escapeHtml(msg);
    renderSaverStrip(now, row, next, active);
  }

  function renderSaverStrip(now, row, next, active) {
    if ($("saver").className.indexOf("hidden") >= 0) return;
    $("saverClock").innerHTML = "<b>" + pad(now.getHours()) + ":" + pad(now.getMinutes()) + "</b>" + escapeHtml(civilDate(now));
    var html = "";
    for (var i = 0; i < KEYS.length; ++i) {
      html += "<span" + (KEYS[i] === active ? ' class="active"' : "") + ">" + escapeHtml(prayerName(KEYS[i], now)) + "<b>" +
        escapeHtml(row ? row[KEYS[i]] || "--:--" : "--:--") + "</b></span>";
    }
    $("saverTimes").innerHTML = html;
    $("saverNext").innerHTML = next ? escapeHtml(untilLabel(next.key, now)) + "<b>" + escapeHtml(countdown(next, now)) + "</b>" : "";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ------------------------------------------------------------------ adhan (AdhanHelper)
  var player = $("player");
  var adhanState = null; // {key, phase: "adhan"|"dua"}
  var played = load("adhan_played", {});

  function checkAdhan(now) {
    if (settings.azan === "off" || !DATA.audio[settings.azan]) return;
    var row = rowFor(now);
    if (!row) return;
    var hhmm = pad(now.getHours()) + ":" + pad(now.getMinutes());
    var today = dateKey(now);
    for (var i = 0; i < KEYS.length; ++i) {
      var key = KEYS[i];
      if (key === "Gunes") continue; // as on the tablets: no adhan at sunrise
      var mark = today + "|" + key;
      if (row[key] === hhmm && !played[mark]) {
        played = {};
        played[mark] = true;
        store("adhan_played", played);
        playAdhan(key, now);
        return;
      }
    }
  }

  function playAdhan(key, now) {
    var tracks = DATA.audio[settings.azan][key];
    if (!tracks || !tracks.length) return;
    var rot = load("adhan_rotation", {});
    var index = (rot[settings.azan + key] || 0) % tracks.length;
    rot[settings.azan + key] = index + 1;
    store("adhan_rotation", rot);
    stopSaver();
    adhanState = { key: key, phase: "adhan" };
    $("adhanName").innerHTML = escapeHtml(prayerName(key, now));
    $("adhanTime").innerHTML = escapeHtml(pad(now.getHours()) + ":" + pad(now.getMinutes()));
    $("stopAdhan").innerHTML = escapeHtml(S("stop_adhan"));
    show("adhan");
    focusFirst();
    playFile(tracks[index]);
  }

  function playFile(src) {
    player.src = src;
    try {
      var p = player.play();
      if (p && p.catch) p.catch(function () { /* blocked: overlay stays so a press can stop it */ });
    } catch (e) { }
  }

  player.addEventListener("ended", function () {
    if (adhanState && adhanState.phase === "adhan" && settings.dua && adhanState.key !== "Gunes") {
      adhanState.phase = "dua";
      playFile(DATA.audio.dua);
      return;
    }
    stopAdhan();
  });
  player.addEventListener("error", function () { if (adhanState) stopAdhan(); });

  function stopAdhan() {
    adhanState = null;
    try { player.pause(); } catch (e) { }
    hide("adhan");
    touch();
    focusFirst();
  }

  // ------------------------------------------------------------------ screensaver (ScreensaverTextRenderer)
  var texts = {};
  var deck = [];
  var saverTimer = null;
  var saverFront = "slideA";
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
  function record(id) {
    var r = texts[settings.lang] && texts[settings.lang][id];
    if (r) return { r: r, lang: settings.lang };
    r = texts.en && texts.en[id];
    return r ? { r: r, lang: "en" } : null;
  }
  function isHidden(id) {
    if (settings.mihrapTr) return false;
    var r = texts[settings.lang] && texts[settings.lang][id];
    return !!(r && r.translation === "mihrap" && r.category !== "ESMA");
  }
  function buildDeck() {
    var ids = DATA.slides.slice();
    for (var i = 0; i < DATA.esmaCount; ++i) ids.push(DATA.esmaFirst + i);
    var out = [];
    for (i = 0; i < ids.length; ++i) if (!isHidden(ids[i])) out.push(ids[i]);
    for (i = out.length - 1; i > 0; --i) { var j = Math.floor(Math.random() * (i + 1)); var t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }

  function startSaver() {
    loadTexts("en", function () {
      loadTexts(settings.lang, function () {
        if (!isShown("home") || anyLayer()) return;
        hide("home");
        show("saver");
        $("slideA").className = ""; $("slideB").className = "";
        saverToken++;
        deck = [];
        render(true);
        nextSlide(saverToken);
      });
    });
  }
  function stopSaver() {
    if (!isShown("saver")) return;
    saverToken++;
    if (saverTimer) { clearTimeout(saverTimer); saverTimer = null; }
    hide("saver");
    show("home");
    render(true);
  }
  function nextSlide(token) {
    if (token !== saverToken) return;
    if (!deck.length) deck = buildDeck();
    var id = deck.shift();
    var img = new Image();
    img.onload = function () {
      if (token !== saverToken) return;
      var back = saverFront === "slideA" ? "slideB" : "slideA";
      var canvas = $(back);
      drawSlide(canvas, img, id);
      $(back).className = "on";
      $(saverFront).className = "";
      saverFront = back;
      saverTimer = setTimeout(function () { nextSlide(token); }, Math.max(5, settings.slide) * 1000);
    };
    img.onerror = function () { saverTimer = setTimeout(function () { nextSlide(token); }, 1000); };
    img.src = id >= DATA.esmaFirst ? "slides/esma.jpg" : "slides/" + ("00" + id).slice(-3) + ".jpg";
  }

  function arabicScript(lang) { return lang === "ar" || lang === "fa" || lang === "ur"; }
  function serifFace(arabic) { return arabic ? '"Amiri", serif' : '"MihrapSerif", "Noto Serif", Georgia, serif'; }

  function drawSlide(canvas, img, id) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Cover the canvas with the photo (they are 1920x1080 already).
    var scale = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
    var rec = record(id);
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

  function setFont(ctx, size, face, bold) { ctx.font = (bold ? "bold " : "") + Math.round(size * 10) / 10 + "px " + face; }

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
    var face = serifFace(arabic);
    var maxWidth = right - left - w * 0.07, maxTextHeight = h * 0.48;
    var size = base * (arabic ? 0.041 : 0.038), minSize = base * 0.022;
    var lines = null, used = size;
    while (size >= minSize) {
      setFont(ctx, size, face);
      lines = wrap(ctx, r.text, maxWidth);
      used = size;
      if (lines.length * size * (arabic ? 1.48 : 1.30) <= maxTextHeight) break;
      size -= Math.max(1, w * 0.0015);
    }
    if (!lines) return;
    size = used;
    setFont(ctx, size, face);
    var lineHeight = size * (arabic ? 1.48 : 1.30);
    var y = top + ((textBottom - top) - lines.length * lineHeight) * 0.5 + size;
    var center = w * 0.5;
    // The first line chooses the tone for the whole quotation.
    var t = tone(ctx, w, h, center, ctx.measureText(lines[0]).width, y - size, y + size * 0.25);
    for (var i = 0; i < lines.length; ++i) { drawToned(ctx, lines[i], center, y, size, t, t.text); y += lineHeight; }

    var srcSize = base * (arabic ? 0.022 : 0.020);
    setFont(ctx, srcSize, arabic ? '"Amiri", serif' : '"Segoe UI", Roboto, "Noto Sans", Arial, sans-serif', true);
    var source = cleanAttribution(r.source_display || r.source || "");
    var srcLines = wrap(ctx, source, maxWidth * 0.86);
    var sy = dividerY + h * 0.055;
    for (i = 0; i < srcLines.length; ++i) { drawToned(ctx, srcLines[i], center, sy, srcSize, t, t.source); sy += srcSize * 1.22; }
  }

  function drawEsma(ctx, w, h, r, arabic, showMeaning) {
    var base = w, center = w * 0.5, maxWidth = w * 0.74;
    var areaTop = h * 0.12, areaBottom = h * 0.78;
    var amiri = '"Amiri", serif', serif = serifFace(false);
    var nameAr = r.name_ar || "", name = arabic ? "" : (r.name || ""), meaning = showMeaning ? (r.meaning || "") : "";
    var meaningFace = meaning && /^[؀-ۿ]/.test(meaning) ? amiri : serif;
    var scale = 1, arSize, nameSize, meaningSize, gap, meaningLine, total, meaningLines;
    // Glyph boxes are approximated from the font size (canvas has no getTextBounds in old browsers).
    var arH, nameH;
    while (true) {
      arSize = base * (arabic ? 0.12 : 0.095) * scale;
      setFont(ctx, arSize, amiri);
      while (ctx.measureText(nameAr).width > maxWidth) { arSize *= 0.95; setFont(ctx, arSize, amiri); }
      arH = arSize * 1.05;
      nameSize = base * 0.044 * scale;
      meaningSize = base * 0.028 * scale;
      gap = base * 0.0225 * scale;
      meaningLine = meaningSize * 1.3;
      nameH = nameSize * 0.75;
      total = arH;
      if (name) total += gap + nameH;
      setFont(ctx, meaningSize, meaningFace);
      meaningLines = meaning ? wrap(ctx, meaning, maxWidth) : [];
      if (meaningLines.length) total += gap * 0.8 + meaningSize + (meaningLines.length - 1) * meaningLine;
      if (total <= areaBottom - areaTop || scale < 0.6) break;
      scale *= 0.93;
    }
    var top = areaTop + (areaBottom - areaTop - total) * 0.5;
    setFont(ctx, arSize, amiri);
    var widest = ctx.measureText(nameAr).width;
    if (name) { setFont(ctx, nameSize, serif); widest = Math.max(widest, ctx.measureText(name).width); }
    setFont(ctx, meaningSize, meaningFace);
    for (var i = 0; i < meaningLines.length; ++i) widest = Math.max(widest, ctx.measureText(meaningLines[i]).width);
    var t = tone(ctx, w, h, center, widest, top, top + total);
    var y = top + arH * 0.8;
    setFont(ctx, arSize, amiri);
    drawToned(ctx, nameAr, center, y, arSize, t, t.text);
    y += arH * 0.2;
    if (name) {
      y += gap + nameH;
      setFont(ctx, nameSize, serif);
      drawToned(ctx, name, center, y, nameSize, t, t.text);
    }
    if (meaningLines.length) {
      y += gap * 0.8 + meaningSize;
      setFont(ctx, meaningSize, meaningFace);
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
    if (isShown("credits") && (code === 38 || code === 40)) {
      $("creditsList").scrollTop += code === 40 ? 240 : -240;
      e.preventDefault();
      return;
    }
    if (isShown("picker") && !isShown("credits") && (code === 37 || code === 39)) {
      // Long lists: left/right jump ten entries.
      var items = focusables($("picker"));
      var pos = items.indexOf(document.activeElement);
      var target = items[Math.max(0, Math.min(items.length - 1, (pos < 0 ? 0 : pos) + (code === 39 ? 10 : -10)))];
      if (target) { target.focus(); keepVisible(target); }
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
      e.preventDefault();
      goBack();
      return;
    }
    if (code === 13) {
      var el = document.activeElement;
      if (el && el.className && el.className.indexOf("nav") >= 0 && el.tagName !== "BUTTON") { e.preventDefault(); el.click(); }
    }
  }, true);
  function goBack() {
    var layer = anyLayer();
    if (layer === "adhan") stopAdhan();
    else if (layer === "picker") closePicker();
    else if (layer === "credits") { hide("credits"); focusFirst(); }
    else if (isShown("settings")) closeSettings(false);
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

  // ------------------------------------------------------------------ settings screen
  var draft = null;
  var draftDirty = {};

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
      (function (v) { out.push(opt(labels[i], draft[field] === v, function () { draft[field] = v; draftDirty[field] = true; buildSettings(this.id); })); })(values[i]);
      out[out.length - 1].id = "opt_" + field + "_" + i;
    }
    return out;
  }

  function buildSettings(focusId) {
    var lang = draft.lang;
    var saved = settings.lang;
    settings.lang = lang; // labels follow the language being chosen
    $("settings").setAttribute("dir", RTL[lang] ? "rtl" : "ltr");
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

    var loc = [
      opt(S("country") + ": " + (draft.countryName || "—"), false, function () { openPicker("country"); }),
      opt(S("city") + ": " + (draft.cityName || "—"), false, function () { if (draft.countryId) openPicker("city"); }),
      opt(S("district") + ": " + (draft.districtName || "—"), false, function () { if (draft.cityId) openPicker("district"); })
    ];
    loc[0].id = "loc_country"; loc[1].id = "loc_city"; loc[2].id = "loc_district";
    body.appendChild(row(S("location_section"), loc));

    body.appendChild(row(S("azan_type_section"), choice("azan", ["turkey", "mecca", "egypt", "off"],
      [S("azan_turkey").replace(/\s+[—-].*$/, ""), S("azan_mecca"), S("azan_egypt"), Wt(W_ADHAN_OFF)])));
    body.appendChild(row(S("dua_after_adhan"), choice("dua", [true, false], [Wt(W_ON), Wt(W_OFF)])));
    body.appendChild(row(S("calc_method_section"), choice("calc", ["diyanet", "mwl", "isna", "egypt", "makkah", "karachi", "tehran"],
      [S("calc_diyanet"), S("calc_mwl"), S("calc_isna"), S("calc_egypt"), S("calc_makkah"), S("calc_karachi"), S("calc_tehran")]),
      draft.calc === "diyanet" ? S("calc_source_diyanet") : ""));
    if (draft.calc !== "diyanet") {
      body.appendChild(row(S("asr_method_desc"), choice("asr", ["standard", "hanafi"], [S("asr_evvel"), S("asr_sani")])));
    }
    body.appendChild(row(Wt(W_SAVER_AFTER), choice("idle", [30, 60, 120, 300, 600, 0],
      localizeDurations([30, 60, 120, 300, 600], Wt(W_OFF)))));
    body.appendChild(row(S("slide_seconds"), choice("slide", [10, 20, 30, 60], ["10", "20", "30", "60"])));
    body.appendChild(row(S("show_mihrap_translations"), choice("mihrapTr", [true, false], [Wt(W_ON), Wt(W_OFF)])));
    settings.lang = saved;
    body.scrollTop = scroll;
    var target = focusId ? $(focusId) : null;
    focusFirst(target);
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

  function openSettings() {
    draft = clone(settings);
    draftDirty = {};
    show("settings");
    hide("home");
    $("settingsBody").scrollTop = 0;
    buildSettings();
  }
  function closeSettings(save) {
    if (save) {
      var placeChanged = draft.districtId !== settings.districtId;
      var langChanged = draft.lang !== settings.lang;
      settings = draft;
      store("settings", settings);
      applyLanguage();
      if (placeChanged) { rows = []; rowsDistrict = ""; computedCache.key = ""; fetchTimes(); }
      computedCache.key = "";
      ensureCoordinates();
      if (langChanged) deck = [];
    }
    hide("settings");
    show("home");
    touch();
    render(true);
    focusFirst();
  }

  // ------------------------------------------------------------------ reset (two presses, so a stray OK cannot wipe it)
  var resetArmed = null;
  function disarmReset() {
    if (resetArmed) { clearTimeout(resetArmed); resetArmed = null; }
    var b = $("resetSettings");
    b.className = "nav big danger";
    b.innerHTML = escapeHtml(Wt(W_RESET));
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

  // ------------------------------------------------------------------ location picker
  var pickerKind = "";
  function openPicker(kind) {
    pickerKind = kind;
    var english = draft.lang !== "tr";
    var url, idKey, trKey, enKey, title;
    if (kind === "country") { url = "https://ezanvakti.emushaf.net/ulkeler"; idKey = "UlkeID"; trKey = "UlkeAdi"; enKey = "UlkeAdiEn"; title = S("country"); }
    else if (kind === "city") { url = "https://ezanvakti.emushaf.net/sehirler/" + encodeURIComponent(draft.countryId); idKey = "SehirID"; trKey = "SehirAdi"; enKey = "SehirAdiEn"; title = S("city"); }
    else { url = "https://ezanvakti.emushaf.net/ilceler/" + encodeURIComponent(draft.cityId); idKey = "IlceID"; trKey = "IlceAdi"; enKey = "IlceAdiEn"; title = S("district"); }
    $("pickerTitle").innerHTML = escapeHtml(title);
    var list = $("pickerList");
    list.innerHTML = '<div class="note" style="margin:0">' + escapeHtml(S("loading")) + "</div>";
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
      focusFirst(focusEl);
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
      html += "<p>Fonts: Amiri, Noto Serif — SIL Open Font License.</p>";
      list.innerHTML = html;
      list.scrollTop = 0;
    });
  }

  // ------------------------------------------------------------------ language
  function applyLanguage() {
    document.documentElement.lang = settings.lang;
    $("medAllah").innerHTML = escapeHtml(S("dash_panel_allah") || "اللّٰهُ");
    $("medMuhammad").innerHTML = escapeHtml(S("dash_panel_muhammad") || "مُحَمَّدٌ");
    $("startButton").innerHTML = escapeHtml(Wt(W_START));
    $("startHint").innerHTML = escapeHtml(Wt(W_HINT));
    $("openSettings").setAttribute("aria-label", S("settings"));
    $("placeLine").setAttribute("dir", "auto");
    $("dateLine").setAttribute("dir", RTL[settings.lang] ? "rtl" : "ltr");
    $("eventLine").setAttribute("dir", RTL[settings.lang] ? "rtl" : "ltr");
    lastMinuteRendered = "";
  }

  // ------------------------------------------------------------------ start and main loop
  function requestFullscreen() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (fn) { try { var p = fn.call(el); if (p && p.catch) p.catch(function () { }); } catch (e) { } }
  }
  var wakeLock = null;
  function keepAwake() {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    try {
      navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }, function () { });
    } catch (e) { }
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(); });

  function begin() {
    // Unlock audio: a muted play inside the press lets later adhans play without a press.
    try {
      player.muted = true;
      player.src = DATA.audio.dua;
      var p = player.play();
      var after = function () { try { player.pause(); player.currentTime = 0; } catch (e) { } player.muted = false; };
      if (p && p.then) p.then(after, after); else setTimeout(after, 300);
    } catch (e) { player.muted = false; }
    requestFullscreen();
    keepAwake();
    hide("start");
    touch();
    if (!settings.districtId) openSettings(); else focusFirst();
  }

  function tick() {
    var now = new Date();
    if (!isShown("settings")) render(false);
    if (!isShown("start")) checkAdhan(now);
    if (isShown("home") && !anyLayer() && settings.idle > 0 && Date.now() - lastActivity > settings.idle * 1000) startSaver();
    if (now.getSeconds() === 0 && now.getMinutes() % 30 === 0 && needsFetch()) fetchTimes();
  }

  function init() {
    fitStage();
    window.addEventListener("resize", fitStage);
    applyLanguage();
    $("startButton").onclick = begin;
    $("openSettings").onclick = openSettings;
    $("saveSettings").onclick = function () { closeSettings(true); };
    $("cancelSettings").onclick = function () { closeSettings(false); };
    $("openCredits").onclick = openCredits;
    $("resetSettings").onclick = resetPressed;
    $("resetSettings").onblur = disarmReset;
    $("closeCredits").onclick = function () { hide("credits"); focusFirst(); };
    $("stopAdhan").onclick = stopAdhan;
    render(true);
    if (needsFetch()) fetchTimes();
    ensureCoordinates();
    loadTexts("en", function () { loadTexts(settings.lang, function () { }); });
    // Warm the fonts the slides draw with.
    if (document.fonts && document.fonts.load) {
      try { document.fonts.load('40px "Amiri"'); document.fonts.load('40px "MihrapSerif"'); } catch (e) { }
    }
    focusFirst();
    setInterval(tick, 1000);
    if (location.hash === "#debug") {
      // Test hooks, only with #debug in the address.
      window.mihrapDebug = { saver: startSaver, slide: function (id) { deck = [id]; }, adhan: function (k) { playAdhan(k, new Date()); },
        settings: settings };
    }
  }

  init();
})();
