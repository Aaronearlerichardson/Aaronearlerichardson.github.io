---
title: "Neuron Simulator"
description: "An object-oriented spiking-neuron network simulator — neurons and synapses as class instances, with a live graphical view of activation spreading through the network."
stack: [Python, matplotlib]
order: 7
repo: https://github.com/Aaronearlerichardson/Neuron_sim
demo: neuron
---

A from-scratch discrete-time simulator for networks of spiking neurons,
built as an exercise in modeling biological structure directly as object
structure rather than as a matrix of weights.

## The model

A `Neuron` tracks its own voltage, threshold, refractory period, and the
`Synapse` objects wired to its inputs and outputs; each simulation tick,
a neuron sums its pending inputs, and fires (appending to its own spike
history and activating every downstream synapse) if it clears threshold
and isn't refractory. `LIFNeuron` adds leaky integration — voltage decays
toward zero between inputs at a configurable rate — and `MCPNeuron` is
the limiting case of that decay (a classic McCulloch-Pitts neuron that
forgets everything between ticks). `Synapse` carries a weight and a
transmission delay, queuing an activation to fire a fixed number of ticks
after it's triggered rather than instantaneously, and comes with several
bulk-wiring helpers — full bipartite connection, random connection,
random-weighted connection, and distance-weighted connection between two
neuron populations — to lay out a network without wiring every synapse
by hand.

## Watching it run

A `GraphicSimulator` subclass renders the network as it runs: each neuron
is a circle, each synapse a line (green for excitatory, blue for
inhibitory), and a neuron flashes red for the tick it fires. Layout is
pluggable — neurons can be arranged linearly, sinusoidally, or randomly —
independent of the network's actual connectivity. Alongside the live view,
the simulator produces the standard analysis plots after a run: per-neuron
voltage traces and raster plots of spike times across a population.

### Try it

A JS port of the same `Neuron`/`LIFNeuron`/`MCPNeuron`/`Synapse` classes —
same leaky integration, same refractory-period and transmission-delay
math — wired into a small feed-forward network: six input neurons feeding
six leaky-integrate-and-fire neurons feeding six McCulloch-Pitts neurons,
connected by distance-weighted synapses (green = excitatory, blue = a
weaker inhibitory feedback path from the output layer back to the middle
one). **Click an input neuron** (left column) to stimulate it and watch
the activation propagate through the network tick by tick; **Step**
advances one tick at a time, **Play** runs continuously, and the strip
below is a live raster plot — the same kind of spike-time visualization
the original produces after a run, just updating as it goes instead of
after the fact.

<div class="demo-shell">
  <span class="demo-shell__label">Live demo — spiking neuron network</span>
  <div class="neuron-demo" data-demo="neuron">
    <canvas class="neuron-demo__network" width="640" height="320" role="img" aria-label="Network diagram of input, LIF, and MCP neurons with excitatory and inhibitory synapses; click an input neuron to stimulate it"></canvas>
    <canvas class="neuron-demo__raster" width="640" height="160" role="img" aria-label="Live raster plot of which neurons have fired over recent time steps"></canvas>
    <p class="neuron-demo__raster-label">Raster plot — each row is one neuron (input, LIF, MCP top to bottom), each column a time step.</p>
    <div class="neuron-demo__controls">
      <div class="neuron-demo__buttons">
        <button type="button" class="button neuron-demo__play" aria-pressed="false">Play</button>
        <button type="button" class="button button--ghost neuron-demo__step">Step</button>
        <button type="button" class="button button--ghost neuron-demo__reset">Reset</button>
      </div>
      <label class="neuron-demo__slider">Decay
        <input type="range" class="neuron-demo__decay" min="1" max="20" step="1" value="5">
      </label>
      <label class="neuron-demo__slider">Speed (ms/tick)
        <input type="range" class="neuron-demo__speed" min="60" max="600" step="20" value="200">
      </label>
    </div>
    <p class="neuron-demo__status" role="status" aria-live="polite"></p>
  </div>
</div>
