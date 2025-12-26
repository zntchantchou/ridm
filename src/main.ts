import Controls from "./components/Controls";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";
import Pulses from "./components/Pulses";
import UI from "./components/Ui";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
const ac = new AudioContext();
const ui = new UI(ac, Pulses);
const timeWorker = new Timerworker({ pulses: Pulses, audioContext: ac });

function init() {
  Controls.init();
  Audio.init(ac);
  const sequencer = new Sequencer(Pulses);
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
