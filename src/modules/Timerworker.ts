import type { BeatMapType } from "../types";
import StepQueue from "./StepQueue";
import UI from "../components/Ui";
import Pulses from "./Pulses";
import Controls from "../components/Controls";
import * as Tone from "tone";
// let lastStep = -1;
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

  constructor({
    pulses,
    audioContext,
  }: {
    pulses: typeof Pulses;
    audioContext: Tone.Context;
  }) {
    this.audioContext = audioContext;
    if (pulses) this.pulses = pulses;
  }
  start(ui: UI) {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    console.log("[Start]");
    this.ui = ui;
    this.ui?.start();
    Tone.start();
    this.isPlaying = true;
    this.worker = new Worker(new URL("../worker/worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    this.worker.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
  }

  private handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
  }

  private tick() {
    if (!this.audioContext || !this.ui || !this.pulses || !Controls.isPlaying) {
      return;
    }
    // each Pulse looks for steps that fall within the window
    // Each time it finds one, it schedules the step by pushing it into the shared StepQueue
    // This allows for the UI highlighting by stepping through regularly in each stepper
    // Each Pulse still needs to know if it must play a stepper's sound at each step
    for (const pulse of this.pulses.getLeadPulses()) {
      console.log("[DISCOVERING]");
      // WHAT IF we used a transport here to be able to stop it
      pulse.discover(this.audioContext?.currentTime, this.nextNoteWindowSec);
    }
  }

  private stop() {
    console.log("This.stop ");
    this.isPlaying = false;
    this.ui?.stop();
    this.worker?.postMessage({ event: "stop" });
  }
}

export default TimeWorker;
