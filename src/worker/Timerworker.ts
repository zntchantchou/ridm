import type { BeatMapType } from "../components/types";
import Controls from "../components/Controls";
// let lastStep = -1;
class TimeWorker {
  nextNoteTime = 0;
  currentStep = 0;
  totalSteps = 16;
  pingRatio = 10;
  nextNoteWindowSec = 0.1;
  tickIntervalMS = 25 * this.pingRatio;
  worker?: Worker;
  beatMap?: undefined | BeatMapType;
  noteQueue: { beat: number; time: number }[] = [];
  audioContext: AudioContext | null = null;
  isPlaying = false;

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
    // requestAnimationFrame(this.draw);
  }

  private handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
  }

  private tick() {
    // each tick is used to schedule the notes in the next window
    if (!this.audioContext) return;
    const tickLogDetails = {
      ACTime: this.audioContext.currentTime,
      timeAndWindow: this.audioContext.currentTime + this.nextNoteWindowSec,
      nextNoteTime: this.nextNoteTime,
    };
    // console.log("Tick log details ", tickLogDetails);
    // Find the next step that should be scheduled
    while (
      this.nextNoteTime <
      this.audioContext.currentTime + this.nextNoteWindowSec
    ) {
      console.log("[TICK LOOPING] log details ", tickLogDetails);
      this.scheduleStep();
      this.goToNextStep();
    }
  }

  // Consumes the note queue for rendering visual cue of steps passing
  // private draw = () => {
  //   console.log("[draw] currentTime: ", this.audioContext?.currentTime);
  //   let currentStep = lastStep;
  //   if (this?.audioContext) {
  //     const currentTime = this.audioContext.currentTime;
  //     if (this.noteQueue.length) {
  //       console.log("DRAW cheCK", this.noteQueue);
  //       return;
  //     }
  //     while (this.noteQueue.length && this.noteQueue[0].time < currentTime) {
  //       console.log("This.notequeue", this.noteQueue);
  //       currentStep = this.noteQueue[0].beat;
  //       this.noteQueue.splice(0, 1);
  //       console.log("This.notequeue after", this.noteQueue);
  //     }
  //     // console.log("AFTER WHILE LOOP", currentStep);
  //     if (currentStep !== lastStep) {
  //       // update stepper code
  //       console.log("UPDATE STEPPER", currentStep);
  //     }
  //     lastStep = currentStep;
  //   }
  //   console.log("REQUEST ANIMATION FRAME 2", this?.draw);
  //   if (this?.draw) requestAnimationFrame(this.draw);
  // };

  scheduleStep() {
    console.log("[sheduleStep]");
    this.noteQueue.push({ beat: this.currentStep, time: this.nextNoteTime });
  }

  // update the next note's time for the scheduler loop to pickup
  goToNextStep() {
    // update lastPlayedTime
    // set nextNoteTime
    if (this.currentStep == this.totalSteps - 1) this.currentStep = 0;
    else this.currentStep++;
    const timePerStepSec = (Controls.tempo / 60) * 0.25;
    this.nextNoteTime += timePerStepSec;
    console.log("[goToNextStep] nextNoteTime :", this.nextNoteTime);
  }

  private stop() {
    console.log("This.stop ");
    this.isPlaying = false;
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
