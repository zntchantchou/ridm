import type { BeatMapType } from "../components/types";
import Controls from "../components/Controls";
import Audio from "../components/Audio";
import StepQueue from "../components/StepQueue";
import UI from "../components/Ui";
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

  // stepQueue: { beat: number; time: number }[] = [];
  stepQueue: typeof StepQueue = StepQueue;
  audioContext: AudioContext | null = null;
  isPlaying = false;
  animationFrameId?: number = undefined;
  ui: UI | null = null;

  start() {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    console.log("[Start]");
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.ui = new UI(this.audioContext);
    }
    this.ui?.start();
    this.isPlaying = true;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    this.worker.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
    this.nextNoteTime = this.audioContext.currentTime; // Time in seconds since start
    // console.log("[Start] nextNoteTime: ", this.nextNoteTime);
    // this.animationFrameId = requestAnimationFrame(this.draw);
  }

  private handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
  }

  private tick() {
    // each tick is used to schedule the notes in the next window
    if (!this.audioContext) return;
    while (
      this.nextNoteTime <
      this.audioContext.currentTime + this.nextNoteWindowSec
    ) {
      this.scheduleStep();
      this.goToNextStep();
    }
  }

  scheduleStep() {
    console.log("[sheduleStep] ", this.currentStep);
    // One queue per time signature
    // this.stepQueue.push({ beat: this.currentStep, time: this.nextNoteTime }); // update stepQueue for UI
    this.stepQueue.push({
      stepNumber: this.currentStep,
      time: this.nextNoteTime,
      totalSteps: this.totalSteps,
    });
    Audio.playMetronome(this.currentStep, this.nextNoteTime); // play metronome
  }

  // update the next note's time for the scheduler loop to pickup
  // Defines the next note's time
  goToNextStep() {
    // console.log("[goToNextStep]");
    if (this.currentStep === this.totalSteps - 1) {
      this.currentStep = 0;
    } else {
      this.currentStep = this.currentStep + 1;
    }
    const stepsPerBeat = 8;
    const timePerStepSec = 60 / Controls.getTempo() / stepsPerBeat;
    this.nextNoteTime += timePerStepSec;
  }

  private stop() {
    console.log("This.stop ");
    this.isPlaying = false;
    this.ui?.stop();
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
