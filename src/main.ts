import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
playBtn?.addEventListener("click", () => {
  Timerworker.start();
});

function init() {
  Controls.init();
  Audio.init();
  const getTotalSteps = (subdivisions: number) => subdivisions * 4;
  Sequencer.register(new Stepper({ steps: getTotalSteps(2) }));
  Sequencer.register(new Stepper({ steps: getTotalSteps(4) }));
  Sequencer.register(new Stepper({ steps: getTotalSteps(8) }));
}
