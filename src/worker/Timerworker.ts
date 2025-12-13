class TimeWorker {
  nextNoteTime = 0;
  testRatio = 50;
  nextNoteWindowMs = 100 * this.testRatio;
  tickIntervalMS = 25 * this.testRatio;
  worker?: Worker;

  init() {
    console.log("worker init");
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    this.worker.postMessage({
      event: "interval",
      interval: this.tickIntervalMS,
    });
    setTimeout(() => this.stop(), 10000);
  }

  handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
    console.log("handleMessage", e);
  }

  tick() {
    // each tick is used to schedule the notes in the next window
    console.log("[Timeworker] Tick");
  }

  stop() {
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
