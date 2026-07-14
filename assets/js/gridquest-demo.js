(function () {
  "use strict";

  const root = document.querySelector('[data-demo="gridquest"]');
  if (!root) return;

  // ---- config, ported from bitrate_game/config.py ----
  const NUM_TILES = 9;
  const N = NUM_TILES * NUM_TILES; // 81
  const SLOT_KEYS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
  const SCORED_DURATION_SEC = 60;
  const COUNTDOWN_SEC = 3;
  const FEEDBACK_FLASH_MS = 150;

  const Phase = {
    WELCOME: "welcome",
    FAMILIARIZATION: "familiarization",
    COUNTDOWN: "countdown",
    SCORED: "scored",
    RESULTS: "results",
  };

  // ---- DOM refs ----
  const boardEl = root.querySelector(".gq-demo__board");
  const bitrateEl = root.querySelector(".gq-demo__bitrate");
  const timerEl = root.querySelector(".gq-demo__timer");
  const messageEl = root.querySelector(".gq-demo__message");
  const practiceBtn = root.querySelector(".gq-demo__practice");
  const scoredBtn = root.querySelector(".gq-demo__scored");
  const menuBtn = root.querySelector(".gq-demo__menu");
  const resultsEl = root.querySelector(".gq-demo__results");
  const statusEl = root.querySelector(".gq-demo__status");

  const tiles = [];
  for (let i = 0; i < NUM_TILES; i++) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "gq-tile";
    tile.setAttribute("aria-label", "Tile " + SLOT_KEYS[i].toUpperCase());
    const key = document.createElement("span");
    key.className = "gq-tile__key";
    key.textContent = SLOT_KEYS[i].toUpperCase();
    tile.appendChild(key);
    const grid = document.createElement("div");
    grid.className = "gq-tile__minigrid";
    grid.hidden = true;
    for (let c = 0; c < NUM_TILES; c++) {
      const cell = document.createElement("div");
      cell.className = "gq-tile__minicell";
      grid.appendChild(cell);
    }
    tile.appendChild(grid);
    const big = document.createElement("div");
    big.className = "gq-tile__bigtarget";
    big.hidden = true;
    tile.appendChild(big);
    tile.addEventListener("click", () => handleSlotKey(i));
    boardEl.appendChild(tile);
    tiles.push({ el: tile, grid, cells: Array.from(grid.children), big });
  }
  const countdownOverlay = document.createElement("div");
  countdownOverlay.className = "gq-demo__countdown";
  countdownOverlay.hidden = true;
  boardEl.appendChild(countdownOverlay);

  // ---- BitRateTracker, ported from core.py ----
  function makeTracker(n) {
    return {
      n,
      correct: 0,
      incorrect: 0,
      accumulatedSec: 0,
      runningSince: null,
      start() {
        if (this.runningSince === null) this.runningSince = performance.now();
      },
      pause() {
        if (this.runningSince !== null) {
          this.accumulatedSec += (performance.now() - this.runningSince) / 1000;
          this.runningSince = null;
        }
      },
      reset() {
        this.correct = 0;
        this.incorrect = 0;
        this.accumulatedSec = 0;
        this.runningSince = null;
      },
      elapsedSec() {
        const live = this.runningSince === null ? 0 : (performance.now() - this.runningSince) / 1000;
        return this.accumulatedSec + live;
      },
      bitRate() {
        const t = this.elapsedSec();
        if (t <= 0) return 0;
        const net = Math.max(this.correct - this.incorrect, 0);
        return Math.log2(this.n - 1) * net / t;
      },
      snapshot() {
        return {
          n: this.n,
          correct: this.correct,
          incorrect: this.incorrect,
          elapsedSec: this.elapsedSec(),
          bitRate: this.bitRate(),
        };
      },
    };
  }

  // ---- session + mode state, ported from core.py / mode.py ----
  const tracker = makeTracker(N);
  let phase = Phase.WELCOME;
  let phaseStart = performance.now();
  let finalSnapshot = null;

  let target = nextTarget();
  let stage = "group"; // 'group' | 'tile'
  let activeGroup = null;
  let lastCorrect = null;
  let lastFeedbackAt = 0;
  let rafId = null;

  function nextTarget() {
    return Math.floor(Math.random() * N);
  }

  function phaseElapsed() {
    return (performance.now() - phaseStart) / 1000;
  }

  function enterPhase(p) {
    phase = p;
    phaseStart = performance.now();
  }

  function resetMode() {
    target = nextTarget();
    stage = "group";
    activeGroup = null;
    lastCorrect = null;
    lastFeedbackAt = 0;
  }

  // SPACE: context-sensitive advance/back, mirrors Session.on_advance()
  function onAdvance() {
    if (phase === Phase.WELCOME) {
      tracker.reset();
      tracker.start();
      resetMode();
      enterPhase(Phase.FAMILIARIZATION);
    } else {
      tracker.pause();
      tracker.reset();
      finalSnapshot = null;
      enterPhase(Phase.WELCOME);
    }
    startLoopIfNeeded();
    render();
  }

  // ENTER: start (or jump into) the scored run, mirrors main.py's START_SCORED handling
  function onStartScored() {
    if (phase === Phase.WELCOME) {
      tracker.reset();
      tracker.start();
      resetMode();
      tracker.reset();
      enterPhase(Phase.COUNTDOWN);
    } else if (phase === Phase.FAMILIARIZATION) {
      tracker.reset();
      resetMode();
      enterPhase(Phase.COUNTDOWN);
    }
    startLoopIfNeeded();
    render();
  }

  function isActiveForInput() {
    return phase === Phase.FAMILIARIZATION || phase === Phase.SCORED;
  }

  // handle_slot_key, ported from mode.py GridQuestMode
  function handleSlotKey(slotIdx) {
    if (!isActiveForInput()) return;
    const targetGroup = Math.floor(target / NUM_TILES);
    const targetSlot = target % NUM_TILES;

    if (stage === "group") {
      if (slotIdx !== targetGroup) {
        recordSelection(false);
        target = nextTarget();
        stage = "group";
        activeGroup = null;
      } else {
        activeGroup = slotIdx;
        stage = "tile";
      }
      render();
      return;
    }

    // stage === 'tile'
    const correct = slotIdx === targetSlot;
    recordSelection(correct);
    target = nextTarget();
    stage = "group";
    activeGroup = null;
    render();
  }

  function recordSelection(correct) {
    lastCorrect = correct;
    lastFeedbackAt = performance.now();
    if (phase === Phase.FAMILIARIZATION || phase === Phase.SCORED) {
      if (correct) tracker.correct += 1;
      else tracker.incorrect += 1;
    }
  }

  // tick(), ported from core.py Session.tick()
  function tick() {
    if (phase === Phase.COUNTDOWN) {
      if (phaseElapsed() >= COUNTDOWN_SEC) {
        enterPhase(Phase.SCORED);
        tracker.start();
      }
    } else if (phase === Phase.SCORED) {
      if (phaseElapsed() >= SCORED_DURATION_SEC) {
        tracker.pause();
        finalSnapshot = tracker.snapshot();
        enterPhase(Phase.RESULTS);
      }
    }
  }

  // ---- keyboard handling, scoped to the widget ----
  root.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const slotIdx = SLOT_KEYS.indexOf(key);
    if (slotIdx !== -1) {
      e.preventDefault();
      handleSlotKey(slotIdx);
      return;
    }
    if (key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onAdvance();
      return;
    }
    if (key === "enter") {
      e.preventDefault();
      onStartScored();
    }
  });

  boardEl.setAttribute("tabindex", "0");
  practiceBtn.addEventListener("click", () => {
    onAdvance();
    boardEl.focus();
  });
  scoredBtn.addEventListener("click", () => {
    onStartScored();
    boardEl.focus();
  });
  menuBtn.addEventListener("click", () => {
    onAdvance();
    boardEl.focus();
  });

  // ---- render loop ----
  function startLoopIfNeeded() {
    if (rafId !== null) return;
    if (phase === Phase.WELCOME || phase === Phase.RESULTS) return;
    const loop = () => {
      tick();
      render();
      if (phase === Phase.WELCOME || phase === Phase.RESULTS) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  let lastAnnouncedPhase = null;

  function render() {
    const targetGroup = Math.floor(target / NUM_TILES);
    const targetSlot = target % NUM_TILES;
    const flashActive = lastCorrect !== null && performance.now() - lastFeedbackAt < FEEDBACK_FLASH_MS;

    boardEl.hidden = phase === Phase.WELCOME || phase === Phase.RESULTS;
    resultsEl.hidden = phase !== Phase.RESULTS;
    countdownOverlay.hidden = phase !== Phase.COUNTDOWN;

    if (phase === Phase.COUNTDOWN) {
      const remaining = Math.max(0, COUNTDOWN_SEC - phaseElapsed());
      countdownOverlay.textContent = String(Math.max(1, Math.ceil(remaining)));
    }

    tiles.forEach((t, idx) => {
      t.el.classList.remove("gq-tile--target", "gq-tile--flash-correct", "gq-tile--flash-incorrect");
      t.grid.hidden = true;
      t.big.hidden = true;
      t.cells.forEach((c) => c.classList.remove("gq-tile__minicell--target"));

      if (stage === "group") {
        t.grid.hidden = false;
        const isTargetGroupTile = idx === targetGroup;
        if (isTargetGroupTile) {
          t.el.classList.add("gq-tile--target");
          t.cells[targetSlot].classList.add("gq-tile__minicell--target");
        }
      } else {
        if (idx === targetSlot) {
          t.el.classList.add("gq-tile--target");
          t.big.hidden = false;
        }
      }

      if (flashActive) {
        t.el.classList.add(lastCorrect ? "gq-tile--flash-correct" : "gq-tile--flash-incorrect");
      }
    });

    if (phase === Phase.FAMILIARIZATION || phase === Phase.SCORED) {
      const snap = tracker.snapshot();
      const label = phase === Phase.FAMILIARIZATION ? "Practice bit rate" : "Scored bit rate";
      bitrateEl.innerHTML =
        '<span class="gq-demo__bitrate-label">' + label + '</span>' + snap.bitRate.toFixed(2) + " bps";
      timerEl.textContent =
        phase === Phase.SCORED ? Math.max(0, SCORED_DURATION_SEC - phaseElapsed()).toFixed(1) + "s" : "";
    } else {
      bitrateEl.textContent = "";
      timerEl.textContent = "";
    }

    if (phase === Phase.WELCOME) {
      messageEl.textContent =
        "Click the board (or Practice) then use Q W E / A S D / Z X C to select the tile containing the yellow square, then the position it was in.";
    } else if (phase === Phase.FAMILIARIZATION) {
      messageEl.textContent =
        stage === "group"
          ? "Press the key for the tile containing the yellow square."
          : "Press the key for the position the yellow square was in.";
    } else if (phase === Phase.COUNTDOWN) {
      messageEl.textContent = "Get ready...";
    } else if (phase === Phase.SCORED) {
      messageEl.textContent =
        stage === "group"
          ? "Press the key for the tile containing the yellow square."
          : "Press the key for the position the yellow square was in.";
    } else if (phase === Phase.RESULTS) {
      messageEl.textContent = "";
    }

    practiceBtn.hidden = phase !== Phase.WELCOME;
    scoredBtn.hidden = !(phase === Phase.WELCOME || phase === Phase.FAMILIARIZATION);
    menuBtn.hidden = phase === Phase.WELCOME || phase === Phase.RESULTS;

    if (phase === Phase.RESULTS && finalSnapshot) {
      const s = finalSnapshot;
      resultsEl.innerHTML =
        '<p>Run complete</p>' +
        '<p class="gq-demo__results-bps">' + s.bitRate.toFixed(2) + " bits/sec</p>" +
        '<ul class="gq-demo__results-breakdown">' +
        "<li>N (alphabet size) = " + s.n + "</li>" +
        "<li>S_c (correct selections) = " + s.correct + "</li>" +
        "<li>S_i (incorrect selections) = " + s.incorrect + "</li>" +
        "<li>t (elapsed seconds) = " + s.elapsedSec.toFixed(2) + "</li>" +
        "<li>B = log2(N-1) &times; max(S_c &minus; S_i, 0) / t</li>" +
        "</ul>" +
        '<button type="button" class="button gq-demo__again">Try again</button>';
      const again = resultsEl.querySelector(".gq-demo__again");
      if (again) {
        again.addEventListener("click", () => {
          onAdvance();
          boardEl.focus();
        });
      }
    }

    if (phase !== lastAnnouncedPhase) {
      lastAnnouncedPhase = phase;
      const announcements = {
        [Phase.FAMILIARIZATION]: "Practice started.",
        [Phase.COUNTDOWN]: "Scored run starting.",
        [Phase.SCORED]: "Scored run started — 60 seconds.",
        [Phase.RESULTS]: finalSnapshot ? "Run complete: " + finalSnapshot.bitRate.toFixed(2) + " bits per second." : "Run complete.",
        [Phase.WELCOME]: "Back at the menu.",
      };
      statusEl.textContent = announcements[phase] || "";
    }
  }

  render();
})();
