import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";
import Pulses from "./components/Pulses";
import UI from "./components/Ui";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
const pulses = new Pulses();
const ac = new AudioContext();
const ui = new UI(ac, pulses);
const timeWorker = new Timerworker({ pulses });

function init() {
  Controls.init();
  Audio.init();
  const sequencer = new Sequencer(pulses);
  // sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 1 })); // TEST ERRORS and BEHAVIOUR
  sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 2 }));
  sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 4 }));
  // sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 8 } ));
  // sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 16 }));
}
// handle start / pause
playBtn?.addEventListener("click", () => {
  timeWorker.start(ui);
});
