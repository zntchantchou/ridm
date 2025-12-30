import Controls from "./components/Controls";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";
import Pulses from "./components/Pulses";
import UI from "./components/Ui";
import * as Tone from "tone";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
// const ac = new AudioContext();
const toneContext = new Tone.Context();
const ui = new UI(toneContext, Pulses);
const timeWorker = new Timerworker({
  pulses: Pulses,
  audioContext: toneContext,
});
let initialized = false;

function init() {
  Controls.init();
  const sequencer = new Sequencer(Pulses);
  sequencer.initialize();
}

// handle start / pause
playBtn?.addEventListener("click", async () => await handleStart());

async function handleStart() {
  if (!initialized) {
    await Audio.init(toneContext);
    timeWorker.start(ui);
    initialized = true;
  }
  if (!Controls.isPlaying) toneContext.resume();
}
