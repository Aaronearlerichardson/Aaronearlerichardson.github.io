(function () {
  "use strict";

  const root = document.querySelector('[data-demo="dice"]');
  if (!root) return;

  const MAX_SIDES = 100;
  const MAX_DICE = 20;
  const MAX_ROWS = 6;
  const MAX_RANGE = 400; // outcome span cap so bars stay legible

  const rowsEl = root.querySelector(".dice-demo__rows");
  const addBtn = root.querySelector(".dice-demo__add");
  const removeBtn = root.querySelector(".dice-demo__remove");
  const rollBtn = root.querySelector(".dice-demo__roll");
  const canvas = root.querySelector(".dice-demo__canvas");
  const statsEl = root.querySelector(".dice-demo__stats");
  const warningEl = root.querySelector(".dice-demo__warning");
  const ctx = canvas.getContext("2d");

  const CSS_WIDTH = canvas.width;
  const CSS_HEIGHT = canvas.height;

  // ---- exact port of dice.py: convolve / roll / multi_roll ----

  function convolve(signal, kernel) {
    const signalLen = signal.length;
    const kernelLen = kernel.length;
    const convLen = signalLen + kernelLen - 1;
    const result = new Array(convLen).fill(0);
    for (let i = 0; i < convLen; i++) {
      for (let j = 0; j < kernelLen; j++) {
        if (i - j >= 0 && i - j < signalLen) {
          result[i] += signal[i - j] * kernel[j];
        }
      }
    }
    return result;
  }

  function roll(numSides, numDice) {
    const outcomes = [];
    for (let v = numDice; v <= numDice * numSides; v++) outcomes.push(v);
    let combFrequencies = new Array(numSides).fill(1);
    for (let d = 1; d < numDice; d++) {
      combFrequencies = convolve(combFrequencies, new Array(numSides).fill(1));
    }
    const total = combFrequencies.reduce((a, b) => a + b, 0);
    const probabilities = combFrequencies.map((c) => c / total);
    return { outcomes, probabilities };
  }

  function multiRoll(sidesArr, diceArr) {
    let acc = roll(sidesArr[0], diceArr[0]);
    for (let i = 1; i < sidesArr.length; i++) {
      const next = roll(sidesArr[i], diceArr[i]);
      const combined = new Map();
      for (let a = 0; a < acc.outcomes.length; a++) {
        for (let b = 0; b < next.outcomes.length; b++) {
          const sum = acc.outcomes[a] + next.outcomes[b];
          const p = acc.probabilities[a] * next.probabilities[b];
          combined.set(sum, (combined.get(sum) || 0) + p);
        }
      }
      const entries = Array.from(combined.entries()).sort((x, y) => x[0] - y[0]);
      acc = { outcomes: entries.map((e) => e[0]), probabilities: entries.map((e) => e[1]) };
    }
    return acc;
  }

  // ---- row management ----

  function clamp(v, lo, hi) {
    v = Math.round(Number(v));
    if (Number.isNaN(v)) return lo;
    return Math.min(hi, Math.max(lo, v));
  }

  function addRow(sides, count) {
    const rows = rowsEl.querySelectorAll(".dice-row");
    if (rows.length >= MAX_ROWS) return;
    const row = document.createElement("div");
    row.className = "dice-row";
    const idx = rows.length + 1;
    row.innerHTML =
      '<label>Sides<input type="number" class="dice-row__sides" min="2" max="' +
      MAX_SIDES +
      '" value="' +
      (sides || 6) +
      '" aria-label="Number of sides, die ' +
      idx +
      '"></label>' +
      '<label>Count<input type="number" class="dice-row__count" min="1" max="' +
      MAX_DICE +
      '" value="' +
      (count || 1) +
      '" aria-label="Number of dice, die ' +
      idx +
      '"></label>';
    rowsEl.appendChild(row);
  }

  function removeRow() {
    const rows = rowsEl.querySelectorAll(".dice-row");
    if (rows.length <= 1) return;
    rows[rows.length - 1].remove();
  }

  addBtn.addEventListener("click", () => addRow());
  removeBtn.addEventListener("click", removeRow);

  // ---- canvas drawing (HiDPI-aware) ----
  // Only the internal bitmap resolution is set here (canvas.width/height,
  // scaled by devicePixelRatio for crispness) — the *displayed* size stays
  // under CSS's responsive rules (width: 100%; max-width; height: auto in
  // main.css), so this scales down on narrow viewports instead of
  // overflowing. Drawing below is still done in the CSS_WIDTH/CSS_HEIGHT
  // logical coordinate space; the browser scales the whole bitmap to fit.

  const dpr = window.devicePixelRatio || 1;
  canvas.width = CSS_WIDTH * dpr;
  canvas.height = CSS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);

  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      bar: cs.getPropertyValue("--color-accent").trim(),
      text: cs.getPropertyValue("--color-text").trim(),
      textSecondary: cs.getPropertyValue("--color-text-secondary").trim(),
      mean: cs.getPropertyValue("--color-chart-mean").trim(),
      ci: cs.getPropertyValue("--color-chart-ci").trim(),
      font: cs.getPropertyValue("--font-body").trim(),
    };
  }

  function drawArrowHead(cx, x, y, direction) {
    const size = 5;
    cx.beginPath();
    if (direction === "left") {
      cx.moveTo(x, y);
      cx.lineTo(x + size, y - size);
      cx.moveTo(x, y);
      cx.lineTo(x + size, y + size);
    } else {
      cx.moveTo(x, y);
      cx.lineTo(x - size, y - size);
      cx.moveTo(x, y);
      cx.lineTo(x - size, y + size);
    }
    cx.stroke();
  }

  let lastResult = null;

  function draw(outcomes, probabilities) {
    lastResult = { outcomes, probabilities };
    const colors = themeColors();
    const w = CSS_WIDTH;
    const h = CSS_HEIGHT;
    ctx.clearRect(0, 0, w, h);

    const mean = outcomes.reduce((s, o, i) => s + o * probabilities[i], 0);
    const variance = outcomes.reduce((s, o, i) => s + probabilities[i] * (o - mean) ** 2, 0);
    const std = Math.sqrt(variance);
    const maxProb = Math.max.apply(null, probabilities);
    const textHeight = 22;
    const topMargin = 34;
    const minOutcome = outcomes[0];
    const maxOutcome = outcomes[outcomes.length - 1];
    const n = outcomes.length;
    const xOf = (v) => ((v - minOutcome) / (maxOutcome - minOutcome || 1)) * w;

    // bars
    ctx.fillStyle = colors.bar;
    for (let i = 0; i < n; i++) {
      const x0 = (w * i) / n;
      const x1 = (w * (i + 1)) / n;
      const y0 = topMargin + (h - textHeight - topMargin) * (1 - probabilities[i] / maxProb);
      const y1 = h - textHeight;
      ctx.fillRect(x0, y0, Math.max(1, x1 - x0 - 1), y1 - y0);
    }

    // outcome labels
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "11px " + colors.font;
    ctx.textAlign = "center";
    const labelStep = Math.max(1, Math.ceil(n / 30));
    for (let i = 0; i < n; i += labelStep) {
      ctx.fillText(String(outcomes[i]), (w * (i + 0.5)) / n, h - 6);
    }

    // mean line
    const meanX = xOf(mean);
    ctx.strokeStyle = colors.mean;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(meanX, topMargin);
    ctx.lineTo(meanX, h - textHeight);
    ctx.stroke();

    // 90% CI
    const lower = mean - 1.645 * std;
    const upper = mean + 1.645 * std;
    const xLower = xOf(lower);
    const xUpper = xOf(upper);
    ctx.strokeStyle = colors.ci;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xLower, topMargin);
    ctx.lineTo(xLower, h - textHeight);
    ctx.moveTo(xUpper, topMargin);
    ctx.lineTo(xUpper, h - textHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(xLower, topMargin);
    ctx.lineTo(xUpper, topMargin);
    ctx.stroke();
    drawArrowHead(ctx, xLower, topMargin, "left");
    drawArrowHead(ctx, xUpper, topMargin, "right");

    // text
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.font = "12px " + colors.font;
    ctx.fillText("90% CI: (" + lower.toFixed(2) + ", " + upper.toFixed(2) + ")", w / 2, topMargin - 10);

    statsEl.textContent =
      "Mean " + mean.toFixed(2) + ", standard deviation " + std.toFixed(2) +
      ", 90% confidence interval (" + lower.toFixed(2) + ", " + upper.toFixed(2) + ").";
  }

  function redrawIfPossible() {
    if (lastResult) draw(lastResult.outcomes, lastResult.probabilities);
  }
  window.addEventListener("sitethemechange", redrawIfPossible);

  function doRoll() {
    const rows = Array.from(rowsEl.querySelectorAll(".dice-row"));
    const sidesArr = [];
    const diceArr = [];
    rows.forEach((row) => {
      const sidesInput = row.querySelector(".dice-row__sides");
      const countInput = row.querySelector(".dice-row__count");
      const sides = clamp(sidesInput.value, 2, MAX_SIDES);
      const count = clamp(countInput.value, 1, MAX_DICE);
      sidesInput.value = sides;
      countInput.value = count;
      sidesArr.push(sides);
      diceArr.push(count);
    });

    const minTotal = diceArr.reduce((a, b) => a + b, 0);
    const maxTotal = sidesArr.reduce((s, sides, i) => s + sides * diceArr[i], 0);
    if (maxTotal - minTotal > MAX_RANGE) {
      warningEl.hidden = false;
      warningEl.textContent =
        "That combination's outcome range (" + (maxTotal - minTotal) +
        ") is too wide to plot legibly here — try fewer or smaller dice.";
      return;
    }
    warningEl.hidden = true;

    const { outcomes, probabilities } = multiRoll(sidesArr, diceArr);
    draw(outcomes, probabilities);
  }

  rollBtn.addEventListener("click", doRoll);

  // Seed with a classic 2d6 so the chart isn't blank on load.
  doRoll();
})();
