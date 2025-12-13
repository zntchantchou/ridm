export interface TimeWorkerMessage extends MessageEvent {
  data: { event: "interval" | "start" | "stop"; interval?: number };
}
