class TimeWorker {
  worker?: Worker;

  init() {
    console.log("worker init");
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.postMessage({ event: "start" });
    setTimeout(() => this.stop(), 10000);
  }

  handleMessage(e: MessageEvent) {
    if (e.data.event === "tick") this.tick();
    if (e.data === "tick") this.tick();
    console.log("handleMessage", e);
  }

  tick() {
    console.log("Tick ");
  }

  stop() {
    this.worker?.postMessage({ event: "stop" });
  }
}

export default new TimeWorker();
