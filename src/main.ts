import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
playBtn?.addEventListener("click", () => {
  Timerworker.start();
  // Audio.playDefault();
});

function init() {
  Controls.init();
  Audio.init();
  const getTotalSteps = (subdivisions: number) => subdivisions * 4;
  const defaultStepper = new Stepper({ steps: getTotalSteps(4) });
  // new Stepper({ steps: 25 });

  const seq = new Sequencer(Timerworker);
  seq.register(defaultStepper);
}
