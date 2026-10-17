(() => {
  const api = window.SepticaUiTuning;
  const presets = {
    balanced: api.defaults,
    quick: { ...api.defaults, motionSpeed: 1.3, revealHoldMs: 350, collectionMs: 500, easing: "snappy" },
    cinematic: { ...api.defaults, motionSpeed: 0.78, revealHoldMs: 1000, collectionMs: 850, easing: "gentle" }
  };
  const iframe = document.getElementById("gamePreview"), viewport = document.getElementById("viewport");
  let settings = api.load(), isSaved = true;
  function setStatus(text) { document.getElementById("saveState").textContent = text; }
  function updateControls() {
    document.querySelectorAll("[data-setting]").forEach(control => {
      const key = control.dataset.setting; control.value = settings[key];
      const output = document.querySelector(`[data-output="${key}"]`);
      if (output) output.value = key === "appWidth" ? `${settings[key]} px` : key.endsWith("Ms") ? `${settings[key]} ms` : key === "handOverlap" ? `${settings[key]} px` : `${settings[key]}×`;
    });
  }
  function linkForSettings() {
    const url = new URL("/", location.href); url.searchParams.set("demo", "1"); url.searchParams.set("tune", JSON.stringify(settings)); return url.href;
  }
  function sendPreview() {
    if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "septica-studio-preview", settings }, location.origin);
    document.getElementById("shareLink").value = linkForSettings();
  }
  function setSettings(value, message = "Previzualizarea este actualizată.") {
    settings = api.sanitize(value); updateControls(); sendPreview(); isSaved = false; setStatus(message);
    document.querySelectorAll("[data-preset]").forEach(button => button.classList.toggle("selected", JSON.stringify(settings) === JSON.stringify(api.sanitize(presets[button.dataset.preset]))));
  }
  document.querySelectorAll("[data-setting]").forEach(control => control.addEventListener("input", () => setSettings({ ...settings, [control.dataset.setting]: control.type === "range" ? Number(control.value) : control.value })));
  document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => setSettings(presets[button.dataset.preset], "Preset aplicat. Salvează dacă vrei să rămână pe dispozitiv.")));
  document.getElementById("save").addEventListener("click", () => { settings = api.save(settings); isSaved = true; setStatus("Salvat pe acest dispozitiv."); });
  document.getElementById("reset").addEventListener("click", () => { api.clear(); setSettings(api.defaults, "Valorile implicite sunt active. Apasă Salvează pentru a le păstra."); });
  document.getElementById("device").addEventListener("change", event => {
    const [width, height] = event.target.value.split("x").map(Number); viewport.style.width = `${width}px`; viewport.style.height = `${height}px`;
    document.getElementById("deviceLabel").textContent = `${width <= 500 ? "Telefon" : width < 1600 ? "Laptop" : "Monitor"} · ${width} × ${height}`; fitPreview();
  });
  function fitPreview() {
    const wrap = document.querySelector(".viewport-wrap"), width = parseInt(viewport.style.width, 10) || 390, height = parseInt(viewport.style.height, 10) || 844;
    const scale = Math.min((wrap.clientWidth - 28) / width, (wrap.clientHeight - 28) / height, 1); viewport.style.transform = `scale(${Math.max(.1, scale)})`;
  }
  new ResizeObserver(fitPreview).observe(document.querySelector(".viewport-wrap"));
  iframe.addEventListener("load", sendPreview);
  document.getElementById("copyLink").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(linkForSettings()); setStatus("Link copiat."); }
    catch { document.getElementById("shareLink").select(); document.execCommand("copy"); setStatus("Link selectat și copiat."); }
  });
  document.getElementById("exportJson").addEventListener("click", () => { document.getElementById("jsonSettings").value = JSON.stringify(settings, null, 2); });
  document.getElementById("importJson").addEventListener("click", () => {
    try { setSettings(JSON.parse(document.getElementById("jsonSettings").value), "Setări importate. Salvează pentru a le păstra."); }
    catch { setStatus("JSON-ul nu este valid."); }
  });
  updateControls(); document.getElementById("shareLink").value = linkForSettings();
  document.querySelectorAll("[data-preset]").forEach(button => button.classList.toggle("selected", JSON.stringify(settings) === JSON.stringify(api.sanitize(presets[button.dataset.preset]))));
  setStatus(isSaved ? "Setările salvate pe acest dispozitiv sunt încărcate." : "Previzualizarea este actualizată.");
})();
