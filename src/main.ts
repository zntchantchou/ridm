import Controls from "./components/Controls";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";
import Pulses from "./components/Pulses";
import UI from "./components/Ui";
import StepQueue from "./components/StepQueue";

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
}
// handle start / pause
playBtn?.addEventListener("click", () => {
  // user gesture is needed to start the initiated audio context;
  if (!Controls.isPlaying) ac.resume();
  timeWorker.start(ui);
  // if (Controls.isPlaying) ac.suspend();
  // console.log("STEPQUEUE ", StepQueue);
});
