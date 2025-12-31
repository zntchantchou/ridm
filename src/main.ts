import Controls from "./components/Controls";
import Timerworker from "./modules/Timerworker";
import Sequencer from "./modules/Sequencer";
import Audio from "./modules/Audio";
import Pulses from "./modules/Pulses";
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

async function init() {
  Controls.init();
  await Audio.init(toneContext);
  const sequencer = new Sequencer(Pulses);
  await sequencer.initialize();
}

// handle start / pause
playBtn?.addEventListener("click", async () => await handleStart());

async function handleStart() {
  if (!initialized) {
    await Audio.start();
    timeWorker.start(ui);
    initialized = true;
  }
  if (!Controls.isPlaying) toneContext.resume();
}
