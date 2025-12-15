import type { BeatMapType } from "../components/types";
import Controls from "../components/Controls";
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
  noteQueue: { beat: number; time: number }[] = [];
  audioContext: AudioContext | null = null;
  isPlaying = false;
  animationFrameId?: number = undefined;

  public updateBeatMap(beatMap: BeatMapType) {
    this.beatMap = beatMap;
    console.log("TimerWorker ", beatMap);
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
      // console.log("[TICK LOOPING] NEW STEP : ", tickLogDetails);

      // console.log("[TICK LOOPING] Controls: ", Controls);
      this.scheduleStep();
      this.goToNextStep();
    }
  }

  // Consumes the note queue for rendering visual cue of steps passing
  private draw = () => {
    const details = { queueLength: this.noteQueue.length };
    let currStep = this.lastStep;
    console.log("[DRAW] ", details);
    if (this.audioContext?.currentTime) {
      const currentTime = this.audioContext.currentTime;
      while (this.noteQueue.length && this.noteQueue[0].time < currentTime) {
        console.log("NOTE IS PENDING", this.noteQueue[0]);
        currStep = this.noteQueue[0].beat;
        this.noteQueue.splice(0, 1);
      }
    }
    if (currStep !== this.lastStep) {
      // PERFORM VISUAL UPDATE HERE
      console.log("UPDATE STEPPER", currStep);
      const lastStepElt: null | HTMLDivElement = document.querySelector(
        `[data-beat="${this.lastStep}"]`
      );
      const currentStepElt: HTMLDivElement = document.querySelector(
        `[data-beat="${currStep}"]`
      ) as HTMLDivElement;
      if (lastStepElt) {
        console.log("[prevElt] ", lastStepElt);
        console.log("[prevElt style] ", lastStepElt.computedStyleMap());
        lastStepElt.style.backgroundColor = "white";
      }

      console.log("[currElt] ", currentStepElt);
      currentStepElt.style.backgroundColor = "red";
      this.lastStep = currStep;
    }
    if (this.isPlaying && this?.draw) requestAnimationFrame(this.draw);
  };

  scheduleStep() {
    console.log("[sheduleStep] ", this.currentStep);
    this.noteQueue.push({ beat: this.currentStep, time: this.nextNoteTime });
  }

  // update the next note's time for the scheduler loop to pickup
  goToNextStep() {
    // Defines the next note's time
    // MUST have access to current tempo
    if (this.currentStep === this.totalSteps - 1) {
      this.currentStep = 0;
      console.log("[goToNextStep] WRAP STEP TO 0 :", this.currentStep);
    } else {
      this.currentStep = this.currentStep + 1;
      console.log("[goToNextStep] ADD ONE :", this.currentStep);
    }
    const timePerStepSec = (60 / Controls.getTempo()) * 0.25;
    this.nextNoteTime += timePerStepSec;
    const logDetails = {
      timePerStepSec,
      nextNoteTime: this.nextNoteTime,
      getTempo: Controls.getTempo(),
      currentStep: this.currentStep,
    };
    console.log("[goToNextStep] logDetails :", logDetails);
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
