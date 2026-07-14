(function () {
  "use strict";

  const root = document.querySelector('[data-demo="neuron"]');
  if (!root) return;

  const netCanvas = root.querySelector(".neuron-demo__network");
  const rasterCanvas = root.querySelector(".neuron-demo__raster");
  const netCtx = netCanvas.getContext("2d");
  const rasterCtx = rasterCanvas.getContext("2d");
  const playBtn = root.querySelector(".neuron-demo__play");
  const stepBtn = root.querySelector(".neuron-demo__step");
  const resetBtn = root.querySelector(".neuron-demo__reset");
  const decaySlider = root.querySelector(".neuron-demo__decay");
  const speedSlider = root.querySelector(".neuron-demo__speed");
  const statusEl = root.querySelector(".neuron-demo__status");

  const NET_W = 640, NET_H = 320;
  const RASTER_W = 640, RASTER_H = 160;
  const RASTER_HISTORY = 160;

  // ---- exact port of Neuron.py: Neuron / LIFNeuron / MCPNeuron / Synapse ----

  class Neuron {
    constructor(avoltage = 0, athreshold = 1, arefractory = 1, aname = "") {
      this.threshold = athreshold;
      this.voltage = avoltage;
      this.postSynapses = [];
      this.preSynapses = [];
      this.sumInputs = 0;
      this.refractory = arefractory;
      this.refractCount = 0;
      this.spikeTimes = [];
      this.name = aname;
    }

    addVoltage(aSum) {
      this.sumInputs += aSum;
    }

    AP() {
      for (const synapse of this.postSynapses) synapse.activate();
    }

    check(currentTau) {
      this.voltage += this.sumInputs;
      this.sumInputs = 0;
      this.refractCount -= 1;
      if (this.refractCount <= 0) {
        this.refractCount = 0;
        if (this.voltage >= this.threshold) {
          this.spikeTimes.push(currentTau);
          this.AP();
          this.voltage -= Math.abs(this.threshold);
          this.refractCount = this.refractory;
          return true;
        }
      }
      return false;
    }
  }

  class LIFNeuron extends Neuron {
    constructor(avoltage = 0, athreshold = 1, arefractory = 1, adecay = 5, aname = "") {
      super(avoltage, athreshold, arefractory, aname);
      this.decayConstant = adecay;
    }

    leak(numTauSteps) {
      this.voltage = this.voltage * Math.pow(1 - 1 / this.decayConstant, numTauSteps);
    }

    check(currentTau) {
      this.leak(1);
      return super.check(currentTau);
    }
  }

  class MCPNeuron extends LIFNeuron {
    constructor(avoltage = 0, athreshold = 1, arefractory = 1, aname = "") {
      super(avoltage, athreshold, arefractory, 1, aname);
    }
  }

  class Synapse {
    constructor(neuron1, neuron2, weight = 1, adelay = 1) {
      this.pre = neuron1;
      this.post = neuron2;
      this.weight = weight;
      this.delay = adelay;
      this.activateFireDelays = [];
      this.pre.postSynapses.push(this);
      this.post.preSynapses.push(this);
    }

    activate() {
      this.activateFireDelays.push(this.delay);
    }

    fire() {
      this.post.addVoltage(this.weight);
    }

    check() {
      this.activateFireDelays = this.activateFireDelays.map((x) => x - 1);
      let count = 0;
      while (count < this.activateFireDelays.length && this.activateFireDelays[count] === 0) {
        this.fire();
        count++;
      }
      this.activateFireDelays = this.activateFireDelays.slice(count);
    }

    static connectWeightedByDistance(Alist, Blist, minWeight, maxWeight, spread, d) {
      const synapses = [];
      const translate1 = -Alist.length / 2;
      const translate2 = -Blist.length / 2;
      for (let i = 0; i < Alist.length; i++) {
        for (let j = 0; j < Blist.length; j++) {
          const distance = Math.abs(i + translate1 - (j + translate2));
          if (spread === -1 || distance <= spread) {
            const weight = (maxWeight - minWeight) / (distance + 1) + minWeight;
            synapses.push(new Synapse(Alist[i], Blist[j], weight, d));
          }
        }
      }
      return synapses;
    }
  }

  // ---- network: 6 clickable input neurons -> 6 LIF -> 6 MCP, plus a
  // weaker inhibitory feedback path MCP -> LIF, so both excitatory
  // (green) and inhibitory (blue) synapses are visible, same as the
  // green/blue convention in the original GraphicSimulator. ----

  const COLS = 3;
  const ROWS = 6;
  let tau = 0;
  let running = false;
  let intervalId = null;
  let lastFired = new Set();
  let raster = []; // raster[neuronIndex] = array of 0/1 over recent history

  let inputs, lif, mcp, allNeurons, synapses;

  function buildNetwork() {
    const decay = Number(decaySlider.value);
    inputs = Array.from({ length: ROWS }, (_, i) => new Neuron(0, 1, 2, "in" + i));
    lif = Array.from({ length: ROWS }, (_, i) => new LIFNeuron(0, 1, 1, decay, "lif" + i));
    mcp = Array.from({ length: ROWS }, (_, i) => new MCPNeuron(0, 1, 1, "mcp" + i));
    allNeurons = [...inputs, ...lif, ...mcp];
    synapses = [
      ...Synapse.connectWeightedByDistance(inputs, lif, 0.4, 1.6, 2, 1),
      ...Synapse.connectWeightedByDistance(lif, mcp, 0.4, 1.4, 2, 1),
      ...Synapse.connectWeightedByDistance(mcp, lif, -1.0, -0.1, 3, 2),
    ];
    tau = 0;
    lastFired = new Set();
    raster = allNeurons.map(() => []);
  }

  function tick() {
    for (const s of synapses) s.check();
    allNeurons.forEach((n, i) => {
      const fired = n.check(tau);
      if (fired) lastFired.add(i);
      else lastFired.delete(i);
      raster[i].push(fired ? 1 : 0);
      if (raster[i].length > RASTER_HISTORY) raster[i].shift();
    });
    tau++;
  }

  // ---- layout ----

  function neuronPos(index) {
    let col, rowIndex;
    if (index < ROWS) {
      col = 0;
      rowIndex = index;
    } else if (index < ROWS * 2) {
      col = 1;
      rowIndex = index - ROWS;
    } else {
      col = 2;
      rowIndex = index - ROWS * 2;
    }
    const x = (NET_W * (col + 1)) / (COLS + 1);
    const y = (NET_H * (rowIndex + 1)) / (ROWS + 1);
    return { x, y };
  }

  // ---- HiDPI canvas setup (internal resolution only — CSS controls the
  // displayed size, see the dice-demo fix for why this matters) ----

  function setupHiDPI(canvas, ctx, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  setupHiDPI(netCanvas, netCtx, NET_W, NET_H);
  setupHiDPI(rasterCanvas, rasterCtx, RASTER_W, RASTER_H);

  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      excitatory: cs.getPropertyValue("--color-chart-ci").trim(),
      inhibitory: cs.getPropertyValue("--color-accent").trim(),
      spike: cs.getPropertyValue("--color-flash-incorrect").trim(),
      resting: cs.getPropertyValue("--color-text-secondary").trim(),
      border: cs.getPropertyValue("--color-border").trim(),
      text: cs.getPropertyValue("--color-text").trim(),
    };
  }

  function drawNetwork() {
    const colors = themeColors();
    netCtx.clearRect(0, 0, NET_W, NET_H);

    // synapses
    for (const s of synapses) {
      const from = neuronPos(allNeurons.indexOf(s.pre));
      const to = neuronPos(allNeurons.indexOf(s.post));
      netCtx.strokeStyle = s.weight >= 0 ? colors.excitatory : colors.inhibitory;
      netCtx.globalAlpha = Math.min(1, Math.abs(s.weight));
      netCtx.lineWidth = 1.5;
      netCtx.beginPath();
      netCtx.moveTo(from.x, from.y);
      netCtx.lineTo(to.x, to.y);
      netCtx.stroke();
    }
    netCtx.globalAlpha = 1;

    // neurons
    allNeurons.forEach((n, i) => {
      const { x, y } = neuronPos(i);
      const firing = lastFired.has(i);
      netCtx.beginPath();
      netCtx.arc(x, y, 12, 0, Math.PI * 2);
      netCtx.fillStyle = firing ? colors.spike : colors.resting;
      netCtx.fill();
      netCtx.lineWidth = i < ROWS ? 2.5 : 1;
      netCtx.strokeStyle = colors.border;
      netCtx.stroke();
    });

    // column labels
    netCtx.fillStyle = colors.text;
    netCtx.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--font-body");
    netCtx.textAlign = "center";
    netCtx.fillText("input (click to stimulate)", NET_W / 4, 16);
    netCtx.fillText("LIF", NET_W / 2, 16);
    netCtx.fillText("MCP", (NET_W * 3) / 4, 16);
  }

  function drawRaster() {
    const colors = themeColors();
    rasterCtx.clearRect(0, 0, RASTER_W, RASTER_H);
    const rowH = RASTER_H / allNeurons.length;
    const colW = RASTER_W / RASTER_HISTORY;
    rasterCtx.fillStyle = colors.spike;
    raster.forEach((history, i) => {
      const y = i * rowH;
      history.forEach((fired, t) => {
        if (fired) {
          const x = RASTER_W - (history.length - t) * colW;
          rasterCtx.fillRect(x, y + rowH * 0.15, Math.max(1.5, colW * 0.8), rowH * 0.7);
        }
      });
    });
    // row-group separators (input | LIF | MCP)
    rasterCtx.strokeStyle = colors.border;
    rasterCtx.lineWidth = 1;
    [ROWS, ROWS * 2].forEach((r) => {
      const y = r * rowH;
      rasterCtx.beginPath();
      rasterCtx.moveTo(0, y);
      rasterCtx.lineTo(RASTER_W, y);
      rasterCtx.stroke();
    });
  }

  function render() {
    drawNetwork();
    drawRaster();
  }

  function stimulate(index) {
    if (index < 0 || index >= inputs.length) return;
    inputs[index].addVoltage(inputs[index].threshold + 0.5);
  }

  // ---- click-to-stimulate: map a click through the canvas's actual
  // rendered CSS size (not its internal HiDPI pixel buffer) so hit-testing
  // stays correct at any responsive width. ----

  netCanvas.addEventListener("click", (e) => {
    const rect = netCanvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * NET_W;
    const y = ((e.clientY - rect.top) / rect.height) * NET_H;
    for (let i = 0; i < ROWS; i++) {
      const pos = neuronPos(i);
      if (Math.hypot(pos.x - x, pos.y - y) <= 14) {
        stimulate(i);
        if (!running) render();
        statusEl.textContent = "Stimulated input " + i + ".";
        return;
      }
    }
  });

  function doStep() {
    tick();
    render();
  }

  function setRunning(next) {
    running = next;
    playBtn.textContent = running ? "Pause" : "Play";
    playBtn.setAttribute("aria-pressed", running ? "true" : "false");
    if (running) {
      const ms = Number(speedSlider.value);
      intervalId = window.setInterval(doStep, ms);
      statusEl.textContent = "Running.";
    } else if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
      statusEl.textContent = "Paused.";
    }
  }

  playBtn.addEventListener("click", () => setRunning(!running));
  stepBtn.addEventListener("click", () => {
    setRunning(false);
    doStep();
    statusEl.textContent = "Stepped to t=" + tau + ".";
  });
  resetBtn.addEventListener("click", () => {
    setRunning(false);
    buildNetwork();
    render();
    statusEl.textContent = "Reset.";
  });
  decaySlider.addEventListener("input", () => {
    for (const n of lif) n.decayConstant = Number(decaySlider.value);
  });
  speedSlider.addEventListener("input", () => {
    if (running) {
      setRunning(false);
      setRunning(true);
    }
  });

  window.addEventListener("sitethemechange", render);

  buildNetwork();
  render();
})();
