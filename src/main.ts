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
const timeWorker = new Timerworker({ pulses, audioContext: ac });

function init() {
  Controls.init();
  Audio.init();
  const sequencer = new Sequencer(pulses);
  // BREAKING SEQUENCE
  // sequencer.register(new Stepper({ beats: 1, stepsPerBeat: 4 })); // DROPPED
  for (let i = 0; i < 3; i++) {
    sequencer.register(new Stepper({ beats: 2, stepsPerBeat: i + 1 }));
    sequencer.register(new Stepper({ beats: 3, stepsPerBeat: i + 1 }));
    sequencer.register(new Stepper({ beats: 4, stepsPerBeat: i + 1 }));
    sequencer.register(new Stepper({ beats: 5, stepsPerBeat: i + 1 })); // DROPPED
  }
  // sequencer.register(new Stepper({ beats: 5, stepsPerBeat: 5 }));

  // console.log("--------- LEAD PULSES @ INIT --------");
  // sequencer.pulses?.getLeadPulses().map(console.log);
  // console.log("--------- ALL PULSES @ INIT --------");
  // sequencer.pulses?.getElements().map(console.log);
  // sequencer.register(new Stepper({ beats: 7, stepsPerBeat: 1 }));
  // sequencer.register(new Stepper({ beats: 4, stepsPerBeat: 3 }));
}
// handle start / pause
playBtn?.addEventListener("click", () => {
  // user gesture is needed to start the initiated audio context;
  ac.resume();
  timeWorker.start(ui);
});
