import type { BeatMapType } from "../components/types";

class TimeWorker {
  nextNoteTime = 0;
  lastNoteTimeMs = 0;
  pingRatio = 20;
  nextNoteWindowMs = 100 * this.pingRatio;
  tickIntervalMS = 25 * this.pingRatio;
  worker?: Worker;
  beatMap?: undefined | BeatMapType;
  noteQueue = [];
  currentNote = 0;

  public updateBeatMap(beatMap: BeatMapType) {
    this.beatMap = beatMap;
    console.log("TimerWorker ", beatMap);
  }

  init() {
    console.log("worker init");
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    this.worker.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
    // setTimeout(() => this.stop(), 10000);
  }

  private handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
  }

  private tick() {
    // each tick is used to schedule the notes in the next window
    console.log("[Timeworker] Tick");
  }

  private stop() {
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
