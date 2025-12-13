let timerId: undefined | number;
let interval = 1000;
const TICK_MSG = { event: "tick" };

self.onmessage = (e) => {
  console.log("[Worker] : ", e.data.event);
  switch (e.data.event) {
    case "start": {
      console.log("start");
      timerId = setInterval(() => {
        postMessage(TICK_MSG);
      }, interval);
      break;
    }
    case "interval": {
      if (e.data.interval) interval = e.data.interval;
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        postMessage(TICK_MSG);
      }, interval);
      console.log("interval");
      console.log("e.data.interval", e.data);
      break;
    }
    case "stop": {
      console.log("[Worker stop]");
      if (timerId) clearInterval(timerId);
      timerId = undefined;
      break;
    }
    default:
      console.log("[worker] DEFAULT..");
  }
};
