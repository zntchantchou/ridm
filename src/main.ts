import Controls from "./components/Controls";
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
const timeWorker = new Timerworker({ pulses, audioContext: ac });

function init() {
  Controls.init();
  Audio.init(ac);
  const sequencer = new Sequencer(pulses);
  sequencer.registerDefaults();
  // for (let i = 0; i < DEFAULT_TOTAL_STEPPERS; i++) {
  //   sequencer.register(new Stepper({ beats: i + 1, stepsPerBeat: 4, id: i }));
  // }
}
// handle start / pause
playBtn?.addEventListener("click", () => {
  // user gesture is needed to start the initiated audio context;
  ac.resume();
  timeWorker.start(ui);
});
