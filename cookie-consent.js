/**
 * Cookie-/Einwilligungs-Hinweis: erscheint nur beim ersten Besuch
 * (Speicherung der Zustimmung in localStorage, kein Tracking).
 */
(function () {
  var STORAGE_KEY = "pf_cookie_consent_v1";

  function canUseStorage() {
    try {
      var k = "__pf_t";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (!canUseStorage()) return;
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch (e) {
    return;
  }

  var reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root = document.createElement("div");
  root.id = "cookie-consent";
  root.className = "cookie-banner";
  root.setAttribute("role", "region");
  root.setAttribute(
    "aria-label",
    "Hinweis zu Cookies und lokal gespeicherter Einwilligung"
  );

  root.innerHTML =
    '<div class="cookie-banner__inner container">' +
    '<p class="cookie-banner__text">' +
    "Wir speichern mit <strong>Akzeptieren</strong> nur lokal in Ihrem Browser, " +
    "dass Sie den Hinweis gesehen haben – ohne Tracking und ohne Werbe-Cookies. " +
    'Details in der <a href="datenschutz.html">Datenschutzerklärung</a>.' +
    "</p>" +
    '<div class="cookie-banner__actions">' +
    '<button type="button" class="btn btn-primary cookie-banner__accept">' +
    "Akzeptieren" +
    "</button>" +
    "</div>" +
    "</div>";

  document.body.appendChild(root);

  var btn = root.querySelector(".cookie-banner__accept");

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    root.classList.add("cookie-banner--hiding");
    var removed = false;
    function cleanup() {
      if (removed) return;
      removed = true;
      if (root.parentNode) root.parentNode.removeChild(root);
    }
    if (reduceMotion) {
      cleanup();
      return;
    }
    root.addEventListener("transitionend", function onEnd(ev) {
      if (ev.target !== root) return;
      root.removeEventListener("transitionend", onEnd);
      cleanup();
    });
    window.setTimeout(cleanup, 500);
  }

  if (btn) btn.addEventListener("click", dismiss);

  if (reduceMotion) {
    root.classList.add("cookie-banner--visible");
    if (btn) btn.focus();
    return;
  }

  window.requestAnimationFrame(function () {
    root.classList.add("cookie-banner--visible");
    if (btn) btn.focus();
  });
})();
