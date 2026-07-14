(function () {
  "use strict";

  const root = document.querySelector('[data-demo="wave"]');
  if (!root) return;

  const canvas = root.querySelector(".wave-demo__canvas");
  const ctx = canvas.getContext("2d");
  const ampSlider = root.querySelector(".wave-demo__amp");
  const freqSlider = root.querySelector(".wave-demo__freq");
  const phaseSlider = root.querySelector(".wave-demo__phase");
  const ampOut = root.querySelector(".wave-demo__amp-val");
  const freqOut = root.querySelector(".wave-demo__freq-val");
  const phaseOut = root.querySelector(".wave-demo__phase-val");
  const editBtn = root.querySelector(".wave-demo__edit");
  const addBtn = root.querySelector(".wave-demo__add");
  const resetBtn = root.querySelector(".wave-demo__reset");
  const statusEl = root.querySelector(".wave-demo__status");

  const CSS_W = canvas.width;
  const CSS_H = canvas.height;

  // N points over [-pi, pi], matching waves/gui.py (which used 1000);
  // 512 is a power of two so the radix-2 FFT below stays exact and fast.
  const N = 512;
  const timepoints = new Array(N);
  for (let i = 0; i < N; i++) timepoints[i] = -Math.PI + (2 * Math.PI * i) / (N - 1);

  let wave = new Array(N).fill(0);

  // ---- port of make_wave: a * sin(2*pi*f*x + phase) ----
  function makeWave(amplitude, frequency, phase) {
    const y = new Array(N);
    for (let i = 0; i < N; i++) {
      y[i] = amplitude * Math.sin(2 * Math.PI * frequency * timepoints[i] + phase);
    }
    return y;
  }

  // ---- in-place iterative radix-2 FFT (N must be a power of two) ----
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cwr = 1, cwi = 0;
        for (let k = 0; k < len >> 1; k++) {
          const a = i + k, b = i + k + (len >> 1);
          const vr = re[b] * cwr - im[b] * cwi;
          const vi = re[b] * cwi + im[b] * cwr;
          re[b] = re[a] - vr; im[b] = im[a] - vi;
          re[a] += vr; im[a] += vi;
          const ncwr = cwr * wr - cwi * wi;
          cwi = cwr * wi + cwi * wr;
          cwr = ncwr;
        }
      }
    }
  }

  // ---- port of forward(): real part of the FFT, fftshifted ----
  function forward(signal) {
    const re = signal.slice();
    const im = new Array(N).fill(0);
    fft(re, im);
    // take the real part (as the Python did), then fftshift
    const shifted = new Array(N);
    const half = N >> 1;
    for (let i = 0; i < N; i++) shifted[i] = re[(i + half) % N];
    return shifted;
  }

  // ---- HiDPI internal resolution only; CSS controls displayed size ----
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CSS_W * dpr;
  canvas.height = CSS_H * dpr;
  ctx.scale(dpr, dpr);

  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      time: cs.getPropertyValue("--color-accent").trim(),
      freq: cs.getPropertyValue("--color-chart-mean").trim(),
      axis: cs.getPropertyValue("--color-border").trim(),
      text: cs.getPropertyValue("--color-text-secondary").trim(),
      font: cs.getPropertyValue("--font-body").trim(),
    };
  }

  function drawTrace(values, x0, x1, midY, ampPx, color) {
    let maxAbs = 0;
    for (let i = 0; i < N; i++) maxAbs = Math.max(maxAbs, Math.abs(values[i]));
    const scale = ampPx / (maxAbs || 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = x0 + ((x1 - x0) * i) / (N - 1);
      const y = midY - values[i] * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function draw() {
    const c = themeColors();
    ctx.clearRect(0, 0, CSS_W, CSS_H);

    const pad = 16;
    const midY = CSS_H / 2;
    const ampPx = CSS_H * 0.36;
    const leftX0 = pad, leftX1 = CSS_W / 2 - pad;
    const rightX0 = CSS_W / 2 + pad, rightX1 = CSS_W - pad;

    // axes: centre divider + a midline per panel
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CSS_W / 2, pad);
    ctx.lineTo(CSS_W / 2, CSS_H - pad);
    ctx.moveTo(leftX0, midY);
    ctx.lineTo(leftX1, midY);
    ctx.moveTo(rightX0, midY);
    ctx.lineTo(rightX1, midY);
    ctx.stroke();

    drawTrace(wave, leftX0, leftX1, midY, ampPx, c.time);
    drawTrace(forward(wave), rightX0, rightX1, midY, ampPx, c.freq);
  }

  window.addEventListener("sitethemechange", draw);

  // ---- controls ----
  function params() {
    return [Number(ampSlider.value), Number(freqSlider.value), Number(phaseSlider.value)];
  }

  function syncReadouts() {
    ampOut.textContent = Number(ampSlider.value).toFixed(2);
    freqOut.textContent = Number(freqSlider.value).toFixed(1);
    phaseOut.textContent = Number(phaseSlider.value).toFixed(2);
  }

  function edit() {
    const [a, f, p] = params();
    wave = makeWave(a, f, p);
    draw();
    statusEl.textContent = "Replaced the waveform with a single sinusoid.";
  }

  function add() {
    const [a, f, p] = params();
    const w = makeWave(a, f, p);
    for (let i = 0; i < N; i++) wave[i] += w[i];
    draw();
    statusEl.textContent = "Added a sinusoid onto the existing waveform.";
  }

  function reset() {
    wave = new Array(N).fill(0);
    draw();
    statusEl.textContent = "Cleared the waveform.";
  }

  [ampSlider, freqSlider, phaseSlider].forEach((s) =>
    s.addEventListener("input", syncReadouts)
  );
  editBtn.addEventListener("click", edit);
  addBtn.addEventListener("click", add);
  resetBtn.addEventListener("click", reset);

  // Seed with a single sinusoid, matching the Python __init__'s edit call.
  syncReadouts();
  edit();
})();
