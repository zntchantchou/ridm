import type { BeatMapType } from "../components/types";
import Controls from "../components/Controls";
import Audio from "../components/Audio";
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
  stepQueue: { beat: number; time: number }[] = [];
  audioContext: AudioContext | null = null;
  isPlaying = false;
  animationFrameId?: number = undefined;

  public updateBeatMap(beatMap: BeatMapType) {
    this.beatMap = beatMap;
  }

  start() {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    console.log("[Start]");
    if (!this.audioContext) this.audioContext = new AudioContext();
    this.isPlaying = true;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    this.worker.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
    this.nextNoteTime = this.audioContext.currentTime; // Time in seconds since start
    console.log("[Start] nextNoteTime: ", this.nextNoteTime);
    this.animationFrameId = requestAnimationFrame(this.draw);
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

  // Consumes the note queue for rendering visual cue of steps passing
  private draw = () => {
    // const details = { queueLength: this.stepQueue.length };
    let currStep = this.lastStep;
    // console.log("[DRAW]");
    if (this.audioContext?.currentTime) {
      const currentTime = this.audioContext.currentTime;
      while (this.stepQueue.length && this.stepQueue[0].time < currentTime) {
        currStep = this.stepQueue[0].beat;
        this.stepQueue.splice(0, 1);
      }
    }
    if (currStep !== this.lastStep) {
      this.updateUi(currStep);
      this.lastStep = currStep;
    }
    if (this.isPlaying && this?.draw) requestAnimationFrame(this.draw);
  };

  // Perform visual update of the steps
  private updateUi(currentStep: number) {
    const lastStepElt: null | HTMLDivElement = document.querySelector(
      `[data-beat="${this.lastStep}"]`
    );
    const currentStepElt: HTMLDivElement = document.querySelector(
      `[data-beat="${currentStep}"]`
    ) as HTMLDivElement;
    if (lastStepElt) {
      lastStepElt.dataset.ticking = "off";
    }
    currentStepElt.dataset.ticking = "on";
  }

  scheduleStep() {
    console.log("[sheduleStep] ", this.currentStep);
    this.stepQueue.push({ beat: this.currentStep, time: this.nextNoteTime }); // update stepQueue for UI
    Audio.playMetronome(this.currentStep, this.nextNoteTime); // play metronome
  }

  // update the next note's time for the scheduler loop to pickup
  // Defines the next note's time
  goToNextStep() {
    console.log("[goToNextStep]");
    if (this.currentStep === this.totalSteps - 1) {
      this.currentStep = 0;
    } else {
      this.currentStep = this.currentStep + 1;
    }
    const timePerStepSec = (60 / Controls.getTempo()) * 0.25;
    this.nextNoteTime += timePerStepSec;
  }

  private stop() {
    console.log("This.stop ");
    this.isPlaying = false;
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
