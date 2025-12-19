import type { BeatMapType } from "../components/types";
import StepQueue from "../components/StepQueue";
import UI from "../components/Ui";
import Pulses from "../components/Pulses";
// let lastStep = -1;
class TimeWorker {
  nextNoteTime = 0;
  currentStep = 0;
  totalSteps = 16;
  lastStep = -1;
  pingRatio = 10;
  nextNoteWindowSec = 0.1;
  tickIntervalMS = 25;
  worker?: Worker;
  beatMap?: undefined | BeatMapType;
  stepQueue: typeof StepQueue = StepQueue;
  audioContext: AudioContext | null = null;
  isPlaying = false;
  animationFrameId?: number = undefined;
  pulses: Pulses | null = null;
  ui: UI | null = null;

  constructor({
    pulses,
    audioContext,
  }: {
    pulses: Pulses;
    audioContext: AudioContext;
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
    this.isPlaying = true;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
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
    if (
      !this.audioContext ||
      !this.ui ||
      !this.pulses ||
      !this.pulses.hasLeads
    ) {
      return;
    }
    // each Pulse looks for steps that fall within the window
    // Each time it finds one, it schedules the step by pushing it into the shared StepQueue
    // This allows for the UI highlighting by stepping through regularly in each stepper
    // Each Pulse still needs to know if it must play a stepper's sound at each step
    for (const pulse of this.pulses.getLeadPulses()) {
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
