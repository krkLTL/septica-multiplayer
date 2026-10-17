(() => {
  const KEY = "septica.ui-tuning.v1";
  const EASINGS = {
    smooth: "cubic-bezier(.2,.75,.25,1)",
    snappy: "cubic-bezier(.16,.9,.2,1)",
    gentle: "cubic-bezier(.22,.61,.36,1)"
  };
  const DEFAULTS = Object.freeze({
    version: 1,
    appWidth: 1900,
    handScale: 1,
    handOverlap: 10,
    pileScale: 1,
    motionSpeed: 1,
    revealHoldMs: 650,
    collectionMs: 690,
    easing: "smooth",
    felt1: "#16452b",
    felt2: "#0a2c1a",
    felt3: "#071c11",
    gold: "#d9b85f",
    goldHi: "#f4df9c"
  });

  function number(value, fallback, min, max, precision = 0) {
    const parsed = Number(value);
    const bounded = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    return Number(bounded.toFixed(precision));
  }

  function sanitize(input = {}) {
    return {
      version: 1,
      appWidth: number(input.appWidth, DEFAULTS.appWidth, 960, 2200),
      handScale: number(input.handScale, DEFAULTS.handScale, 0.75, 1.25, 2),
      handOverlap: number(input.handOverlap, DEFAULTS.handOverlap, 6, 18),
      pileScale: number(input.pileScale, DEFAULTS.pileScale, 0.75, 1.2, 2),
      motionSpeed: number(input.motionSpeed, DEFAULTS.motionSpeed, 0.6, 1.5, 2),
      revealHoldMs: number(input.revealHoldMs, DEFAULTS.revealHoldMs, 0, 1500),
      collectionMs: number(input.collectionMs, DEFAULTS.collectionMs, 300, 1000),
      easing: Object.prototype.hasOwnProperty.call(EASINGS, input.easing) ? input.easing : DEFAULTS.easing,
      felt1: validColor(input.felt1, DEFAULTS.felt1),
      felt2: validColor(input.felt2, DEFAULTS.felt2),
      felt3: validColor(input.felt3, DEFAULTS.felt3),
      gold: validColor(input.gold, DEFAULTS.gold),
      goldHi: validColor(input.goldHi, DEFAULTS.goldHi)
    };
  }

  function validColor(value, fallback) {
    return typeof value === "string" && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
  }

  function apply(input) {
    const settings = sanitize(input);
    const root = document.documentElement;
    root.style.setProperty("--studio-app-width", `${settings.appWidth}px`);
    root.style.setProperty("--studio-hand-scale", settings.handScale);
    root.style.setProperty("--studio-hand-overlap", `${settings.handOverlap}px`);
    root.style.setProperty("--studio-pile-scale", settings.pileScale);
    root.style.setProperty("--studio-motion-ease", EASINGS[settings.easing]);
    root.style.setProperty("--felt-1", settings.felt1);
    root.style.setProperty("--felt-2", settings.felt2);
    root.style.setProperty("--felt-3", settings.felt3);
    root.style.setProperty("--gold", settings.gold);
    root.style.setProperty("--gold-hi", settings.goldHi);
    window.dispatchEvent(new CustomEvent("septica:ui-tuning", { detail: settings }));
    return settings;
  }

  function load() {
    try {
      return sanitize(JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      return sanitize(DEFAULTS);
    }
  }

  function save(input) {
    const settings = sanitize(input);
    localStorage.setItem(KEY, JSON.stringify(settings));
    return settings;
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function hasSaved() {
    return localStorage.getItem(KEY) !== null;
  }

  window.SepticaUiTuning = { defaults: DEFAULTS, easings: EASINGS, sanitize, apply, load, save, clear, hasSaved };
})();
