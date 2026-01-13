import type { BeatMapType } from "../types";
import StepQueue from "./StepQueue";
import UI from "../components/Ui";
import Pulses from "./Pulses";
import Controls from "../components/Controls";
import * as Tone from "tone";

class TimeWorker {
  pingRatio = 10;
  nextNoteWindowSec = 0.1;
  tickIntervalMS = 25;
  worker?: Worker;
  beatMap?: undefined | BeatMapType;
  stepQueue: typeof StepQueue = StepQueue;
  audioContext: Tone.Context | null = null;
  isPlaying = false;
  animationFrameId?: number = undefined;
  pulses: typeof Pulses | null = null;
  ui: UI | null = null;
  intervalInitialized = false;

  constructor({
    pulses,
    audioContext,
  }: {
    pulses: typeof Pulses;
    audioContext: Tone.Context;
  }) {
    this.audioContext = audioContext;
    if (pulses) this.pulses = pulses;
    this.worker = new Worker(new URL("../worker/worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
  }

  start(ui: UI, ctx?: Tone.Context) {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    if (ctx) {
      this.audioContext = ctx;
    }
    console.log("[Start]");
    this.ui = ui;
    this.ui?.start();
    Tone.start();
    this.isPlaying = true;
    this.worker?.postMessage({ event: "start" });
    if (!this.intervalInitialized) this.setInterval();
  }

  private setInterval() {
    this.worker?.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
    this.intervalInitialized = true;
  }

  private handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
  }

  private tick() {
    if (!this.audioContext || !this.ui || !this.pulses || !Controls.isPlaying) {
      return;
    }
    // each Pulse looks for steps that fall within the window
    // Each time it can, it schedules a step by pushing it into the shared StepQueue
    // This allows for the UI highlighting by stepping through regularly in each stepper
    // Steppers listen to the appropiate pulse and are in charge of playing the sound if the current step is active
    for (const pulse of this.pulses.getLeadPulses()) {
      pulse.discover(this.audioContext?.currentTime, this.nextNoteWindowSec);
    }
  }

  public stop() {
    console.log("This.stop ");
    this.isPlaying = false;
    this.ui?.stop();
    this.worker?.postMessage({ event: "stop" });
  }

  // this is in order to try to implement restart without having to wait for messaging between the worker and this code
  pause() {
    this.isPlaying = false;
    this.ui?.stop();
  }
}

export default TimeWorker;
