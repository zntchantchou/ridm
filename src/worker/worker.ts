let timerId: undefined | number;
let interval = 25;
const TICK_MSG = { event: "tick" };

self.onmessage = (e) => {
  // console.log("[Worker] : ", e.data.event);
  switch (e.data.event) {
    case "start": {
      console.log("[Worker]start : ", e.data.event);
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
