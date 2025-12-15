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
    // console.log("TimerWorker ", beatMap);
  }

  start() {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    console.log("[Start]");
    this.audioContext = new AudioContext();
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
    // const tickLogDetails = {
    //   ACTime: this.audioContext.currentTime,
    //   timeAndWindow: this.audioContext.currentTime + this.nextNoteWindowSec,
    //   nextNoteTime: this.nextNoteTime,
    //   tempo: Controls.getTempo(),
    // };
    // console.log("Tick log details ", tickLogDetails);
    // Find the next step that should be scheduled
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
        // console.log("NOTE IS PENDING", this.stepQueue[0]);
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
    // update stepQueue for UI
    this.stepQueue.push({ beat: this.currentStep, time: this.nextNoteTime });
    // schedule the next sound

    // try playing 32th notes
    // try playing 16th notes (all notes currently)
    Audio.playDefault(this.nextNoteTime);
    // try playing 8th notes
    // if (this.currentStep % 2 === 0) {
    //   Audio.playDefault(this.nextNoteTime);
    // }
    // try playing 4th notes
    // if (this.currentStep % 4 === 0) {
    //   Audio.playDefault(this.nextNoteTime);
    // }
  }

  // update the next note's time for the scheduler loop to pickup
  goToNextStep() {
    // Defines the next note's time
    // MUST have access to current tempo
    console.log("[goToNextStep]");
    if (this.currentStep === this.totalSteps - 1) {
      this.currentStep = 0;
      // console.log("[goToNextStep] WRAP STEP TO 0 :", this.currentStep);
    } else {
      this.currentStep = this.currentStep + 1;
      // console.log("[goToNextStep] ADD ONE :", this.currentStep);
    }
    const timePerStepSec = (60 / Controls.getTempo()) * 0.25;
    this.nextNoteTime += timePerStepSec;
    // const logDetails = {
    //   timePerStepSec,
    //   nextNoteTime: this.nextNoteTime,
    //   getTempo: Controls.getTempo(),
    //   currentStep: this.currentStep,
    // };
    // console.log("[goToNextStep] logDetails :", logDetails);
  }

  private stop() {
    console.log("This.stop ");
    this.isPlaying = false;

    if (this.animationFrameId) {
      console.log("this.animationFrame ", this.animationFrameId);
    }
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
